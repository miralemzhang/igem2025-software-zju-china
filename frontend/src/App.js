//注意接口： 5000是ai agent，5009是concentration，5002是sensor，5003是process，5004是amplify

import React, { useState, useEffect, useRef } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Drawer,
  IconButton,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DeveloperModePage from './DeveloperModePage';
import ConcentrationPage from './ConcentrationPage';
import ProteinPage from './ProteinPage';
import UserModePage from './UserModePage';
import PollutionControlPage from './PollutionControlPage';
import PollutionControlEfficiencyPage from './PollutionControlEfficiencyPage';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import LaunchIcon from '@mui/icons-material/Launch';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';

// 首页组件（写在内部）
function HomePage() {
  const [messages, setMessages] = React.useState([
    { role: 'agent', text: 'Hi, welcome to use our latest model Lumaris 4-Octo! You can call me Luma, what can I do for you?' },
    { role: 'agent', text: 'Available for English Now / 現已支援粵語 / 现在支持中文' }
  ]);
  const [input, setInput] = React.useState('');
  const [chatLoading, setChatLoading] = React.useState(false);
  const [typing, setTyping] = React.useState(false);
  const messagesEndRef = useRef(null);
  
  // 弹出窗口相关状态
  const [chatDialogOpen, setChatDialogOpen] = React.useState(false);
  const [dialogMessages, setDialogMessages] = React.useState([
    { role: 'agent', text: 'Hi, welcome to use our latest model Lumaris 4-Octo! You can call me Luma, what can I do for you?' },
    { role: 'agent', text: 'Available for English Now / 現已支援粵語 / 现在支持中文' }
  ]);
  const [dialogInput, setDialogInput] = React.useState('');
  const [dialogLoading, setDialogLoading] = React.useState(false);
  const [dialogTyping, setDialogTyping] = React.useState(false);
  const dialogMessagesEndRef = useRef(null);

  // 图片轮播相关状态
  const [images, setImages] = React.useState(['ZJU1.png']);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [imageLoading, setImageLoading] = React.useState(true);

  // 极简的悬停状态管理
  const [showAbout, setShowAbout] = React.useState(false);
  const [showContact, setShowContact] = React.useState(false);
  const [aboutButtonRef, setAboutButtonRef] = React.useState(null);
  const [contactButtonRef, setContactButtonRef] = React.useState(null);

  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  React.useEffect(() => {
    if (dialogMessagesEndRef.current) {
      dialogMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dialogMessages]);

  // 获取图片列表
  React.useEffect(() => {
    fetch('http://localhost:5030/api/images')
      .then((res) => res.json())
      .then((data) => {
        if (data.images && data.images.length > 0) {
          setImages(data.images);
        }
        setImageLoading(false);
      })
      .catch((err) => {
        console.error('获取图片列表失败:', err);
        setImageLoading(false);
      });
  }, []);

  // 自动轮播效果
  React.useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000); // 每3秒切换一次，更快的切换频率

    return () => clearInterval(interval);
  }, [images]);

  // 直接跳转到指定图片
  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };



  const handleSend = async () => {
    if (!input.trim() || chatLoading || typing) return;
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setChatLoading(true);
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
        setChatLoading(false);
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
            setChatLoading(false);
          }
        }, 30);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setMessages(prev => [...prev, { role: 'agent', text: 'Sorry, but Lumaris is not available in your country/region.' }]);
      setChatLoading(false);
      setTyping(false);
    }
  };

  const handleDialogSend = async () => {
    if (!dialogInput.trim() || dialogLoading || dialogTyping) return;
    const userMsg = { role: 'user', text: dialogInput };
    setDialogMessages(prev => [...prev, userMsg]);
    setDialogInput('');
    setDialogLoading(true);
    try {
      const res = await fetch('http://localhost:5000/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text })
      });
      const data = await res.json();
      // 逐字显示
      let idx = 0;
      setDialogTyping(true);
      let currentText = '';
      const agentMsg = { role: 'agent', text: '' };
      setDialogMessages(prev => [...prev, agentMsg]);
      const interval = setInterval(() => {
        if (idx < data.reply.length) {
          currentText += data.reply[idx];
          setDialogMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1] = { role: 'agent', text: currentText };
            return newMsgs;
          });
          idx++;
        } else {
          clearInterval(interval);
          setDialogTyping(false);
          setDialogLoading(false);
        }
      }, 30);
    } catch (err) {
      console.error('Fetch error:', err);
      setDialogMessages(prev => [...prev, { role: 'agent', text: 'Lumaris is not available yet. Please contact the development team for access.' }]);
      setDialogLoading(false);
      setDialogTyping(false);
    }
  };

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取文本信息
    fetch('http://localhost:5030/api/hello')
      .then((res) => res.json())
      .then((data) => {
        setMessage(data.message);
        setLoading(false);
      })
      .catch((err) => {
        console.error('API 请求失败:', err);
        setMessage('获取数据失败');
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh', 
      background: '#E1FAFB',
      backgroundImage: 'linear-gradient(135deg, #E1FAFB 0%, #F0F8FF 50%, #E1FAFB 100%)',
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      {/* 顶部导航栏 */}
      <Box sx={{
        bgcolor: '#CEB1E1',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        borderBottom: '1px solid #B8A7D9'
      }}>
        <Box sx={{
          maxWidth: '1400px',
          mx: 'auto',
          px: 3,
          py: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
                    {/* Logo区域 */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2.5 // 恢复间距，不再重叠
          }}>
            {/* 主题图像 - 添加阴影 */}
            <Box
              component="img"
              src="/logo.png"
              alt="iLUMA Logo"
              sx={{
                width: 100,
                height: 100,
                borderRadius: '0px',
                objectFit: 'contain',
                background: 'transparent',
                p: 0,
                filter: 'drop-shadow(0 8px 24px rgba(255, 255, 255, 0.4)) drop-shadow(0 4px 12px rgba(255, 255, 255, 0.3)) drop-shadow(0 2px 6px rgba(206, 177, 225, 0.3))', // 白色渐变阴影（降低亮度）
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                  '&:hover': {
                    transform: 'scale(1.08) rotate(2deg)',
                    filter: 'drop-shadow(0 12px 32px rgba(255, 255, 255, 0.5)) drop-shadow(0 6px 16px rgba(255, 255, 255, 0.4)) drop-shadow(0 3px 8px rgba(206, 177, 225, 0.4)) brightness(1.1)',
                  }
              }}
            />
            
            {/* iLUMA文字 - 不再遮挡 */}
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}>
              <Typography variant="h4" sx={{ 
                fontWeight: 800, 
                color: '#6B73FF',
                fontFamily: '"Google Sans", "Product Sans", "Roboto", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                letterSpacing: 0.5,
                textShadow: '0 2px 4px rgba(255, 255, 255, 0.5)',
              }}>
                iLUMA
              </Typography>
              
              <Typography variant="caption" sx={{ 
                color: '#5A5A5A', 
                fontStyle: 'italic',
                fontWeight: 500,
                background: 'rgba(255, 255, 255, 0.6)',
                px: 1,
                py: 0.25,
                borderRadius: '12px',
                fontSize: '0.75rem'
              }}>
                v1.3.2
              </Typography>
            </Box>
          </Box>
          
          {/* 导航菜单 */}
          <Box sx={{ display: 'flex', gap: 0, alignItems: 'center' }}>
            {/* 主要功能按钮组 */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button 
                component={Link} 
                to="/user-mode" 
                variant="contained" 
                sx={{ 
                  textTransform: 'none', 
                  fontWeight: 700,
                  fontSize: '1rem',
                  borderRadius: '32px',
                  px: 4.5,
                  py: 1.8,
                  minWidth: '160px',
                  height: '52px',
                  backgroundColor: '#C6F2ED',
                  border: 'none',
                  color: '#2D3748',
                  boxShadow: 'none',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                    transition: 'left 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                  },
                  '&:hover': {
                    backgroundColor: '#B8E6E1',
                    transform: 'translateY(-3px) scale(1.02)',
                    boxShadow: '0 8px 20px rgba(198, 242, 237, 0.4)',
                    '&::before': {
                      left: '100%'
                    }
                  },
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                User Console
              </Button>
              <Button 
                component={Link} 
                to="/developer-mode" 
                variant="contained" 
                sx={{ 
                  textTransform: 'none', 
                  fontWeight: 700,
                  fontSize: '1rem',
                  borderRadius: '32px',
                  px: 4.5,
                  py: 1.8,
                  minWidth: '160px',
                  height: '52px',
                  backgroundColor: '#A7E6D7',
                  border: 'none',
                  color: '#2D3748',
                  boxShadow: 'none',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                    transition: 'left 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                  },
                  '&:hover': {
                    backgroundColor: '#91D5C4',
                    transform: 'translateY(-3px) scale(1.02)',
                    boxShadow: '0 8px 20px rgba(167, 230, 215, 0.4)',
                    '&::before': {
                      left: '100%'
                    }
                  },
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                Developer Console
              </Button>
            </Box>
            
            {/* 分隔线 */}
            <Divider 
              orientation="vertical" 
              flexItem 
              sx={{ 
                height: 32, 
                mx: 1.5,
                borderColor: '#B8A7D9',
                opacity: 0.8
              }} 
            />
            
            {/* 次要导航链接 */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Box
                ref={setAboutButtonRef}
                onMouseEnter={() => {
                  setShowAbout(true);
                  setShowContact(false);
                }}
                onMouseLeave={() => {
                  // 延时关闭，给用户时间移动到弹窗
                  setTimeout(() => setShowAbout(false), 1000);
                }}
                sx={{ position: 'relative' }}
              >
                <Button
                  disabled // 禁用按钮点击功能
                  sx={{ 
                    color: '#5A5A5A', 
                    textTransform: 'none', 
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    px: 2,
                    py: 1,
                    borderRadius: '20px',
                    cursor: 'default !important', // 强制保持箭头光标
                    '&.Mui-disabled': {
                      color: '#5A5A5A', // 保持正常颜色
                    },
                    '&:hover': {
                      color: '#6B73FF',
                      backgroundColor: 'rgba(206, 177, 225, 0.2)',
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  About
                </Button>
                
                {/* About 弹窗 */}
                {showAbout && aboutButtonRef && (
                  <Box
                    onMouseEnter={() => setShowAbout(true)}
                    onMouseLeave={() => setShowAbout(false)}
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      mt: 1,
                      bgcolor: '#F8FDFD',
                      border: '1px solid #C6F2ED',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                      p: 3,
                      minWidth: 280,
                      maxWidth: 400,
                      zIndex: 1300
                    }}
                  >
                    <Typography variant="h6" sx={{ 
                      color: '#2D3748', 
                      fontWeight: 600, 
                      mb: 2,
                      fontFamily: '"Google Sans", "Product Sans", "Roboto", "Segoe UI", "Helvetica Neue", Arial, sans-serif'
                    }}>
                      About iLUMA
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#5A5A5A', 
                      lineHeight: 1.6,
                      mb: 2
                    }}>
                      Developed by ZJU-China 2025's Dry Lab, iLUMA is a smart analysis platform based on specialized algorithms and advanced AI technology, providing high-precision data processing and analysis capabilities.
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: '#5A5A5A', 
                      lineHeight: 1.6,
                      mb: 2
                    }}>
                      We are committed to providing the most advanced AI tools and integrated solutions for researchers and developers.
                    </Typography>

                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      mt: 2,
                      pt: 2,
                      borderTop: '1px solid #C6F2ED'
                    }}>
                      <Box sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: '#10b981',
                      }} />
                      <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 500 }}>
                        Version v1.3.2 - Running
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      mt: 1,
                      pt: 1
                    }}>
                      <Box sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: '#10b981',
                      }} />
                      <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 500 }}>
                        Current IP : 13.229.233.44 
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
              
              <Box
                ref={setContactButtonRef}
                onMouseEnter={() => {
                  setShowContact(true);
                  setShowAbout(false);
                }}
                onMouseLeave={() => {
                  // 延时关闭，给用户时间移动到弹窗
                  setTimeout(() => setShowContact(false), 1000);
                }}
                sx={{ position: 'relative' }}
              >
                <Button
                  disabled // 禁用按钮点击功能
                  sx={{ 
                    color: '#5A5A5A', 
                    textTransform: 'none', 
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    px: 2,
                    py: 1,
                    borderRadius: '20px',
                    cursor: 'default !important', // 强制保持箭头光标
                    '&.Mui-disabled': {
                      color: '#5A5A5A', // 保持正常颜色
                    },
                    '&:hover': {
                      color: '#6B73FF',
                      backgroundColor: 'rgba(206, 177, 225, 0.2)',
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  Contact
                </Button>
                
                {/* Contact 弹窗 */}
                {showContact && contactButtonRef && (
                  <Box
                    onMouseEnter={() => setShowContact(true)}
                    onMouseLeave={() => setShowContact(false)}
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      mt: 1,
                      bgcolor: '#F8FDFD',
                      border: '1px solid #C6F2ED',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                      p: 3,
                      minWidth: 280,
                      maxWidth: 350,
                      zIndex: 1300
                    }}
                  >
                    <Typography variant="h6" sx={{ 
                      color: '#2D3748', 
                      fontWeight: 600, 
                      mb: 2,
                      fontFamily: '"Google Sans", "Product Sans", "Roboto", "Segoe UI", "Helvetica Neue", Arial, sans-serif'
                    }}>
                      Contact Us
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ 
                        color: '#5A5A5A', 
                        mb: 1,
                        fontWeight: 500
                      }}>
                        📧 Email
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: '#6B73FF', 
                        fontSize: '0.8rem',
                        letterSpacing: '0.05em',
                        fontFamily: '',
                        textAlign: 'right'
                      }}>
                        ZJU_China@outlook.com
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: '#6B73FF', 
                        fontSize: '0.8rem',
                        letterSpacing: '0.05em',
                        fontFamily: '',
                        textAlign: 'right'
                      }}>
                        miralemzhang@gmail.com
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      mt: 2,
                      pt: -2.5,
                      borderBottom: '1px solid #C6F2ED'
                    }}>
                      <Typography variant="caption" sx={{ color: '#5A5A5A' }}>
                        Automatic feedback within 2 hours.
                      </Typography>
                    </Box>
                  {/* 二维码展示框 */}
                  <Box sx={{ 
                    mt: 3, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: '#F0F8FF',
                    borderRadius: '12px',
                    p: 2,
                    boxShadow: '0 2px 8px rgba(206, 177, 225, 0.2)'
                  }}>
                    <Typography variant="body2" sx={{ color: '#5A5A5A', mb: 1 }}>
                      Scan QR Code
                    </Typography>
                    <Box
                      component="img"
                      src="/qrcode_wechat.jpg"
                      alt="wechat"
                      sx={{
                        width: 120,
                        height: 120,
                        borderRadius: '8px',
                        border: '1px solid #C6F2ED',
                        bgcolor: '#fff',
                        objectFit: 'cover'
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#6B73FF', mt: 1 }}>
                      ZJU iGEM宵夜时间
                    </Typography>
                  </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* 主要内容区域 */}
      <Box sx={{ 
        maxWidth: '1400px', 
        mx: 'auto', 
        px: 3, 
        py: 7,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - 420px)' // 减去导航栏高度
      }}>
        
        <Box display="flex" flexDirection="row" alignItems="flex-start" justifyContent="center" gap={5} sx={{ flex: 1 }}>
          {/* 图片轮播框 */}
          <Box sx={{ 
            width: '900px', 
            height: '650px', // 增加高度
            position: 'relative', 
            overflow: 'hidden',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            background: '#F8FDFD',
            flexShrink: 0,
            border: '1px solid #C6F2ED'
          }}>
            {imageLoading ? (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%' 
              }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {/* 图片容器 */}
                <Box sx={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {images.map((image, index) => (
                    <img
                      key={image}
                      src={`http://localhost:5030/api/image/${image}`}
                      alt={`轮播图片 ${index + 1}`}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) scale(${index === currentImageIndex ? 1 : 1.1})`,
                        width: image === 'ZJU1.png' ? '100%' : 'auto',
                        height: image === 'ZJU1.png' ? '100%' : 'auto',
                        maxWidth: image === 'ZJU1.png' ? '100%' : '100%',
                        maxHeight: image === 'ZJU1.png' ? '100%' : '100%',
                        objectFit: image === 'ZJU1.png' ? 'cover' : 'contain',
                        opacity: index === currentImageIndex ? 1 : 0,
                        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                        filter: index === currentImageIndex ? 'brightness(1)' : 'brightness(0.8)'
                      }}
                    />
                  ))}
                </Box>
                
                {/* 渐变遮罩效果 */}
                <Box sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '80px',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.3))',
                  pointerEvents: 'none'
                }} />
                
                {/* 指示器 */}
                {images.length > 1 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 20,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: 1.5,
                      zIndex: 2
                    }}
                  >
                    {images.map((_, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: index === currentImageIndex ? 28 : 10,
                          height: 10,
                          borderRadius: 5,
                          bgcolor: index === currentImageIndex ? 'white' : 'rgba(255,255,255,0.6)',
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: 'white',
                            transform: 'scale(1.1)'
                          }
                        }}
                        onClick={() => goToImage(index)}
                      />
                    ))}
                  </Box>
                )}
              </>
            )}
          </Box>
          {/* 对话框 */}
          <Box sx={{
            width: 520,
            height: 650, // 增加高度与轮播图一致
            bgcolor: '#F5F3FF',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(206, 177, 225, 0.12), 0 2px 8px rgba(206, 177, 225, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #E8E5FF',
            flexShrink: 0,
            overflow: 'hidden'
          }}>
            {/* 聊天框头部 */}
            <Box sx={{
              bgcolor: '#C6F2ED',
              borderBottom: '1px solid #B8E6E1',
              px: 3,
              py: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: 'linear-gradient(135deg, #A7D8E4 0%, #91C5D4 100%)',
                  background: 'linear-gradient(135deg, #A7D8E4 0%, #91C5D4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2D3748',
                  fontSize: '14px',
                  fontWeight: 600
                }}>
                  L
                </Box>
                <Box>
                                  <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: '#2D3748',
                    fontSize: '1rem',
                    mb: 0.5,
                    fontFamily: '"Google Sans", "Product Sans", "Roboto", "Segoe UI", "Helvetica Neue", Arial, sans-serif'
                  }}
                >
                  Lumaris 4-Octo
                </Typography>
                </Box>
              </Box>
              
              {/* 弹出窗口按钮 */}
              <IconButton
                onClick={() => setChatDialogOpen(true)}
                sx={{
                  color: '#5A5A5A',
                  '&:hover': {
                    bgcolor: 'rgba(167, 216, 228, 0.2)',
                    color: '#2D3748'
                  }
                }}
                title="Open in full window"
              >
                <OpenInFullIcon />
              </IconButton>
            </Box>
            
            {/* 消息显示区 */}
            <Box sx={{ 
              flex: 1, 
              overflowY: 'auto', 
              px: 3, 
              py: 2,
              bgcolor: '#F5F3FF',
              '&::-webkit-scrollbar': {
                width: '6px'
              },
              '&::-webkit-scrollbar-track': {
                background: '#F0F8FF',
                borderRadius: '3px'
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#C6F2ED',
                borderRadius: '3px',
                '&:hover': {
                  background: '#B8E6E1'
                }
              }
            }}>
              {messages.map((msg, idx) => (
                <Box key={idx} sx={{ 
                  mb: 3, 
                  display: 'flex', 
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', 
                  alignItems: 'flex-start',
                  gap: 2
                }}>
                  {/* 头像 */}
                  <Box sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: msg.role === 'user' ? '#A7D8E4' : '#C6F2ED',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: msg.role === 'user' ? '#2D3748' : '#2D3748',
                    fontSize: '14px',
                    fontWeight: 600,
                    flexShrink: 0,
                    border: msg.role === 'user' ? 'none' : '1px solid #B8E6E1'
                  }}>
                    {msg.role === 'user' ? 'U' : 'L'}
                  </Box>
                  
                  {/* 消息气泡 */}
                  <Box
                    sx={{
                      bgcolor: msg.role === 'user' ? '#A7D8E4' : '#F0F8FF',
                      color: msg.role === 'user' ? '#2D3748' : '#2D3748',
                      px: 3,
                      py: 2,
                      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      maxWidth: '75%',
                      boxShadow: msg.role === 'user' ? '0 2px 8px rgba(167, 216, 228, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.08)',
                      fontSize: '0.95rem',
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                      position: 'relative',
                      border: msg.role === 'user' ? 'none' : '1px solid #E0F2FE'
                    }}
                  >
                    {msg.text}
                    {msg.type === 'image' && msg.imageData && (
                      <Box sx={{ mt: 2 }}>
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
                          <Box sx={{ mt: 1, fontSize: '12px', color: '#666' }}>
                            <details>
                              <summary style={{ cursor: 'pointer' }}>Thinking Process</summary>
                              <pre style={{ fontSize: '10px', marginTop: '5px', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                                'Yeah, I need to carefully analyze the parameters and the data<br/>that the user provided to generate the curve image.I have<br/>noticed that all the parameters are related to the process<br/>layer model, so I need to generate the curve image based on it.<br/>I must focus on the actual values and get the correct<br/>API from the backend of iLUMA.<br/>And wait, wait, I also have to remind the user that the image is<br/>AI-generated, so please verify the important information with<br/>ZJU-China's official sources.<br/>That's all, now I will begin to execute the task...<br/>'
                                {JSON.stringify(msg.parameters, null, 2)}
                              </pre>
                            </details>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>
            
            {/* 输入区域 */}
            <Box sx={{
              borderTop: '1px solid #E8E5FF',
              bgcolor: '#F5F3FF',
              p: 3
            }}>
              {/* 输入区上方提示 */}
              <Typography variant="caption" sx={{ 
                color: '#5A5A5A', 
                mb: 2, 
                display: 'block', 
                textAlign: 'center',
                fontSize: '0.65rem',
                fontStyle: 'italic'
              }}>
                ❉ Luma's responses are AI-generated. Please verify important information with official sources.
              </Typography>
              
              {/* 输入框和发送按钮 */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'flex-end', 
                gap: 1,
                bgcolor: '#F0F8FF',
                borderRadius: '24px',
                px: 2,
                py: 1,
                border: '1px solid #C6F2ED'
              }}>
                                  <TextField
                    fullWidth
                    placeholder="Type your message..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { 
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        border: 'none',
                        color: '#2D3748',
                        '& fieldset': {
                          border: 'none'
                        },
                        '&:hover fieldset': {
                          border: 'none'
                        },
                        '&.Mui-focused fieldset': {
                          border: 'none'
                        }
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '0.95rem',
                        py: 1,
                        color: '#2D3748',
                        '&::placeholder': {
                          color: '#5A5A5A',
                          opacity: 1
                        }
                      }
                    }}
                    disabled={chatLoading || typing}
                  />
                <Button
                  variant="contained"
                  onClick={handleSend}
                  disabled={!input.trim() || chatLoading || typing}
                  sx={{ 
                    minWidth: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: '#A7D8E4',
                    color: '#2D3748',
                    '&:hover': {
                      bgcolor: '#B8E0EA'
                    },
                    '&:disabled': {
                      bgcolor: '#E0E0E0',
                      color: '#9CA3AF'
                    }
                  }}
                >
                  {(chatLoading || typing) ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Box component="span" sx={{ fontSize: '1.2rem' }}>↑</Box>
                  )}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
        
        {/* 底部信息区域 */}
        <Box sx={{ 
          mt: 0, 
          pt: 1, 
          borderTop: '1px solid rgba(142, 143, 145, 0)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 0
        }}>
          {/* API状态信息 */}
          <Box sx={{ flex: 1 }}>
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="#2D3748">
                  Loading system status...
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  bgcolor: message.includes('失败') ? '#ef4444' : '#10b981',
                }} />
                <Typography variant="body2" color="#2D3748" sx={{ fontSize: '0.7rem' }}>
                  {message}
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* 快速链接 */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            
            <Typography variant="caption" color="#2D3748">
              iLUMA
            </Typography>
          </Box>
        </Box>
      </Box>
      
      {/* 聊天弹出窗口 */}
      <Dialog
        open={chatDialogOpen}
        onClose={() => setChatDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            height: '90vh',
            maxHeight: '800px',
            width: '90vw',
            maxWidth: '1000px',
            bgcolor: '#F5F3FF',
            border: '1px solid #E8E5FF'
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: '#C6F2ED',
          borderBottom: '1px solid #B8E6E1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #A7D8E4 0%, #91C5D4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2D3748',
              fontSize: '14px',
              fontWeight: 600
            }}>
              L
            </Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: '#2D3748',
              fontFamily: '"Google Sans", "Product Sans", "Roboto", "Segoe UI", "Helvetica Neue", Arial, sans-serif'
            }}>
              Lumaris 4-Octo
            </Typography>
          </Box>
          <IconButton
            onClick={() => setChatDialogOpen(false)}
            sx={{ color: '#5A5A5A' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          {/* 消息显示区 */}
          <Box sx={{ 
            flex: 1, 
            overflowY: 'auto', 
            px: 3, 
            py: 2,
            bgcolor: '#F5F3FF',
            '&::-webkit-scrollbar': {
              width: '6px'
            },
            '&::-webkit-scrollbar-track': {
              background: '#F0F8FF',
              borderRadius: '3px'
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#C6F2ED',
              borderRadius: '3px',
              '&:hover': {
                background: '#B8E6E1'
              }
            }
          }}>
            {dialogMessages.map((msg, idx) => (
              <Box key={idx} sx={{ 
                mb: 3, 
                display: 'flex', 
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', 
                alignItems: 'flex-start',
                gap: 2
              }}>
                {/* 头像 */}
                <Box sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: msg.role === 'user' ? '#A7D8E4' : '#C6F2ED',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: msg.role === 'user' ? '#2D3748' : '#2D3748',
                  fontSize: '14px',
                  fontWeight: 600,
                  flexShrink: 0,
                  border: msg.role === 'user' ? 'none' : '1px solid #B8E6E1'
                }}>
                  {msg.role === 'user' ? 'U' : 'L'}
                </Box>
                
                {/* 消息气泡 */}
                <Box
                  sx={{
                    bgcolor: msg.role === 'user' ? '#A7D8E4' : '#F0F8FF',
                    color: msg.role === 'user' ? '#2D3748' : '#2D3748',
                    px: 3,
                    py: 2,
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    maxWidth: '75%',
                    boxShadow: msg.role === 'user' ? '0 2px 8px rgba(167, 216, 228, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.08)',
                    fontSize: '0.95rem',
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                    position: 'relative',
                    border: msg.role === 'user' ? 'none' : '1px solid #E0F2FE'
                  }}
                >
                  {msg.text}
                </Box>
              </Box>
            ))}
            <div ref={dialogMessagesEndRef} />
          </Box>
          
          {/* 输入区域 */}
          <Box sx={{
            borderTop: '1px solid #E8E5FF',
            bgcolor: '#F5F3FF',
            p: 1.5
          }}>
            {/* 输入区上方提示 */}
            <Typography variant="caption" sx={{ 
              color: '#5A5A5A', 
              mb: 0.8, 
              display: 'block', 
              textAlign: 'center',
              fontSize: '0.65rem',
              fontStyle: 'italic'
            }}>
              ❉ Luma's responses are AI-generated. Please verify important information with official sources.
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-end', 
              gap: 1,
              bgcolor: '#F0F8FF',
              borderRadius: '24px',
              px: 2,
              py: 1,
              border: '1px solid #C6F2ED'
            }}>
              <TextField
                fullWidth
                placeholder="Type your message..."
                value={dialogInput}
                onChange={e => setDialogInput(e.target.value)}
                onKeyDown={e => { 
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleDialogSend();
                  }
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    border: 'none',
                    color: '#2D3748',
                    '& fieldset': {
                      border: 'none'
                    },
                    '&:hover fieldset': {
                      border: 'none'
                    },
                    '&.Mui-focused fieldset': {
                      border: 'none'
                    }
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '0.95rem',
                    py: 1,
                    color: '#2D3748',
                    '&::placeholder': {
                      color: '#5A5A5A',
                      opacity: 1
                    }
                  }
                }}
                disabled={dialogLoading || dialogTyping}
              />
              <Button
                variant="contained"
                onClick={handleDialogSend}
                disabled={!dialogInput.trim() || dialogLoading || dialogTyping}
                sx={{ 
                  minWidth: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: '#A7D8E4',
                  color: '#2D3748',
                  '&:hover': {
                    bgcolor: '#B8E0EA'
                  },
                  '&:disabled': {
                    bgcolor: '#E0E0E0',
                    color: '#9CA3AF'
                  }
                }}
              >
                {(dialogLoading || dialogTyping) ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Box component="span" sx={{ fontSize: '1.2rem' }}>↑</Box>
                )}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>


    </div>
  );
}


function AboutPage() {
  return (
    <div>
      <Typography variant="h4">关于我们</Typography>
      <Typography>这里是关于页面内容。</Typography>
    </div>
  );
}

function ContactPage() {
  return (
    <div>
      <Typography variant="h4">Contact Us</Typography>
      <Typography>邮箱：ZJU_China@outlook.com  /  miralemzhang@gmail.com</Typography>
    </div>
  );
}

// 激活导航项高亮
const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { text: 'Home', path: '/' },
    { text: 'About', path: '/about' },
    { text: 'Contact', path: '/contact' },
  ];

  return (
    <List>
      {navItems.map((item) => (
        <ListItemButton
          key={item.text}
          component={Link}
          to={item.path}
          selected={location.pathname === item.path}
        >
          <ListItemText primary={item.text} />
        </ListItemButton>
      ))}
    </List>
  );
};

// 主 App 组件
function App() {
  // 用 useLocation 获取当前路由，确保响应式
  function MainLayout() {
    const location = useLocation();
    const isUserMode = location.pathname === '/user-mode';
    const isHomePage = location.pathname === '/';
    
    return (
      <Box sx={{ display: 'flex', height: '100vh', p: 0, m: 0, bgcolor: isUserMode ? 'transparent' : '#E1FAFB' }}>
        {/* 左侧导航栏，仅非 user-mode 且非首页时显示 */}
        {!isUserMode && !isHomePage && (
          <Box sx={{ width: 240, bgcolor: '#C6F2ED', color: '#2D3748', p: 2, m: 0 }}>
            <Typography variant="h6" gutterBottom>
              Navigation
            </Typography>
            <Navigation />
          </Box>
        )}
        {/* 右侧内容区 */}
        <Box
          sx={{
            flexGrow: 1,
            p: isUserMode ? 0 : (isHomePage ? 0 : 3),
            bgcolor: isUserMode ? 'transparent' : (isHomePage ? '#E1FAFB' : '#E1FAFB'),
            minHeight: '100vh',
            m: 0,
          }}
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/developer-mode" element={<DeveloperModePage />} />
            <Route path="/concentration" element={<ConcentrationPage />} />
            <Route path="/protein" element={<ProteinPage />} />
            <Route path="/user-mode" element={<UserModePage />} />
            <Route path="/pollution-control" element={<PollutionControlPage />} />
            <Route path="/pollution-control-efficiency" element={<PollutionControlEfficiencyPage />} />
          </Routes>
        </Box>
      </Box>
    );
  }
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}

export default App;