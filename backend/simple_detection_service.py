from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from ultralytics import YOLO
import cv2
import base64
import time
import threading
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

class SimpleDetectionService:
    def __init__(self, model_path=r".\best.pt"):
        try:
            self.model = YOLO(model_path)
            logger.info("YOLO model loaded successfully")
        except Exception as e:
            logger.error(f"YOLO model loaded failed: {e}")
            self.model = None
            
        self.camera = None
        self.is_running = False
        self.current_frame = None
        self.current_detections = []
        
        self.statistics = {
            'total_detections': 0,
            'plastic_types': {},
            'detection_confidence_avg': 0.0,
            'session_start_time': None,
            'current_fps': 0
        }
        
    def start_camera(self, camera_id=0):
        try:
            if self.camera:
                self.camera.release()
                
            self.camera = cv2.VideoCapture(camera_id)
            
            if not self.camera.isOpened():
                raise Exception(f"camera {camera_id} cannot be opened")
                
            ret, frame = self.camera.read()
            if not ret:
                raise Exception("camera cannot read frame")
                
            logger.info(f"camera {camera_id} started successfully")
            return True
            
        except Exception as e:
            logger.error(f"camera startup failed: {e}")
            if self.camera:
                self.camera.release()
                self.camera = None
            return False
    
    def update_statistics(self, class_name, confidence):
        self.statistics['total_detections'] += 1
        
        if class_name not in self.statistics['plastic_types']:
            self.statistics['plastic_types'][class_name] = 0
        self.statistics['plastic_types'][class_name] += 1
        
        total = self.statistics['total_detections']
        current_avg = self.statistics['detection_confidence_avg']
        self.statistics['detection_confidence_avg'] = (current_avg * (total - 1) + confidence) / total

    def capture_frame(self):
        if not self.camera:
            return None
            
        try:
            ret, frame = self.camera.read()
            if not ret:
                logger.warning("cannot read camera frame")
                return None
                
            current_detections = []
            
            if self.model:
                try:
                    results = self.model.predict(frame, conf=0.3, verbose=False)
                    if results and len(results) > 0:
                        annotated_frame = results[0].plot()
                        
                        if results[0].boxes is not None:
                            for box in results[0].boxes:
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
                                
                                self.update_statistics(class_name, confidence)
                    else:
                        annotated_frame = frame
                except Exception as e:
                    logger.warning(f"detection processing failed, using original frame: {e}")
                    annotated_frame = frame
            else:
                annotated_frame = frame
                

            self.current_detections = current_detections
                
            _, buffer = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            
            self.current_frame = frame_base64
            return frame_base64
            
        except Exception as e:
            logger.error(f"frame processing failed: {e}")
            return None
    
    def start_detection(self, camera_id=0):
        if self.is_running:
            return True
            
        if not self.start_camera(camera_id):
            return False
            
        self.is_running = True
        
        self.statistics = {
            'total_detections': 0,
            'plastic_types': {},
            'detection_confidence_avg': 0.0,
            'session_start_time': time.time(),
            'current_fps': 0
        }
        
        def capture_loop():
            frame_count = 0
            fps_start_time = time.time()
            
            while self.is_running:
                try:
                    self.capture_frame()
                    
                    frame_count += 1
                    if frame_count % 30 == 0:
                        elapsed = time.time() - fps_start_time
                        self.statistics['current_fps'] = 30 / elapsed if elapsed > 0 else 0
                        fps_start_time = time.time()
                    
                    time.sleep(0.1)  
                except Exception as e:
                    logger.error(f"capture loop failed: {e}")
                    time.sleep(1)
                    
        self.capture_thread = threading.Thread(target=capture_loop)
        self.capture_thread.daemon = True
        self.capture_thread.start()
        
        logger.info("detection service started")
        return True
    
    def stop_detection(self):
        self.is_running = False
        if self.camera:
            self.camera.release()
            self.camera = None
        self.current_frame = None
        self.current_detections = []
        logger.info("detection service stopped")

detection_service = SimpleDetectionService()

@app.route('/api/detection/start', methods=['POST'])
def start_detection():
    try:
        data = request.get_json() or {}
        camera_id = data.get('camera_id', 0)
        
        if detection_service.start_detection(camera_id):
            return jsonify({
                'status': 'success',
                'message': 'detection started'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'camera startup failed'
            }), 500
            
    except Exception as e:
        logger.error(f"detection startup failed: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/detection/stop', methods=['POST'])
def stop_detection():
    try:
        detection_service.stop_detection()
        return jsonify({
            'status': 'success',
            'message': 'detection stopped'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/detection/frame', methods=['GET'])
def get_frame():
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
                'message': 'no frame available'
            }), 404
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/detection/status', methods=['GET'])
def get_status():
    return jsonify({
        'is_running': detection_service.is_running,
        'has_frame': detection_service.current_frame is not None,
        'model_loaded': detection_service.model is not None,
        'statistics': detection_service.statistics
    })

@app.route('/api/detection/statistics/reset', methods=['POST'])
def reset_statistics():
    try:
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
            'message': 'statistics reset'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    try:
        logger.info("simplified YOLO detection service starting...")
        logger.info("service address: http://localhost:5001")
        app.run(host='0.0.0.0', port=5001, debug=False, threaded=True)
    except KeyboardInterrupt:
        logger.info("service is closing...")
        detection_service.stop_detection()
    except Exception as e:
        logger.error(f"service startup failed: {e}") 