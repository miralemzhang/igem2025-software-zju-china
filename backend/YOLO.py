from ultralytics import YOLO
import cv2

# 1. 加载训练好的模型（换成你的 best.pt 路径）
model = YOLO(r"C:\Users\11960\Downloads\best.pt")

# 2. 打开摄像头（0 表示默认摄像头，外接摄像头可能是 1）
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ 无法打开摄像头")
    exit()

print("✅ 摄像头已启动，按 Q 退出检测")

while True:
    ret, frame = cap.read()
    if not ret:
        print("❌ 无法读取视频帧")
        break

    # 3. 模型推理（conf=0.25 表示置信度阈值）
    results = model.predict(frame, conf=0.2)

    # 4. 绘制检测结果
    annotated_frame = results[0].plot()

    # 5. 显示
    cv2.imshow("YOLO Plastic Detection for iLUMA       COPYRIGHT @ ZJU-China 2025 Dry Lab", annotated_frame)

    # 按 Q 退出
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# 释放资源
cap.release()
cv2.destroyAllWindows()
