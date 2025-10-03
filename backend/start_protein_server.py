#!/usr/bin/env python3
"""
光控蛋白生产分析系统后端启动脚本
启动前请确保已安装所需依赖：pip install -r requirements.txt
"""

import os
import sys
from app import app

def main():
    print("=" * 60)
    print("iLUMA 光控蛋白生产分析系统")
    print("ZJU-CHINA iGEM 2025")
    print("=" * 60)
    print()
    
    # 检查依赖
    try:
        import pandas
        import numpy
        import matplotlib
        import seaborn
        print("✓ 所有依赖项已正确安装")
    except ImportError as e:
        print(f"✗ 缺少依赖项: {e}")
        print("请运行: pip install -r requirements.txt")
        return
    
    print("✓ 后端服务正在启动...")
    print("✓ API端点:")
    print("  - /api/protein-upload (POST) - 上传实验数据")
    print("  - /api/protein-data (GET) - 获取分析数据")
    print("  - /api/protein-analysis-chart (GET) - 获取可视化图表")
    print("  - /api/protein-chat (POST) - 智能分析助手")
    print()
    print("服务器地址: http://localhost:5000")
    print("按 Ctrl+C 停止服务器")
    print("=" * 60)
    
    try:
        app.run(host='0.0.0.0', port=5000, debug=True)
    except KeyboardInterrupt:
        print("\n服务器已停止")

if __name__ == '__main__':
    main()

