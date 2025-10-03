from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import re
import json
import base64
import time

app = Flask(__name__)
CORS(app)
# RAG API address     #############################################################
RAG_API_URL = "https://bce2c9efffef.ngrok-free.app"      ############################
###################################################################################

# Sensor Layer API address
SENSOR_API_URL = "http://localhost:5002"

def parse_sensor_parameters(user_message):
    params = {

    }
    
    a_total_match = re.search(r'A[_\s]*total[=\s]*([0-9.]+)', user_message, re.IGNORECASE)
    if a_total_match:
        params['A_total'] = float(a_total_match.group(1))
    
    # parse Dop_total parameter
    dop_total_match = re.search(r'Dop[_\s]*total[=\s]*([0-9.]+)', user_message, re.IGNORECASE)
    if dop_total_match:
        params['Dop_total'] = float(dop_total_match.group(1))
    
    # parse pollutant concentration
    pollutant_match = re.search(r'污染物浓度[=\s]*\[([0-9,.\s]+)\]', user_message)
    if not pollutant_match:
        pollutant_match = re.search(r'pollutant[_\s]*concentrations?[=\s]*\[([0-9,.\s]+)\]', user_message, re.IGNORECASE)
    if pollutant_match:
        concentrations_str = pollutant_match.group(1)
        params['pollutant_concentrations'] = [float(x.strip()) for x in concentrations_str.split(',') if x.strip()]
    
    # parse reaction constants
    kf1_match = re.search(r'kf1[=\s]*([0-9.]+)', user_message, re.IGNORECASE)
    if kf1_match:
        params['kf1'] = float(kf1_match.group(1))
        
    kr1_match = re.search(r'kr1[=\s]*([0-9.]+)', user_message, re.IGNORECASE)
    if kr1_match:
        params['kr1'] = float(kr1_match.group(1))
        
    kf2_match = re.search(r'kf2[=\s]*([0-9.]+)', user_message, re.IGNORECASE)
    if kf2_match:
        params['kf2'] = float(kf2_match.group(1))
        
    kr2_match = re.search(r'kr2[=\s]*([0-9.]+)', user_message, re.IGNORECASE)
    if kr2_match:
        params['kr2'] = float(kr2_match.group(1))
    
    # parse time parameter
    time_match = re.search(r'时间[=\s]*([0-9.]+)', user_message)
    if not time_match:
        time_match = re.search(r'T[=\s]*([0-9.]+)', user_message, re.IGNORECASE)
    if time_match:
        params['T'] = float(time_match.group(1))
    
    return params

def generate_sensor_image(params):
    try:
        response = requests.post(
            f"{SENSOR_API_URL}/api/sensor-layer",
            json=params,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        if response.status_code == 200:
            result = response.json()
            if result.get('status') == 'success':
                filename = result.get('filename')
                img_response = requests.get(
                    f"{SENSOR_API_URL}/api/sensor-layer-image/{filename}",
                    timeout=30
                )
                if img_response.status_code == 200:
                    img_base64 = base64.b64encode(img_response.content).decode('utf-8')
                    return {
                        'status': 'success',
                        'image_data': img_base64,
                        'filename': filename,
                        'message': 'Sure, here is the result image exactly as you requested!'
                    }
                else:
                    return {'status': 'error', 'message': 'Unable to get the generated image file'}
            else:
                return {'status': 'error', 'message': result.get('message', 'Image generation failed')}
        else:
            return {'status': 'error', 'message': f'API call failed: HTTP {response.status_code}'}
    except Exception as e:
        return {'status': 'error', 'message': f'Error occurred during image generation: {str(e)}'}

@app.route('/agent-chat', methods=['POST'])
def agent_chat():
    data = request.get_json()
    user_message = data.get('message', '')
    #SIMPLE GENERATION FUNCTION EXAMPLE
    if 'generate a image' or 'Generate a image' in user_message.lower():
        time.sleep(3.5)
        reply = "Sure, I'm generating the image, please wait..."

        try:
            params = parse_sensor_parameters(user_message)
            result = generate_sensor_image(params)
            
            if result['status'] == 'success':
                reply = {
                    'type': 'image',
                    'message': result['message'],
                    'image_data': result['image_data'],
                    'parameters_used': params
                }
            else:
                reply = f"Image generation failed: {result['message']}"
        except Exception as e:
            reply = f"Error occurred during image generation: {str(e)}"
    
    else:
        try:
            payload = {
                "query": user_message,
                "top_k": 3,
                "max_length": 512,
                "temperature": 0.7
            }
            response = requests.post(
                f"{RAG_API_URL}/chat",
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=60
            )
            if response.status_code == 200:
                result = response.json()
                reply = result.get('answer', 'No answer received')
            else:
                error_msg = f"[RAG service exception] HTTP {response.status_code}: {response.text}"
                print(error_msg)
                reply = error_msg
        except Exception as e:
            print(f"[RAG service request failed]: {e}")
            reply = f"[RAG service request failed]: {e}"
    return jsonify({"reply": reply})

if __name__ == '__main__':
    app.run(port=5000, debug=True) 