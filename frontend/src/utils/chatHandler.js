// 通用聊天处理工具函数

export const handleChatResponse = async (
  userMessage,
  setMessages,
  setLoading,
  setTyping,
  setInput
) => {
  if (!userMessage.trim()) return;
  
  const userMsg = { role: 'user', text: userMessage };
  setMessages(prev => [...prev, userMsg]);
  setInput('');
  setLoading(true);
  
  try {
    const res = await fetch('http://localhost:5000/agent-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg.text })
    });
    const data = await res.json();
    
    // 检查是否是图像响应
    if (typeof data.reply === 'object' && data.reply.type === 'image') {
      // 处理图像响应
      const agentMsg = {
        role: 'agent',
        text: data.reply.message,
        type: 'image',
        imageData: data.reply.image_data,
        parameters: data.reply.parameters_used
      };
      setMessages(prev => [...prev, agentMsg]);
      setLoading(false);
      setTyping(false);
    } else {
      // 处理文本响应 - 逐字显示
      let idx = 0;
      setTyping(true);
      let currentText = '';
      const agentMsg = { role: 'agent', text: '' };
      setMessages(prev => [...prev, agentMsg]);
      
      const interval = setInterval(() => {
        if (idx < data.reply.length) {
          currentText += data.reply[idx];
          setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1] = { role: 'agent', text: currentText };
            return newMsgs;
          });
          idx++;
        } else {
          clearInterval(interval);
          setTyping(false);
          setLoading(false);
        }
      }, 30);
    }
  } catch (err) {
    console.error('Chat error:', err);
    setMessages(prev => [...prev, { 
      role: 'agent', 
      text: 'Luma is not yet available to you. Please contact the development team for access.' 
    }]);
    setLoading(false);
    setTyping(false);
  }
};

// 渲染聊天消息的组件
export const renderChatMessage = (msg, index) => {
  if (msg.type === 'image') {
    return (
      <div key={index} className={`message ${msg.role === 'user' ? 'user' : 'agent'}`}>
        <div className="message-content">
          <p>{msg.text}</p>
          {msg.imageData && (
            <div className="image-container" style={{ marginTop: '10px' }}>
              <img 
                src={`data:image/png;base64,${msg.imageData}`}
                alt="Generated sensor layer visualization"
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto', 
                  border: '1px solid #ddd', 
                  borderRadius: '8px' 
                }}
              />
              {msg.parameters && (
                <details style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                  <summary>Thinking Chain</summary>
                  <pre>
                    'yeah, I think so...'
                    {JSON.stringify(msg.parameters, null, 2)}

                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // 普通文本消息
  return (
    <div key={index} className={`message ${msg.role === 'user' ? 'user' : 'agent'}`}>
      <div className="message-content">
        {msg.text}
      </div>
    </div>
  );
};
