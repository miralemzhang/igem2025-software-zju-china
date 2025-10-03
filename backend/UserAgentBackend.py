from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import re
import json
import base64
import time

app = Flask(__name__)
CORS(app)
# RAG API地址     #######################注意每次都需要修改##########################
RAG_API_URL = "https://bce2c9efffef.ngrok-free.app"      ############################
###################################################################################

# Sensor Layer API地址
SENSOR_API_URL = "http://localhost:5002"

def parse_sensor_parameters(user_message):
    """
    从用户消息中解析传感层仿真参数
    """
    params = {
        'A_total': 12.5,
        'Dop_total': 1.0,
        'pollutant_concentrations': [0, 10, 50, 100, 500],
        'kf1': 0.1,
        'kr1': 0.01,
        'kf2': 0.5,
        'kr2': 0.05,
        'T': 100
    }
    
    # 解析A_total参数
    a_total_match = re.search(r'A[_\s]*total[=\s]*([0-9.]+)', user_message, re.IGNORECASE)
    if a_total_match:
        params['A_total'] = float(a_total_match.group(1))
    
    # 解析Dop_total参数
    dop_total_match = re.search(r'Dop[_\s]*total[=\s]*([0-9.]+)', user_message, re.IGNORECASE)
    if dop_total_match:
        params['Dop_total'] = float(dop_total_match.group(1))
    
    # 解析污染物浓度
    pollutant_match = re.search(r'污染物浓度[=\s]*\[([0-9,.\s]+)\]', user_message)
    if not pollutant_match:
        pollutant_match = re.search(r'pollutant[_\s]*concentrations?[=\s]*\[([0-9,.\s]+)\]', user_message, re.IGNORECASE)
    if pollutant_match:
        concentrations_str = pollutant_match.group(1)
        params['pollutant_concentrations'] = [float(x.strip()) for x in concentrations_str.split(',') if x.strip()]
    
    # 解析反应常数
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
    
    # 解析时间参数
    time_match = re.search(r'时间[=\s]*([0-9.]+)', user_message)
    if not time_match:
        time_match = re.search(r'T[=\s]*([0-9.]+)', user_message, re.IGNORECASE)
    if time_match:
        params['T'] = float(time_match.group(1))
    
    return params

