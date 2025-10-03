from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from ultralytics import YOLO
import cv2
import base64
import time
import threading
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

class SimpleDetectionService:
    def __init__(self, model_path=r"C:\Users\11960\Downloads\best.pt"):
        """初始化简化检测服务"""
        try:
            self.model = YOLO(model_path)
            logger.info("✅ YOLO模型加载成功")
        except Exception as e:
            logger.error(f"❌ YOLO模型加载失败: {e}")
            self.model = None
            
        self.camera = None
        self.is_running = False
        self.current_frame = None
        self.current_detections = []
        
        # 统计信息
        self.statistics = {
            'total_detections': 0,
            'plastic_types': {},
            'detection_confidence_avg': 0.0,
            'session_start_time': None,
            'current_fps': 0
        }
        
    def start_camera(self, camera_id=0):
        """启动摄像头"""
        try:
            if self.camera:
                self.camera.release()
                
            self.camera = cv2.VideoCapture(camera_id)
            
            # 简单的摄像头测试
            if not self.camera.isOpened():
                raise Exception(f"摄像头 {camera_id} 无法打开")
                
            # 读取一帧测试
            ret, frame = self.camera.read()
            if not ret:
                raise Exception("摄像头无法读取帧")
                
            logger.info(f"✅ 摄像头 {camera_id} 启动成功")
            return True
            
        except Exception as e:
            logger.error(f"❌ 摄像头启动失败: {e}")
            if self.camera:
                self.camera.release()
                self.camera = None
            return False
    
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

    def capture_frame(self):
        """捕获并处理单帧"""
        if not self.camera:
            return None
            
        try:
            ret, frame = self.camera.read()
            if not ret:
                logger.warning("⚠️ 无法读取摄像头帧")
                return None
                
            current_detections = []
            
            # 如果有模型则进行检测，否则直接返回原帧
            if self.model:
                try:
                    results = self.model.predict(frame, conf=0.3, verbose=False)
                    if results and len(results) > 0:
                        annotated_frame = results[0].plot()
                        
                        # 处理检测结果
                        if results[0].boxes is not None:
                            for box in results[0].boxes:
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
                                    'timestamp': time.time()
                                }
                                current_detections.append(detection)
                                
                                # 更新统计信息
                                self.update_statistics(class_name, confidence)
                    else:
                        annotated_frame = frame
                except Exception as e:
                    logger.warning(f"⚠️ 检测处理失败，使用原帧: {e}")
                    annotated_frame = frame
            else:
                annotated_frame = frame
                
            # 更新当前检测结果
            self.current_detections = current_detections
                
            # 编码为base64
            _, buffer = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            
            self.current_frame = frame_base64
            return frame_base64
            
        except Exception as e:
            logger.error(f"❌ 帧处理错误: {e}")
            return None
    
    def start_detection(self, camera_id=0):
        """启动检测"""
        if self.is_running:
            return True
            
        if not self.start_camera(camera_id):
            return False
            
        self.is_running = True
        
        # 重置统计信息
        self.statistics = {
            'total_detections': 0,
            'plastic_types': {},
            'detection_confidence_avg': 0.0,
            'session_start_time': time.time(),
            'current_fps': 0
        }
        
        # 启动捕获线程
        def capture_loop():
            frame_count = 0
            fps_start_time = time.time()
            
            while self.is_running:
                try:
                    self.capture_frame()
                    
                    # 计算FPS
                    frame_count += 1
                    if frame_count % 30 == 0:
                        elapsed = time.time() - fps_start_time
                        self.statistics['current_fps'] = 30 / elapsed if elapsed > 0 else 0
                        fps_start_time = time.time()
                    
                    time.sleep(0.1)  # 控制帧率约10fps
                except Exception as e:
                    logger.error(f"❌ 捕获循环错误: {e}")
                    time.sleep(1)
                    
        self.capture_thread = threading.Thread(target=capture_loop)
        self.capture_thread.daemon = True
        self.capture_thread.start()
        
        logger.info("🎬 检测服务已启动")
        return True
    
    def stop_detection(self):
        """停止检测"""
        self.is_running = False
        if self.camera:
            self.camera.release()
            self.camera = None
        self.current_frame = None
        self.current_detections = []
        logger.info("⏹️ 检测服务已停止")

# 全局服务实例
detection_service = SimpleDetectionService()

@app.route('/api/detection/start', methods=['POST'])
def start_detection():
    """启动检测API"""
    try:
        data = request.get_json() or {}
        camera_id = data.get('camera_id', 0)
        
        if detection_service.start_detection(camera_id):
            return jsonify({
                'status': 'success',
                'message': '检测已启动'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': '摄像头启动失败'
            }), 500
            
    except Exception as e:
        logger.error(f"❌ 启动检测错误: {e}")
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
            'message': '检测已停止'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/detection/frame', methods=['GET'])
def get_frame():
    """获取当前帧和检测数据"""
    try:
        if detection_service.current_frame:
            return jsonify({
                'status': 'success',
                'frame': detection_service.current_frame,
                'detections': detection_service.current_detections,
                'statistics': detection_service.statistics,
                'timestamp': time.time()
            })
        else:
            return jsonify({
                'status': 'error',
                'message': '暂无可用帧'
            }), 404
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/detection/status', methods=['GET'])
def get_status():
    """获取检测状态"""
    return jsonify({
        'is_running': detection_service.is_running,
        'has_frame': detection_service.current_frame is not None,
        'model_loaded': detection_service.model is not None,
        'statistics': detection_service.statistics
    })

@app.route('/api/detection/statistics/reset', methods=['POST'])
def reset_statistics():
    """重置统计信息"""
    try:
        detection_service.statistics = {
            'total_detections': 0,
            'plastic_types': {},
            'detection_confidence_avg': 0.0,
            'session_start_time': time.time(),
            'current_fps': 0
        }
        return jsonify({
            'status': 'success',
            'message': '统计信息已重置'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    try:
        logger.info("🚀 简化YOLO检测服务启动中...")
        logger.info("📍 服务地址: http://localhost:5001")
        app.run(host='0.0.0.0', port=5001, debug=False, threaded=True)
    except KeyboardInterrupt:
        logger.info("🛑 服务正在关闭...")
        detection_service.stop_detection()
    except Exception as e:
        logger.error(f"❌ 服务启动失败: {e}") 