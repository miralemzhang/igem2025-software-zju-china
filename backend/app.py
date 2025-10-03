from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from flask import send_from_directory
import os
import sys

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)
CORS(app)

# 导入蛋白分析功能
try:
    from protein_analysis_api import (
        upload_protein_data, 
        get_protein_data, 
        get_analysis_chart, 
        protein_chat,
        get_correlation_analysis,
        get_fitting_results
    )
    
    # 注册蛋白分析路由
    app.add_url_rule('/api/protein-upload', 'protein_upload', upload_protein_data, methods=['POST'])
    app.add_url_rule('/api/protein-data', 'protein_data', get_protein_data, methods=['GET'])
    app.add_url_rule('/api/protein-analysis-chart', 'protein_chart', get_analysis_chart, methods=['GET'])
    app.add_url_rule('/api/protein-chat', 'protein_chat_route', protein_chat, methods=['POST'])
    app.add_url_rule('/api/protein-correlation', 'protein_correlation', get_correlation_analysis, methods=['GET'])
    app.add_url_rule('/api/protein-fitting', 'protein_fitting', get_fitting_results, methods=['GET'])
    
except ImportError as e:
    print(f"Warning: Could not import protein analysis functions: {e}")
    
    # 提供备用路由
    @app.route('/api/protein-upload', methods=['POST'])
    def protein_upload_fallback():
        return jsonify({'error': '蛋白分析模块未正确加载'}), 500
    
    @app.route('/api/protein-data', methods=['GET'])
    def protein_data_fallback():
        return jsonify([])
    
    @app.route('/api/protein-analysis-chart', methods=['GET'])
    def protein_chart_fallback():
        return jsonify({'error': '图表生成模块未正确加载'}), 500
    
    @app.route('/api/protein-chat', methods=['POST'])
    def protein_chat_fallback():
        return jsonify({'reply': '聊天功能暂时不可用，请稍后再试。'})
    
    @app.route('/api/protein-correlation', methods=['GET'])
    def protein_correlation_fallback():
        return jsonify({'error': '相关性分析模块未正确加载'}), 500
    
    @app.route('/api/protein-fitting', methods=['GET'])
    def protein_fitting_fallback():
        return jsonify({'error': '拟合分析模块未正确加载'}), 500

@app.route('/api/hello')
def hello():
    return jsonify({"message": "CopyRight  ©  ZJU-CHINA 2025- . All rights reserved.  "})

@app.route('/api/image')
def get_image():
    return send_from_directory('images', 'ZJU1.png')

@app.route('/api/images')
def get_images():
    """获取所有可用图片的列表"""
    return jsonify({"images": ["ZJU1.png", "ZJU2.png"]})

@app.route('/api/image/<filename>')
def get_specific_image(filename):
    """获取指定的图片文件"""
    return send_from_directory('images', filename)

if __name__ == '__main__':
    app.run(port=5030)
