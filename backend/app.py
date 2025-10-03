from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from flask import send_from_directory
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)
CORS(app)

try:
    from protein_analysis_api import (
        upload_protein_data, 
        get_protein_data, 
        get_analysis_chart, 
        protein_chat,
        get_correlation_analysis,
        get_fitting_results
    )

    app.add_url_rule('/api/protein-upload', 'protein_upload', upload_protein_data, methods=['POST'])
    app.add_url_rule('/api/protein-data', 'protein_data', get_protein_data, methods=['GET'])
    app.add_url_rule('/api/protein-analysis-chart', 'protein_chart', get_analysis_chart, methods=['GET'])
    app.add_url_rule('/api/protein-chat', 'protein_chat_route', protein_chat, methods=['POST'])
    app.add_url_rule('/api/protein-correlation', 'protein_correlation', get_correlation_analysis, methods=['GET'])
    app.add_url_rule('/api/protein-fitting', 'protein_fitting', get_fitting_results, methods=['GET'])
    
except ImportError as e:
    print(f"Warning: Could not import protein analysis functions: {e}")
 
    @app.route('/api/protein-upload', methods=['POST'])
    def protein_upload_fallback():
        return jsonify({'error': 'protein'}), 500
    
    @app.route('/api/protein-data', methods=['GET'])
    def protein_data_fallback():
        return jsonify([])
    
    @app.route('/api/protein-analysis-chart', methods=['GET'])
    def protein_chart_fallback():
        return jsonify({'error': 'graph'}), 500
    
    @app.route('/api/protein-chat', methods=['POST'])
    def protein_chat_fallback():
        return jsonify({'reply': 'chat'})
    
    @app.route('/api/protein-correlation', methods=['GET'])
    def protein_correlation_fallback():
        return jsonify({'error': 'correlation-analysis'}), 500
    
    @app.route('/api/protein-fitting', methods=['GET'])
    def protein_fitting_fallback():
        return jsonify({'error': 'fitting-analysis'}), 500

@app.route('/api/hello')
def hello():
    return jsonify({"message": "CopyRight  ©  ZJU-CHINA 2025- . All rights reserved.  "})

@app.route('/api/image')
def get_image():
    return send_from_directory('images', 'ZJU1.png')

@app.route('/api/images')
def get_images():
    return jsonify({"images": ["ZJU1.png", "ZJU2.png"]})

@app.route('/api/image/<filename>')
def get_specific_image(filename):
    return send_from_directory('images', filename)

if __name__ == '__main__':
    app.run(port=5030)