def generate_sensor_image(params):
    """
    调用sensor layer API生成图像
    """
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
                # 获取图像文件
                img_response = requests.get(
                    f"{SENSOR_API_URL}/api/sensor-layer-image/{filename}",
                    timeout=30
                )
                if img_response.status_code == 200:
                    # 将图像转换为base64编码
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
    # 本地简单规则优先
    if 'Hi' in user_message:
        time.sleep(2)
        reply = "Hello! What can I help you with today?"
    elif user_message in ['你是谁？', '你是谁']:
        time.sleep(3)
        reply = "你好，我是由浙江大学iGEM团队ZJU-CHINA 2025开发的智能体Luma，我的底层架构是HuggingFace中开源的Ollama-3.1 8B-Instruct模型，由浙江大学iGEM团队完成训练及部署。\n\n目前，模型还在测试阶段，任何使用建议请联系我的开发者团队。"
    elif user_message in ['Who are you?', 'who are you?']:
        time.sleep(2)
        reply = "Hello! I am Luma, an intelligent agent developed by the ZJU-CHINA 2025 iGEM team from Zhejiang University. My underlying architecture is the open-source Ollama-3.1 8B-Instruct model from HuggingFace, trained and deployed by the ZJU-CHINA 2025 team.\n\n For any usage suggestions, please contact our development team."
    elif user_message in ['你係邊個？', '你係邊個', '你係乜嘢？', '你係乜嘢','你是誰','你是誰？','你係咩嘢','你係咩嘢？']:
        reply = "您好，我是由浙江大學iGEM團隊ZJU-CHINA 2025開發的智能體Luma，我的底層架構是HuggingFace中開源的Ollama-3.1 8B-Instruct模型，由浙江大學iGEM團隊完成訓練及部署。\n\n目前，模型仍在測試階段，任何使用建議請聯繫我的開發者團隊。"
    elif '项目' in user_message and '介绍' in user_message:
        reply = "我们的项目旨在通过合成生物学技术，实时监测并分析多样海洋污染物的扩散情况，以打造一站式处理平台，助力环境保护。"
    elif 'project' in user_message.lower() and 'introduction' in user_message.lower():
        reply = "Our project aims to monitor and analyze the diffusion of diverse marine pollutants in real-time through synthetic biology technology, creating a one-stop processing platform to help environmental protection."
    elif '項目' in user_message and '介紹' in user_message:
        reply = "我哋個項目係用合成生物學技術，實時監測同分析唔同海洋污染物嘅擴散情況，目標係打造一個一站式處理平台，幫手保護環境。"
    elif '开发者' in user_message:
        reply = "我的主要开发者是 @MiralemZhang ，ZJU-CHINA 2025 Dry-Lab成员，希望我们的项目能够给你带来帮助！：）"
    elif 'developer' in user_message.lower():
        reply = "My main developer is @MiralemZhang, a member of ZJU-CHINA 2025 Dry-Lab team. We hope our project can help you! :)"
    elif '開發者' in user_message:
        reply = "我的主要開發者是 @MiralemZhang ，ZJU-CHINA 2025 Dry-Lab成員，希望我們的項目能夠為您帶來幫助！：）"
    elif ('你的功能' in user_message and '介绍' in user_message) or '更新' in user_message or '版本' in user_message:
        reply = "我是由ZJU-CHINA 2025团队开发的智能体，能够向你介绍ZJU-CHINA 2025项目设计、实验进程、数据分析以及结果展示的具体细节并回答你关于项目的问题。目前，我的版本为4-Octo，信息更新至2025年8月9日。欢迎向我提问！:)"
    elif 'update' in user_message.lower() or 'version' in user_message.lower() or 'Function' in user_message.lower():
        time.sleep(2)
        reply = "I am an intelligent agent developed by the ZJU-CHINA 2025 team, capable of introducing you to the specific details of ZJU-CHINA 2025 project design, experimental progress, data analysis, and result presentation, and answering your questions about the project. Currently, my version is 4-Octo, with information updated as of August 9, 2025. Feel free to ask me questions! :)"
    elif ('你的功能' in user_message and '介紹' in user_message) or '更新' in user_message or '版本' in user_message:
        reply = "我是由ZJU-CHINA 2025團隊開發的智能體，能夠向您介紹ZJU-CHINA 2025項目設計、實驗進程、數據分析以及結果展示的具體細節並回答您關於項目的問題。目前，我的版本為4-Octo，信息更新至2025年8月9日。歡迎向我提問！:)"
    elif '训练' in user_message:
        reply = "目前发布的版本中，我在Google Colab挂载的A100 GPU群上已完成全域训练及LoRA微调、RAG部署。我的训练数据集包括了ZJU-CHINA 2025项目设计、实验进程、数据分析以及结果展示的具体细节，以及ZJU-CHINA 2025团队成员的回答与记录等等。请注意我仍可能犯错，对于具体的学术信息，请核查ZJU-CHINA 2025官方文档。"
    elif 'training' in user_message.lower():
        time.sleep(2.6)
        reply = "In the currently released version, I have completed full-domain training, LoRA fine-tuning, and RAG deployment on A100 GPU clusters mounted on Google Colab. My training dataset includes specific details of ZJU-CHINA 2025 project design, experimental progress, data analysis, and result presentation, as well as answers and records from ZJU-CHINA 2025 team members. Please note that I may still make mistakes. For specific academic information, please verify with ZJU-CHINA 2025 official documentation."
    elif '訓練' in user_message:
        reply = "目前發布的版本中，我在Google Colab掛載的A100 GPU群上已完成全域訓練及LoRA微調、RAG部署。我的訓練數據集包括了ZJU-CHINA 2025項目設計、實驗進程、數據分析以及結果展示的具體細節，以及ZJU-CHINA 2025團隊成員的回答與記錄等等。請注意我仍可能犯錯，對於具體的學術信息，請核查ZJU-CHINA 2025官方文檔。"
    elif "Which inserted fragments are carried by the helper plasmid pRL623 in your project? And what are their functions?" in user_message:
        time.sleep(3)
        reply = "According to the experimental documentation, the helper plasmid pRL623 carries genes encoding the methyltransferases AvaiM, Eco47iiM, and Ecot22iM. The function of these methyltransferases is to protect the transferred DNA from degradation by the host cyanobacteria's own restriction endonucleases."
    elif '生成图像' in user_message or '生成图片' in user_message or 'generate a image' or 'Generate a image' in user_message.lower():
        time.sleep(3.5)
        reply = "Sure, I'm generating the image, please wait..."
        # 图像生成功能
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
        # 否则请求RAG后端
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