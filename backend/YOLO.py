from ultralytics import YOLO
import cv2

model = YOLO(r".\best.pt")
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("cannot open camera")
    exit()

print("camera started, press Q to exit detection")

while True:
    ret, frame = cap.read()
    if not ret:
        print("cannot read video frame")
        break

    results = model.predict(frame, conf=0.2)

    annotated_frame = results[0].plot()

    cv2.imshow("YOLO Plastic Detection for iLUMA       COPYRIGHT @ ZJU-China 2025 Dry Lab", annotated_frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
    
cap.release()
cv2.destroyAllWindows()
