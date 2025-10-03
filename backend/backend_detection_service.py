from flask import Flask, request, jsonify, Response
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from ultralytics import YOLO
import cv2
import numpy as np
import base64
import json
import threading
import time
from datetime import datetime
import queue
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'yolo_detection_secret'
CORS(app, origins=["http://localhost:3000"])
socketio = SocketIO(app, cors_allowed_origins="http://localhost:3000")

class YOLODetectionService:
    def __init__(self, model_path=r"C:\Users\11960\Downloads\best.pt"):
        """初始化YOLO检测服务"""
        self.model = YOLO(model_path)
        self.is_running = False
        self.camera = None
        self.detection_thread = None
        self.detection_results = queue.Queue(maxsize=100)
        self.statistics = {
            'total_detections': 0,
            'plastic_types': {},
            'detection_confidence_avg': 0.0,
            'session_start_time': None
        }
        
    def start_camera(self, camera_id=0):
        """启动摄像头"""
        try:
            self.camera = cv2.VideoCapture(camera_id)
            if not self.camera.isOpened():
                raise Exception(f"无法打开摄像头 {camera_id}")
            
            # 设置摄像头参数
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.camera.set(cv2.CAP_PROP_FPS, 30)
            
            logger.info(f"摄像头 {camera_id} 启动成功")
            return True
        except Exception as e:
            logger.error(f"摄像头启动失败: {e}")
            return False
    
    def stop_camera(self):
        """停止摄像头"""
        if self.camera:
            self.camera.release()
            self.camera = None
            logger.info("摄像头已停止")
    
    def detect_frame(self, frame):
        """对单帧进行检测"""
        try:
            results = self.model.predict(frame, conf=0.2, verbose=False)
            detections = []
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        # 提取检测信息
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = float(box.conf[0].cpu().numpy())
                        class_id = int(box.cls[0].cpu().numpy())
                        class_name = self.model.names[class_id]
                        
                        detection = {
                            'bbox': [float(x1), float(y1), float(x2), float(y2)],
                            'confidence': confidence,
                            'class_id': class_id,
                            'class_name': class_name,
                            'timestamp': datetime.now().isoformat()
                        }
                        detections.append(detection)
                        
                        # 更新统计信息
                        self.update_statistics(class_name, confidence)
            
            # 绘制检测结果
            annotated_frame = results[0].plot() if results else frame
            
            return annotated_frame, detections
            
        except Exception as e:
            logger.error(f"检测错误: {e}")
            return frame, []
    
    def update_statistics(self, class_name, confidence):
        """更新检测统计信息"""
        self.statistics['total_detections'] += 1
        
        if class_name not in self.statistics['plastic_types']:
            self.statistics['plastic_types'][class_name] = 0
        self.statistics['plastic_types'][class_name] += 1
        
        # 更新平均置信度
        total = self.statistics['total_detections']
        current_avg = self.statistics['detection_confidence_avg']
        self.statistics['detection_confidence_avg'] = (current_avg * (total - 1) + confidence) / total
    
    def start_detection(self):
        """开始检测循环"""
        if self.is_running:
            return False
            
        if not self.start_camera():
            return False
            
        self.is_running = True
        self.statistics['session_start_time'] = datetime.now().isoformat()
        self.detection_thread = threading.Thread(target=self._detection_loop)
        self.detection_thread.daemon = True
        self.detection_thread.start()
        
        logger.info("检测服务已启动")
        return True
    
    def stop_detection(self):
        """停止检测"""
        self.is_running = False
        if self.detection_thread:
            self.detection_thread.join()
        self.stop_camera()
        logger.info("检测服务已停止")
    
    def _detection_loop(self):
        """检测主循环"""
        frame_count = 0
        fps_start_time = time.time()
        
        while self.is_running:
            try:
                ret, frame = self.camera.read()
                if not ret:
                    logger.warning("无法读取摄像头帧")
                    continue
                
                # 执行检测
                annotated_frame, detections = self.detect_frame(frame)
                
                # 编码图像为base64
                _, buffer = cv2.imencode('.jpg', annotated_frame, 
                                       [cv2.IMWRITE_JPEG_QUALITY, 85])
                frame_base64 = base64.b64encode(buffer).decode('utf-8')
                
                # 计算FPS
                frame_count += 1
                if frame_count % 30 == 0:
                    elapsed = time.time() - fps_start_time
                    fps = 30 / elapsed if elapsed > 0 else 0
                    fps_start_time = time.time()
                else:
                    fps = 0
                
                # 发送数据到前端
                detection_data = {
                    'frame': frame_base64,
                    'detections': detections,
                    'statistics': self.statistics.copy(),
                    'fps': fps,
                    'timestamp': datetime.now().isoformat()
                }
                
                socketio.emit('detection_update', detection_data)
                
                # 控制帧率
                time.sleep(0.1)  # ~30 FPS
                
            except Exception as e:
                logger.error(f"检测循环错误: {e}")
                time.sleep(1)

# 全局检测服务实例
detection_service = YOLODetectionService()

@app.route('/api/detection/start', methods=['POST'])
def start_detection():
    """启动检测API"""
    try:
        camera_id = request.json.get('camera_id', 0)
        detection_service.camera_id = camera_id
        
        if detection_service.start_detection():
            return jsonify({
                'status': 'success',
                'message': '检测已启动',
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'status': 'error',
                'message': '检测启动失败'
            }), 500
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/detection/stop', methods=['POST'])
def stop_detection():
    """停止检测API"""
    try:
        detection_service.stop_detection()
        return jsonify({
            'status': 'success',
            'message': '检测已停止',
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/detection/status', methods=['GET'])
def get_detection_status():
    """获取检测状态API"""
    return jsonify({
        'is_running': detection_service.is_running,
        'statistics': detection_service.statistics,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/detection/statistics/reset', methods=['POST'])
def reset_statistics():
    """重置统计信息API"""
    detection_service.statistics = {
        'total_detections': 0,
        'plastic_types': {},
        'detection_confidence_avg': 0.0,
        'session_start_time': None
    }
    return jsonify({
        'status': 'success',
        'message': '统计信息已重置'
    })

@socketio.on('connect')
def handle_connect():
    """WebSocket连接处理"""
    logger.info('客户端已连接')
    emit('connection_status', {'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    """WebSocket断开处理"""
    logger.info('客户端已断开')

@socketio.on('request_detection_status')
def handle_status_request():
    """处理状态请求"""
    emit('detection_status', {
        'is_running': detection_service.is_running,
        'statistics': detection_service.statistics
    })

if __name__ == '__main__':
    try:
        logger.info("🚀 YOLO检测服务启动中...")
        logger.info("📍 服务地址: http://localhost:5001")
        logger.info("🔗 WebSocket地址: ws://localhost:5001")
        socketio.run(app, host='0.0.0.0', port=5001, debug=False)
    except KeyboardInterrupt:
        logger.info("🛑 服务正在关闭...")
        detection_service.stop_detection()
    except Exception as e:
        logger.error(f"❌ 服务启动失败: {e}") 