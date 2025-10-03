import React, { useState, useRef, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Button, 
  IconButton, 
  Drawer, 
  TextField, 
  CircularProgress,
  Paper,
  Card,
  CardContent
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate, Link } from 'react-router-dom';
import ScienceIcon from '@mui/icons-material/Science';
import BiotechIcon from '@mui/icons-material/Biotech';
import FlareIcon from '@mui/icons-material/Flare';
import FilterVintageIcon from '@mui/icons-material/FilterVintage';

function DeveloperModePage() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'agent', text: 'Hi, welcome to use our latest model Lumaris 4-Octo! You can call me Luma, what can I do for you?' },
    { role: 'agent', text: 'Available for English Now / 現已支援粵語 / 现在支持中文' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (chatOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen]);

  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.width = '100vw';
    document.body.style.height = '100vh';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.documentElement.style.width = '100vw';
    document.documentElement.style.height = '100vh';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading || typing) return;
    const userMsg = { role: 'user', text: input };
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
      
      if (typeof data.reply === 'object' && data.reply.type === 'image') {
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
      setMessages(prev => [...prev, { role: 'agent', text: 'Luma is not yet available to you. Please contact the development team for access.' }]);
      setLoading(false);
      setTyping(false);
    }
  };

  const navigationCards = [
    {
      title: 'Strand Replacement Reaction',
      description: 'Analyze strand replacement reaction kinetics and concentration dynamics through molecular dynamics simulation and reaction kinetics analysis',
      icon: <ScienceIcon sx={{ fontSize: 40 }} />,
      path: '/concentration',
      color: '#6B73FF',
      bgColor: 'rgba(107, 115, 255, 0.1)',
    },
    {
      title: 'Pollution Control Efficiency',
      description: 'Predict lead ion treatment time and efficiency using coupled differential equation modeling based on protein expression dynamics',
      icon: <FilterVintageIcon sx={{ fontSize: 40 }} />,
      path: '/pollution-control',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    {
      title: 'Protein Production',
      description: 'Monitor and optimize protein production processes with machine learning-based image analysis',
      icon: <BiotechIcon sx={{ fontSize: 40 }} />,
      path: '/protein',
      color: '#ec4899',
      bgColor: 'rgba(236, 72, 153, 0.1)',
    },
    {
      title: 'Algae-Bacteria Symbiosis',
      description: 'Analyze algae-bacteria symbiosis efficiency and stability through dynamic modeling and GSM integration',
      icon: <FlareIcon sx={{ fontSize: 40 }} />,
      path: '/pollution-control-efficiency',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
    },
  ];

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        m: 0,
        p: 0,
        overflow: 'hidden',
        bgcolor: '#E1FAFB',
        backgroundImage: 'linear-gradient(135deg, #E1FAFB 0%, #F0F8FF 50%, #E1FAFB 100%)',
      }}
    >
      <Box sx={{
        bgcolor: '#C6F2ED',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        borderBottom: '1px solid #B8E6E1'
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 800, 
              color: '#6B73FF',
              fontFamily: '"Google Sans", "Product Sans", "Roboto", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
              letterSpacing: 0.5
            }}>
              iLUMA
            </Typography>
            <Typography variant="caption" sx={{ color: '#5A5A5A', fontStyle: 'italic' }}>
              v1.3.2
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button 
              onClick={() => setChatOpen(true)}
              startIcon={<ChatIcon />}
              sx={{ 
                color: '#6B73FF', 
                textTransform: 'none', 
                fontWeight: 600,
                fontSize: '0.9rem',
                px: 2.5,
                py: 1,
                borderRadius: '20px',
                '&:hover': {
                  color: '#5A61E6',
                  backgroundColor: 'rgba(206, 177, 225, 0.15)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              Lumaris
            </Button>
            <Button 
              component={Link} 
              to="/" 
              startIcon={<ArrowBackIcon />}
              sx={{ 
                color: '#6B73FF', 
                textTransform: 'none', 
                fontWeight: 700,
                fontSize: '0.9rem',
                px: 2,
                py: 1,
                borderRadius: '20px',
                '&:hover': {
                  color: '#6B73FF',
                  backgroundColor: 'rgba(206, 177, 225, 0.15)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              Home
            </Button>
          </Box>
        </Box>
      </Box>
      
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pt: 4,
        pb: 4,
        overflow: 'visible',
        px: 5,
      }}>
        
        
        <Box sx={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          px: 4,
          py: 3,
        }}>
          <Box sx={{
            width: '900px',
            height: '620px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: '20px',
            alignItems: 'center',
            justifyItems: 'center',
          }}>
            {navigationCards.map((card, index) => (
              <Card
                key={index}
                sx={{
                  bgcolor: '#F8FDFD',
                  border: '2px solid #C6F2ED',
                  borderRadius: 3,
                  overflow: 'visible',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  height: '290px',
                  width: '420px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
                    border: '2px solid rgba(107, 115, 255, 0.3)',
                    bgcolor: '#F0F8FF',
                  }
                }}
                onClick={() => navigate(card.path)}
              >
                  <CardContent sx={{ p: 4, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      gap: 2.5
                    }}>
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          bgcolor: card.bgColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: card.color,
                          transition: 'all 0.3s ease',
                          border: `2px solid ${card.color}20`,
                          boxShadow: `0 0 20px ${card.color}30`,
                        }}
                      >
                        {React.cloneElement(card.icon, { sx: { fontSize: 42 } })}
                      </Box>
                      
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          color: '#2D3748',
                          fontWeight: 700,
                          fontSize: '1.35rem',
                          lineHeight: 1.3,
                          letterSpacing: '0.5px',
                        }}
                      >
                        {card.title}
                      </Typography>
                      
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: '#5A5A5A',
                          fontSize: '0.95rem',
                          lineHeight: 1.5,
                          textAlign: 'center',
                          maxWidth: '280px',
                        }}
                      >
                        {card.description}
                      </Typography>
                      
                      <Button
                        variant="contained"
                        sx={{
                          bgcolor: card.color,
                          color: 'white',
                          px: 4,
                          py: 1.2,
                          borderRadius: 2,
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          textTransform: 'none',
                          letterSpacing: '0.3px',
                          boxShadow: `0 4px 16px ${card.color}40`,
                          '&:hover': {
                            bgcolor: card.color,
                            opacity: 0.9,
                            transform: 'scale(1.05)',
                            boxShadow: `0 6px 24px ${card.color}50`,
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Launch Tool
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
            ))}
          </Box>
        </Box>
      </Box>

      <Drawer
        anchor="right"
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100vw', sm: 450 },
            maxWidth: '100vw',
            bgcolor: '#F8FDFD',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            border: '1px solid #C6F2ED'
          }
        }}
      >
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
              background: 'linear-gradient(135deg, #CEB1E1 0%, #B8A7D9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#444444',
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
          <IconButton onClick={() => setChatOpen(false)} sx={{ color: '#5A5A5A' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Box sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          px: 3, 
          py: 2,
          bgcolor: '#F8FDFD',
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
              <Box sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: msg.role === 'user' ? '#CEB1E1' : '#C6F2ED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: msg.role === 'user' ? '#444444' : '#2D3748',
                fontSize: '14px',
                fontWeight: 600,
                flexShrink: 0
              }}>
                {msg.role === 'user' ? 'U' : 'L'}
              </Box>
              
              <Box
                sx={{
                  bgcolor: msg.role === 'user' ? '#CEB1E1' : '#F0F8FF',
                  color: msg.role === 'user' ? '#444444' : '#2D3748',
                  px: 3,
                  py: 2,
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  maxWidth: '75%',
                  boxShadow: msg.role === 'user' ? '0 2px 8px rgba(206, 177, 225, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.08)',
                  fontSize: '0.95rem',
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  position: 'relative'
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
                          <summary style={{ cursor: 'pointer' }}>使用的参数</summary>
                          <pre style={{ fontSize: '10px', marginTop: '5px', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
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
        
        <Box sx={{
          borderTop: '1px solid #C6F2ED',
          bgcolor: '#F8FDFD',
          p: 1.5
        }}>
          <Typography variant="caption" sx={{ 
            color: '#5A5A5A', 
            mb: 1, 
            display: 'block', 
            textAlign: 'center',
            fontSize: '0.65rem',
            fontStyle: 'italic'
          }}>
            ❉ Luma's responses are AI-generated. Please verify important information.
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
              disabled={loading || typing}
            />
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={!input.trim() || loading || typing}
              sx={{ 
                minWidth: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: '#CEB1E1',
                color: '#444444',
                '&:hover': {
                  bgcolor: '#D4B8E5'
                },
                '&:disabled': {
                  bgcolor: '#E0E0E0',
                  color: '#9CA3AF'
                }
              }}
            >
              {(loading || typing) ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Box component="span" sx={{ fontSize: '1.2rem' }}>↑</Box>
              )}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}

export default DeveloperModePage;