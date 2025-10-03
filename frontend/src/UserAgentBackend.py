from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/agent-chat', methods=['POST'])
def agent_chat():
    data = request.get_json()
    user_message = data.get('message', '')
    # 简单回显逻辑，可替换为本地大模型推理
    if user_message in ['你是谁？', '你是谁']:
        reply = "你好，我是由浙江大学iGEM团队ZJU-CHINA 2025开发的智能体Luma，我的底层架构是HuggingFace中开源的Ollama 3 8B模型，由浙江大学iGEM团队完成训练及部署。\n\n"\
                "目前，模型还在测试阶段，任何使用建议请联系我的开发者团队。"
    elif '项目' in user_message and '介绍' in user_message:
        reply = "我们的项目旨在通过人工智能技术监测和分析海洋污染物的扩散情况，助力环境保护。"
    elif '开发者' in user_message:
        reply = "我的主要开发者是@MiralemZhang，ZJU-CHINA 2025 Dry-Lab干队成员，希望我们的项目能够给你带来帮助！：）"
    else:
        reply = f"你说的是：{user_message}，而这似乎超出了我目前的理解能力范围。我还在学习特定的表达方式，请等待我们的后续更新！"
    return jsonify({"reply": reply})

if __name__ == '__main__':
    app.run(port=5005, debug=True) 