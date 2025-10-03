from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/strand_replace_result', methods=['POST'])
def strand_replace_result():
    data = request.get_json()
    strand_type = data.get('type')
    value = data.get('value')
    return jsonify({
        'status': 'success',
        'type': strand_type,
        'value': value
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003, debug=True) 