import React, { useState, useRef, useEffect } from 'react';
import { Typography, Box, Paper, IconButton, Drawer, TextField, Button, Divider, CircularProgress, Grid, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import MonitorIcon from '@mui/icons-material/Monitor';
import SettingsRemoteIcon from '@mui/icons-material/SettingsRemote';
import SignalWifiIcon from '@mui/icons-material/Wifi';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import SpeedIcon from '@mui/icons-material/Speed';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RouteIcon from '@mui/icons-material/Route';
import ScienceIcon from '@mui/icons-material/Science';
import { useNavigate, Link } from 'react-router-dom';
import './UserModePage.css';
import SimplePlasticDetectionPanel from './components/SimplePlasticDetectionPanel';

function UserModePage() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('ocean'); // 模型选择状态
  const [viewMode, setViewMode] = useState('monitor'); // 新增：视图模式状态 (monitor/console)
  const [pathPlanningOpen, setPathPlanningOpen] = useState(false); // 路径规划弹窗状态
  const [submarineData, setSubmarineData] = useState({
    lat: 30.6762,
    lng: 124.6503,
    battery: 78,
    speed: 12.52,
    depth: 36.64,
    signalStrength: 85,
    transmissionSpeed: 2.46
  });
  
  // 巡航路径数据 - 优化间距和分布
  const cruisePath = [
    { lat: 30.6762, lng: 124.6503 },
    { lat: 30.7200, lng: 124.7800 },
    { lat: 30.8500, lng: 124.8200 },
    { lat: 30.9200, lng: 124.7400 },
    { lat: 30.8800, lng: 124.5800 },
    { lat: 30.7600, lng: 124.4900 },
    { lat: 30.6762, lng: 124.6503 }
  ];

  const [messages, setMessages] = useState([
    { role: 'agent', text: 'Hi, welcome to use our latest model Lumaris 4-Octo! You can call me Luma, what can I do for you?' },
    { role: 'agent', text: 'Available for English Now / 現已支援粵語 / 现在支持中文' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // 滚动到底部
  useEffect(() => {
    if (chatOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen]);

  // 模拟潜艇数据更新
  useEffect(() => {
    const interval = setInterval(() => {
      setSubmarineData(prev => ({
        ...prev,
        lat: Math.round((prev.lat + (Math.random() - 0.5) * 0.001) * 100) / 100,
        lng: Math.round((prev.lng + (Math.random() - 0.5) * 0.001) * 100) / 100,
        depth: Math.round((prev.depth + (Math.random() - 0.5)) * 100) / 100,
        battery: Math.max(0, prev.battery - Math.random() * 0.1),
        speed: Math.max(0, prev.speed + (Math.random() - 0.5) * 0.5),
        signalStrength: Math.max(0, Math.min(100, prev.signalStrength + (Math.random() - 0.5) * 5)),
        transmissionSpeed: Math.max(0, prev.transmissionSpeed + (Math.random() - 0.5) * 0.2)
      }));
    }, 2000);

    return () => clearInterval(interval);
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
      setMessages(prev => [...prev, { role: 'agent', text: 'Luma is not yet available to you. Please contact the development team for access.' }]);
      setLoading(false);
      setTyping(false);
    }
  };

  // 渲染控制台界面
  const renderConsole = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '660px', width: '100%' }}>
      {/* 世界地图区域 */}
      <Paper sx={{
        flex: 1,
        mb: 2,
        p: 2,
        background: 'linear-gradient(135deg, rgba(107, 115, 255, 0.08) 0%, rgba(198, 242, 237, 0.15) 50%, rgba(240, 248, 255, 0.12) 100%)',
        border: '1px solid rgba(107, 115, 255, 0.2)',
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(107, 115, 255, 0.1)'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 6,
              height: 32,
              background: 'linear-gradient(180deg, #6B73FF 0%, #5A61E6 100%)',
              borderRadius: 1,
              boxShadow: '0 0 8px rgba(107, 115, 255, 0.4)'
            }} />
            <Box>
              <Typography variant="subtitle1" sx={{ color: '#6B73FF',fontWeight: 700, fontSize: '1.6rem', letterSpacing: '0.5px' }}>
                    REMOTE POSITIONING SYSTEM
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#6B73FF', 
                letterSpacing: '1px',
                fontSize: '0.65rem'
              }}>
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RouteIcon />}
            onClick={() => setPathPlanningOpen(true)}
            sx={{
              color: '#6B73FF',
              borderColor: 'rgba(107, 115, 255, 0.4)',
              fontSize: '0.85rem',
              py: 1,
              px: 3,
              fontWeight: 600,
              letterSpacing: '0.5px',
              borderRadius: 2,
              background: 'rgba(107, 115, 255, 0.05)',
              '&:hover': {
                borderColor: '#6B73FF',
                backgroundColor: 'rgba(107, 115, 255, 0.15)',
                boxShadow: '0 0 20px rgba(107, 115, 255, 0.2)'
              }
            }}
          >
            PATH PLANNING
          </Button>
        </Box>
        
        {/* 模拟世界地图 */}
        <Box sx={{
          width: '100%',
          height: '340px',
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(107, 115, 255, 0.15) 0%, transparent 40%),
            radial-gradient(ellipse at 70% 30%, rgba(206, 177, 225, 0.12) 0%, transparent 30%),
            radial-gradient(ellipse at 20% 70%, rgba(16, 185, 129, 0.14) 0%, transparent 35%),
            linear-gradient(135deg, 
              rgba(232, 245, 254, 0.8) 0%, 
              rgba(240, 248, 255, 0.9) 15%, 
              rgba(225, 250, 251, 0.85) 25%, 
              rgba(248, 253, 253, 0.9) 40%, 
              rgba(198, 242, 237, 0.8) 55%, 
              rgba(184, 230, 225, 0.85) 70%, 
              rgba(198, 242, 237, 0.8) 85%, 
              rgba(232, 245, 254, 0.8) 100%
            )
          `,
          borderRadius: 1,
          position: 'relative',
          border: '2px solid rgba(107, 115, 255, 0.25)',
          overflow: 'hidden',
          boxShadow: 'inset 0 2px 8px rgba(107, 115, 255, 0.1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(45, 55, 72, 0.05) 1px, transparent 1px),
              radial-gradient(circle at 75% 75%, rgba(45, 55, 72, 0.03) 1px, transparent 1px),
              radial-gradient(circle at 50% 50%, rgba(107, 115, 255, 0.04) 2px, transparent 2px)
            `,
            backgroundSize: '50px 50px, 80px 80px, 120px 120px',
            opacity: 0.6,
            zIndex: 1
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              linear-gradient(45deg, transparent 49%, rgba(45, 55, 72, 0.02) 50%, transparent 51%),
              linear-gradient(-45deg, transparent 49%, rgba(45, 55, 72, 0.02) 50%, transparent 51%)
            `,
            backgroundSize: '30px 30px',
            zIndex: 1
          }
        }}>
          {/* 卫星坐标网格线 */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(rgba(107, 115, 255, 0.12) 0.5px, transparent 0.5px),
              linear-gradient(90deg, rgba(107, 115, 255, 0.12) 0.5px, transparent 0.5px),
              linear-gradient(rgba(45, 55, 72, 0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(45, 55, 72, 0.06) 1px, transparent 1px)
            `,
            backgroundSize: '15px 15px, 15px 15px, 60px 60px, 60px 60px',
            zIndex: 2
          }} />
          
          {/* 大陆轮廓 (简化单色) */}
          <Box sx={{
            position: 'absolute',
            top: '20%',
            left: '15%',
            width: '25%',
            height: '40%',
            backgroundColor: 'rgba(34, 197, 94, 0.6)',
            borderRadius: '50% 30% 40% 60%',
            transform: 'rotate(-10deg)',
            zIndex: 3
          }} />
          <Box sx={{
            position: 'absolute',
            top: '30%',
            right: '20%',
            width: '20%',
            height: '35%',
            backgroundColor: 'rgba(34, 197, 94, 0.6)',
            borderRadius: '40% 60% 30% 50%',
            transform: 'rotate(15deg)',
            zIndex: 3
          }} />
          

          
          {/* 两兄弟岛地名标识 */}
          <Box sx={{
            position: 'absolute',
            top: '51%',
            left: '58%',
            zIndex: 8,
            background: 'rgba(248, 253, 253, 0.9)',
            backdropFilter: 'blur(4px)',
            px: 1.5,
            py: 0.8,
            borderRadius: 1,
            border: '1px solid rgba(198, 242, 237, 0.5)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            <Typography variant="caption" sx={{
              color: '#2D3748',
              fontFamily: '"Roboto", sans-serif',
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '0.3px',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              display: 'block',
              lineHeight: 1.2
            }}>
              Two Brothers Islands, Zhejiang Province, China
            </Typography>
            <Typography variant="caption" sx={{
              color: '#5A5A5A',
              fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
              fontSize: '0.6rem',
              fontWeight: 400,
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              display: 'block',
              lineHeight: 1.1
            }}>
              两兄弟岛，浙江省（舟山群岛），中国
            </Typography>
          </Box>
          
          {/* 东中国海海域标识 */}
          <Box sx={{
            position: 'absolute',
            top: '25%',
            left: '45%',
            zIndex: 6,
            transform: 'rotate(-5deg)',
            px: 0,
            py: 0
          }}>
            <Typography variant="h6" sx={{
              color: '#6B73FF',
              fontFamily: '"Roboto", sans-serif',
              fontSize: '1.05rem',
              fontWeight: 700,
              letterSpacing: '1.5px',
              textShadow: '0 1px 3px rgba(0,0,0,0.1)',
              display: 'block',
              lineHeight: 1.2,
              textAlign: 'center'
            }}>
              EAST CHINA SEA
            </Typography>
            <Typography variant="caption" sx={{
              color: '#6B73FF',
              fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
              fontSize: '0.8rem',
              fontWeight: 500,
              textShadow: '0 1px 2px rgba(0,0,0,0.08)',
              display: 'block',
              lineHeight: 1.1,
              textAlign: 'center',
              mt: 0.3
            }}>
              东中国海
            </Typography>
          </Box>
          
         

          {/* 卫星云层效果 */}
          <Box sx={{
            position: 'absolute',
            top: '10%',
            left: '40%',
            width: '35%',
            height: '25%',
            borderRadius: '60% 40% 70% 30%',
            background: 'radial-gradient(ellipse at 30% 40%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.2) 40%, transparent 30%)',
            zIndex: 4,
            animation: 'cloud-drift 20s infinite linear',
            transform: 'rotate(15deg)'
          }} />
          <Box sx={{
            position: 'absolute',
            top: '60%',
            left: '10%',
            width: '30%',
            height: '20%',
            borderRadius: '50% 80% 40% 60%',
            background: 'radial-gradient(ellipse at 60% 30%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 80%)',
            zIndex: 4,
            animation: 'cloud-drift 25s infinite linear reverse',
            transform: 'rotate(-10deg)'
          }} />
          

          

          
          
          {/* 潜艇位置红点 */}
          <Box sx={{
            position: 'absolute',
            top: `${((submarineData.lat - 20) / 40) * 100}%`,
            left: `${((submarineData.lng + 180) / 360) * 100}%`,
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: '#EC4899',
            boxShadow: '0 0 20px rgba(236, 72, 153, 0.6), 0 0 40px rgba(236, 72, 153, 0.3)',
            animation: 'submarine-pulse 2s infinite',
            zIndex: 10,
            border: '2px solid #ffffff'
          }} />
          
          {/* 信号圈 */}
          <Box sx={{
            position: 'absolute',
            top: `${((submarineData.lat - 20) / 40) * 100 -2}%`,
            left: `${((submarineData.lng + 180) / 360) * 100 -0.31}%`,
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '2px solid rgba(236, 72, 153, 0.5)',
            animation: 'signal-ripple 3s infinite'
          }} />
          
          {/* 导航器风格坐标显示框 */}
          <Box sx={{
            position: 'absolute',
            top: 15,
            left: 15,
            zIndex: 20,
            background: 'linear-gradient(135deg, rgba(248, 253, 253, 0.95) 0%, rgba(240, 248, 255, 0.98) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(107, 115, 255, 0.3)',
            borderRadius: 3,
            px: 2.5,
            py: 2,
            boxShadow: '0 6px 24px rgba(107, 115, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 0 20px rgba(107, 115, 255, 0.1)',
            minWidth: 160
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#6B73FF',
                boxShadow: '0 0 8px rgba(107, 115, 255, 0.6)',
                animation: 'pulse 2s infinite'
              }} />
              <Typography variant="caption" sx={{
                color: '#6B73FF',
                fontFamily: 'monospace',
                fontWeight: 700,
                fontSize: '0.65rem',
                letterSpacing: '1px'
              }}>
                NAVIGATION
              </Typography>
            </Box>
            <Box sx={{ mb: 0.5 }}>
              <Typography variant="caption" sx={{
                color: '#2D3748',
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                fontWeight: 600,
                display: 'block'
              }}>
                LAT: {submarineData.lat.toFixed(2)}°N
              </Typography>
            </Box>
            <Box sx={{ mb: 0.5 }}>
              <Typography variant="caption" sx={{
                color: '#2D3748',
                fontFamily: 'monospace',
                fontSize: '0.7rem',
                fontWeight: 600,
                display: 'block'
              }}>
                LON: {submarineData.lng.toFixed(2)}°E
              </Typography>
            </Box>
            <Box sx={{ 
              borderTop: '1px solid rgba(198, 242, 237, 0.4)', 
              pt: 0.5, 
              mt: 0.5 
            }}>
              <Typography variant="caption" sx={{
                color: '#5A5A5A',
                fontFamily: 'monospace',
                fontSize: '0.6rem',
                fontWeight: 500
              }}>
                DEPTH: {submarineData.depth.toFixed(2)}m
              </Typography>
            </Box>
          </Box>
        </Box>
        

      </Paper>

      {/* 参数显示区域 */}
      <Paper sx={{
        height: '220px',
        p: 2,
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(198, 242, 237, 0.15) 50%, rgba(248, 253, 253, 0.12) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{
            width: 6,
            height: 28,
            background: 'linear-gradient(180deg, #10B981 0%, #059669 100%)',
            borderRadius: 1,
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)'
          }} />
          <Box>
            <Typography variant="h5" sx={{ 
              color: '#10B981', 
              fontWeight: 700,
              letterSpacing: '0.8px',
              textShadow: '0 0 10px rgba(16, 185, 129, 0.2)'
            }}>
              SUBMARINE TELEMETRY SYSTEM
            </Typography>
            <Typography variant="caption" sx={{ 
              color: '#10B981', 
              letterSpacing: '1.5px',
              fontSize: '0.65rem'
            }}>
            </Typography>
          </Box>
        </Box>
        
        <Grid container spacing={2} justifyContent="center" alignItems="stretch">
          {/* 位置信息 */}
          <Grid item xs={6}>
            <Box sx={{ 
              p: 2, 
              background: 'linear-gradient(135deg, rgba(107, 115, 255, 0.12) 0%, rgba(91, 99, 235, 0.08) 100%)', 
              borderRadius: 1,
              border: '1px solid rgba(107, 115, 255, 0.25)',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 2px 12px rgba(107, 115, 255, 0.1)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocationOnIcon sx={{ color: '#6B73FF', fontSize: '1.2rem' }} />
                <Typography variant="subtitle2" sx={{ color: '#5A61E6', fontWeight: 600 }}>
                  Position Coordinates
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: '#5A5A5A', fontSize: '0.85rem', minWidth: 72 }}>
                  Latitude:
                </Typography>
                <Typography variant="body2" sx={{ color: '#2D3748', fontFamily: 'monospace', fontWeight: 700, textAlign: 'right', flex: 1 }}>
                  {submarineData.lat.toFixed(2)}°
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: '#5A5A5A', fontSize: '0.85rem', minWidth: 72 }}>
                  Longitude:
                </Typography>
                <Typography variant="body2" sx={{ color: '#2D3748', fontFamily: 'monospace', fontWeight: 700, textAlign: 'right', flex: 1 }}>
                  {submarineData.lng.toFixed(2)}°
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#5A5A5A', fontSize: '0.85rem', minWidth: 72 }}>
                  Depth:
                </Typography>
                <Typography variant="body2" sx={{ color: '#2D3748', fontFamily: 'monospace', fontWeight: 700, textAlign: 'right', flex: 1 }}>
                  {submarineData.depth}m
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          {/* 信号状态 */}
          <Grid item xs={6}>
            <Box sx={{ 
              p: 2, 
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.08) 100%)', 
              borderRadius: 1,
              border: '1px solid rgba(16, 185, 129, 0.25)',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 2px 12px rgba(16, 185, 129, 0.1)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SignalWifiIcon sx={{ color: '#10B981', fontSize: '1.2rem' }} />
                <Typography variant="subtitle2" sx={{ color: '#059669', fontWeight: 600 }}>
                  Signal Transmission
                </Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#5A5A5A', fontSize: '0.85rem' }}>
                    Signal Strength:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#2D3748', fontFamily: 'monospace', fontWeight: 700 }}>
                    {submarineData.signalStrength.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={submarineData.signalStrength} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    bgcolor: 'rgba(16, 185, 129, 0.15)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#10B981'
                    }
                  }} 
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#5A5A5A', fontSize: '0.85rem' }}>
                  Transmission Speed:
                </Typography>
                <Typography variant="body2" sx={{ color: '#2D3748', fontFamily: 'monospace', fontWeight: 700 }}>
                  {submarineData.transmissionSpeed.toFixed(1)} Mbps
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          {/* 电量状态 */}
          <Grid item xs={6}>
            <Box sx={{ 
              p: 2, 
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.08) 100%)', 
              borderRadius: 1,
              border: '1px solid rgba(245, 158, 11, 0.25)',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 2px 12px rgba(245, 158, 11, 0.1)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <BatteryFullIcon sx={{ color: '#F59E0B', fontSize: '1.2rem' }} />
                <Typography variant="subtitle2" sx={{ color: '#D97706', fontWeight: 600 }}>
                  Battery Status
                </Typography>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#5A5A5A', fontSize: '0.85rem' }}>
                    Remaining Battery:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#2D3748', fontFamily: 'monospace', fontWeight: 700 }}>
                    {submarineData.battery.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={submarineData.battery} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    bgcolor: 'rgba(245, 158, 11, 0.15)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: submarineData.battery > 20 ? '#F59E0B' : '#EF4444'
                    }
                  }} 
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#5A5A5A', fontSize: '0.85rem' }}>
                  Estimated Endurance:
                </Typography>
                <Typography variant="body2" sx={{ color: '#2D3748', fontFamily: 'monospace', fontWeight: 700 }}>
                  {(submarineData.battery * 0.5).toFixed(1)}h
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          {/* 速度状态 */}
          <Grid item xs={6}>
            <Box sx={{ 
              p: 2, 
              background: 'linear-gradient(135deg, rgba(206, 177, 225, 0.12) 0%, rgba(184, 167, 217, 0.08) 100%)', 
              borderRadius: 1,
              border: '1px solid rgba(206, 177, 225, 0.25)',
              height: '100px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 2px 12px rgba(206, 177, 225, 0.1)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SpeedIcon sx={{ color: '#CEB1E1', fontSize: '1.2rem' }} />
                <Typography variant="subtitle2" sx={{ color: '#B8A7D9', fontWeight: 600 }}>
                  Operation Status
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: '#5A5A5A', fontSize: '0.85rem' }}>
                  Current Speed:
                </Typography>
                <Typography variant="body2" sx={{ color: '#2D3748', fontFamily: 'monospace', fontWeight: 700 }}>
                  {submarineData.speed.toFixed(1)} knots
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: '#5A5A5A', fontSize: '0.85rem' }}>
                  Operation Mode:
                </Typography>
                <Typography variant="body2" sx={{ color: '#2D3748', fontFamily: 'monospace', fontWeight: 700 }}>
                  Auto Cruise
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#5A5A5A', fontSize: '0.85rem' }}>
                  Status:
                </Typography>
                <Typography variant="body2" sx={{ color: '#2D3748', fontFamily: 'monospace', fontWeight: 700 }}>
                  Normal Operation
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );

  return (
    <Box
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      sx={{
        position: 'relative',
        bgcolor: '#E1FAFB',
        backgroundImage: 'linear-gradient(135deg, #E1FAFB 0%, #F0F8FF 50%, #E1FAFB 100%)',
        zIndex: 0,
      }}
    >
      {/* 顶部导航栏 */}
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
          {/* Logo区域 */}
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
          
          {/* 导航菜单 */}
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
      
      {/* 主要内容区域 */}
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pt: 2,
        pb: 1
      }}>

        
        {/* 主要复合组件容器 */}
        <Box sx={{ width: '90%', position: 'relative', display: 'flex', alignItems: 'stretch', gap: 2 }}>
          {/* 左侧模型选择器 (仅在监测台模式显示) */}
          {viewMode === 'monitor' && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(180deg, #F8FDFD 0%, #F0F8FF 50%, #E8F5FE 100%)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                zIndex: 10,
                overflow: 'hidden',
                minWidth: 200,
                height: '660px',
                border: '1px solid #C6F2ED'
              }}
            >
              {/* 海洋环流模型选项卡 */}
              <Button
                onClick={() => setSelectedModel('ocean')}
                sx={{
                  px: 4,
                  py: 3,
                  borderRadius: 0,
                  flex: 1,
                  background: selectedModel === 'ocean' 
                    ? 'linear-gradient(135deg, rgba(107, 115, 255, 0.15) 0%, rgba(198, 242, 237, 0.2) 100%)' 
                    : 'transparent',
                  color: selectedModel === 'ocean' ? '#6B73FF' : '#5A5A5A',
                  borderRight: selectedModel === 'ocean' ? '4px solid #6B73FF' : 'none',
                  borderBottom: '1px solid #B8E6E1',
                  fontSize: '1.1rem',
                  fontWeight: selectedModel === 'ocean' ? 600 : 400,
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 1,
                  position: 'relative',
                  '&:hover': {
                    background: selectedModel === 'ocean' 
                      ? 'linear-gradient(135deg, rgba(107, 115, 255, 0.2) 0%, rgba(198, 242, 237, 0.25) 100%)'
                      : 'rgba(107, 115, 255, 0.08)',
                    color: '#6B73FF',
                    boxShadow: selectedModel === 'ocean' 
                      ? 'inset 0 0 20px rgba(107, 115, 255, 0.1)' 
                      : 'inset 0 0 10px rgba(107, 115, 255, 0.05)'
                  },
                  transition: 'all 0.3s ease',
                  '&::before': selectedModel === 'ocean' ? {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(107, 115, 255, 0.05) 50%, transparent 100%)',
                    pointerEvents: 'none'
                  } : {}
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: selectedModel === 'ocean' ? '#6B73FF' : '#A0A0A0',
                      boxShadow: selectedModel === 'ocean' ? '0 0 8px rgba(107, 115, 255, 0.6)' : 'none',
                      transition: 'all 0.3s ease'
                    }}
                  />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.5px' }}>
                    Ocean Current Model
                  </Typography>
                </Box>
                            <Typography variant="caption" sx={{ 
                color: selectedModel === 'ocean' ? '#8B95FF' : '#7A7A7A', 
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                letterSpacing: '0.5px',
                ml: 3
              }}>
                海洋环流模型
              </Typography>
              </Button>

              {/* 污染物扩散模型选项卡 */}
              <Button
                onClick={() => setSelectedModel('pollution')}
                sx={{
                  px: 4,
                  py: 2.5,
                  borderRadius: 0,
                  flex: 1,
                  background: selectedModel === 'pollution' 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(198, 242, 237, 0.2) 100%)' 
                    : 'transparent',
                  color: selectedModel === 'pollution' ? '#10B981' : '#5A5A5A',
                  borderRight: selectedModel === 'pollution' ? '4px solid #10B981' : 'none',
                  borderBottom: '1px solid #B8E6E1',
                  fontSize: '1.1rem',
                  fontWeight: selectedModel === 'pollution' ? 600 : 400,
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 1,
                  position: 'relative',
                  '&:hover': {
                    background: selectedModel === 'pollution' 
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(198, 242, 237, 0.25) 100%)'
                      : 'rgba(16, 185, 129, 0.08)',
                    color: '#10B981',
                    boxShadow: selectedModel === 'pollution' 
                      ? 'inset 0 0 20px rgba(16, 185, 129, 0.1)' 
                      : 'inset 0 0 10px rgba(16, 185, 129, 0.05)'
                  },
                  transition: 'all 0.3s ease',
                  '&::before': selectedModel === 'pollution' ? {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.05) 50%, transparent 100%)',
                    pointerEvents: 'none'
                  } : {}
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: selectedModel === 'pollution' ? '#10B981' : '#A0A0A0',
                      boxShadow: selectedModel === 'pollution' ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none',
                      transition: 'all 0.3s ease'
                    }}
                  />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.5px' }}>
                    Pollutant Diffusion Model
                  </Typography>
                </Box>
                            <Typography variant="caption" sx={{ 
                color: selectedModel === 'pollution' ? '#34D399' : '#7A7A7A', 
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                letterSpacing: '0.5px',
                ml: 3
              }}>
                污染扩散模型
              </Typography>
              </Button>

              {/* 塑料检测模型选项卡 */}
              <Button
                onClick={() => {
                  setSelectedModel('detection');
                  setViewMode('monitor');
                }}
                sx={{
                  px: 4,
                  py: 2.5,
                  borderRadius: 0,
                  flex: 1,
                  background: selectedModel === 'detection' 
                    ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(198, 242, 237, 0.2) 100%)' 
                    : 'transparent',
                  color: selectedModel === 'detection' ? '#EC4899' : '#5A5A5A',
                  borderRight: selectedModel === 'detection' ? '4px solid #EC4899' : 'none',
                  fontSize: '1.1rem',
                  fontWeight: selectedModel === 'detection' ? 600 : 400,
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 1,
                  position: 'relative',
                  '&:hover': {
                    background: selectedModel === 'detection' 
                      ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(198, 242, 237, 0.25) 100%)'
                      : 'rgba(236, 72, 153, 0.08)',
                    color: '#EC4899',
                    boxShadow: selectedModel === 'detection' 
                      ? 'inset 0 0 20px rgba(236, 72, 153, 0.1)' 
                      : 'inset 0 0 10px rgba(236, 72, 153, 0.05)'
                  },
                  transition: 'all 0.3s ease',
                  '&::before': selectedModel === 'detection' ? {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(236, 72, 153, 0.05) 50%, transparent 100%)',
                    pointerEvents: 'none'
                  } : {}
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: selectedModel === 'detection' ? '#EC4899' : '#A0A0A0',
                      boxShadow: selectedModel === 'detection' ? '0 0 8px rgba(236, 72, 153, 0.6)' : 'none',
                      transition: 'all 0.3s ease'
                    }}
                  />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.5px' }}>
                    Plastic Detection SYSTEM
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 3 }}>
                  <Typography variant="caption" sx={{ 
                    color: selectedModel === 'detection' ? '#F472B6' : '#7A7A7A', 
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    letterSpacing: '0.5px'
                  }}>
                    塑料识别系统
                  </Typography>
                  {/* YOLO Logo */}
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '14.75px',
                    borderRadius: 1,
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(26, 35, 126, 0.3)',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <img
                      src="/yolo-logo.png" // 请将您的YOLO logo图片放在public文件夹中并命名为yolo-logo.png
                      alt="YOLO"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        // 如果图片加载失败，显示文字备选方案
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <Box sx={{
                      display: 'none',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      bgcolor: '#1A237E',
                      color: 'white',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      fontFamily: '"Roboto Mono", monospace',
                      letterSpacing: '1px'
                    }}>
                      YOLO
                    </Box>
                  </Box>
                </Box>
              </Button>
            </Box>
          )}

          {/* 中间展示区域 */}
          <Paper 
            elevation={0} 
            sx={{ 
              flex: 1,
              minHeight: 400,
              p: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              borderRadius: viewMode === 'monitor' ? '0' : '12px',
              position: 'relative',
              background: 'linear-gradient(135deg, #F8FDFD 0%, #F0F8FF 100%)',
              border: '1px solid #C6F2ED',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            {viewMode === 'monitor' ? (
              <>
                <iframe
                  src={selectedModel === 'ocean' ? '/3dv5.html' : selectedModel === 'pollution' ? '/3dv6.html' : 'about:blank'}
                  style={{ 
                    width: '100%', 
                    height: '660px', 
                    border: 'none', 
                    display: selectedModel === 'detection' ? 'none' : 'block',
                    borderRadius: '0'
                  }}
                  title={selectedModel === 'ocean' ? 'Ocean Current Model' : selectedModel === 'pollution' ? 'Pollutant Diffusion Model' : 'Plastic Detection Model'}
                />
                
                {/* 塑料检测模型内容 */}
                {selectedModel === 'detection' && (
                  <Box sx={{ width: '100%', height: '660px', p: 0 }}>
                    <SimplePlasticDetectionPanel />
                  </Box>
                )}
                
                {/* 模型标题指示器 */}
                {selectedModel !== 'detection' && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 20,
                      right: 20,
                      background: selectedModel === 'ocean' 
                        ? 'linear-gradient(135deg, rgba(107, 115, 255, 0.9) 0%, rgba(91, 99, 235, 0.9) 100%)'
                        : 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
                      px: 3,
                      py: 1.5,
                      borderRadius: 3,
                      boxShadow: selectedModel === 'ocean' 
                        ? '0 4px 20px rgba(107, 115, 255, 0.3), 0 0 0 1px rgba(107, 115, 255, 0.2)'
                        : '0 4px 20px rgba(16, 185, 129, 0.3), 0 0 0 1px rgba(16, 185, 129, 0.2)',
                      zIndex: 5,
                      backdropFilter: 'blur(8px)',
                      border: `1px solid ${selectedModel === 'ocean' ? 'rgba(107, 115, 255, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5
                    }}
                  >
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        boxShadow: `0 0 10px ${selectedModel === 'ocean' ? '#8B95FF' : '#34D399'}`,
                        animation: 'pulse 2s infinite'
                      }}
                    />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 700, 
                        color: '#ffffff',
                        fontSize: '0.9rem',
                        letterSpacing: '0.5px',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      {selectedModel === 'ocean' ? 'Ocean Current Model' : 'Pollutant Diffusion Model'}
                    </Typography>
                  </Box>
                )}
              </>
            ) : viewMode === 'console' ? (
              renderConsole()
            ) : null}
          </Paper>

          {/* 右侧视图模式选择器 */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              background: 'linear-gradient(180deg, #F8FDFD 0%, #F0F8FF 50%, #E8F5FE 100%)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
              zIndex: 10,
              overflow: 'hidden',
              minWidth: 180,
              height: '660px',
              border: '1px solid #CEB1E1'
            }}
          >
            {/* 监测台选项卡 */}
            <Button
              onClick={() => setViewMode('monitor')}
              sx={{
                px: 3,
                py: 3,
                borderRadius: 0,
                flex: 1,
                background: viewMode === 'monitor' 
                  ? 'linear-gradient(135deg, rgba(206, 177, 225, 0.2) 0%, rgba(184, 167, 217, 0.3) 100%)' 
                  : 'transparent',
                color: viewMode === 'monitor' ? '#B77DD1' : '#5A5A5A',
                borderRight: viewMode === 'monitor' ? '4px solid #CEB1E1' : 'none',
                borderBottom: '1px solid #B8E6E1',
                fontSize: '1rem',
                fontWeight: viewMode === 'monitor' ? 600 : 400,
                textAlign: 'left',
                justifyContent: 'flex-start',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 1,
                position: 'relative',
                '&:hover': {
                  background: viewMode === 'monitor' 
                    ? 'linear-gradient(135deg, rgba(206, 177, 225, 0.3) 0%, rgba(184, 167, 217, 0.4) 100%)'
                    : 'rgba(206, 177, 225, 0.1)',
                  color: '#B77DD1',
                  boxShadow: viewMode === 'monitor' 
                    ? 'inset 0 0 20px rgba(206, 177, 225, 0.2)' 
                    : 'inset 0 0 10px rgba(206, 177, 225, 0.1)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <MonitorIcon sx={{ 
                  color: viewMode === 'monitor' ? '#CEB1E1' : '#A0A0A0',
                  fontSize: '1.2rem',
                  transition: 'all 0.3s ease'
                }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '0.5px' }}>
                  Monitor
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ 
                color: viewMode === 'monitor' ? '#D4B8E5' : '#7A7A7A', 
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                letterSpacing: '0.5px',
                ml: 3.5
              }}>
                监测台
              </Typography>
            </Button>

            {/* 控制台选项卡 */}
            <Button
              onClick={() => setViewMode('console')}
              sx={{
                px: 3,
                py: 2.5,
                borderRadius: 0,
                flex: 1,
                background: viewMode === 'console' 
                  ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(219, 39, 119, 0.2) 100%)' 
                  : 'transparent',
                color: viewMode === 'console' ? '#EC4899' : '#5A5A5A',
                borderRight: viewMode === 'console' ? '4px solid #EC4899' : 'none',
                borderBottom: '1px solid #B8E6E1',
                fontSize: '1rem',
                fontWeight: viewMode === 'console' ? 600 : 400,
                textAlign: 'left',
                justifyContent: 'flex-start',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 1,
                position: 'relative',
                '&:hover': {
                  background: viewMode === 'console' 
                    ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(219, 39, 119, 0.25) 100%)'
                    : 'rgba(236, 72, 153, 0.08)',
                  color: '#EC4899',
                  boxShadow: viewMode === 'console' 
                    ? 'inset 0 0 20px rgba(236, 72, 153, 0.15)' 
                    : 'inset 0 0 10px rgba(236, 72, 153, 0.08)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <SettingsRemoteIcon sx={{ 
                  color: viewMode === 'console' ? '#EC4899' : '#A0A0A0',
                  fontSize: '1.2rem',
                  transition: 'all 0.3s ease'
                }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '0.5px' }}>
                  Terminal
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ 
                color: viewMode === 'console' ? '#F472B6' : '#7A7A7A', 
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                letterSpacing: '0.5px',
                ml: 3.5
              }}>
                控制台
              </Typography>
            </Button>
          </Box>
        </Box>
      </Box>

      {/* CSS动画样式 */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.2); }
          }
          
          @keyframes cloud-drift {
            0% { transform: translateX(0) rotate(15deg); opacity: 0.8; }
            25% { transform: translateX(10px) rotate(18deg); opacity: 0.9; }
            50% { transform: translateX(20px) rotate(15deg); opacity: 0.7; }
            75% { transform: translateX(15px) rotate(12deg); opacity: 0.8; }
            100% { transform: translateX(0) rotate(15deg); opacity: 0.8; }
          }
          
          @keyframes submarine-pulse {
            0%, 100% { 
              transform: scale(1); 
              box-shadow: 0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.4);
            }
            50% { 
              transform: scale(1.1); 
              box-shadow: 0 0 30px rgba(239, 68, 68, 1), 0 0 60px rgba(239, 68, 68, 0.6);
            }
          }
          
          @keyframes signal-ripple {
            0% { 
              transform: scale(1); 
              opacity: 1; 
            }
            100% { 
              transform: scale(3); 
              opacity: 0; 
            }
          }
        `}
      </style>

      {/* 路径规划弹窗 */}
      <Dialog 
        open={pathPlanningOpen} 
        onClose={() => setPathPlanningOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #F8FDFD 0%, #F0F8FF 100%)',
            color: '#2D3748',
            border: '1px solid #C6F2ED'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#2D3748', 
          borderBottom: '1px solid #B8E6E1',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <RouteIcon sx={{ color: '#6B73FF' }} />
          Submarine Path Planning System
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={6}>
              <Typography variant="h6" sx={{ color: '#6B73FF', mb: 2 }}>
                Current Route Configuration
              </Typography>
              <Box sx={{ 
                bgcolor: 'rgba(107, 115, 255, 0.1)', 
                p: 2, 
                borderRadius: 1,
                border: '1px solid rgba(107, 115, 255, 0.2)'
              }}>
                {cruisePath.map((point, index) => (
                  <Typography key={index} variant="body2" sx={{ 
                    color: '#2D3748', 
                    fontFamily: 'monospace',
                    mb: 0.5
                  }}>
                    Point {index + 1}: {point.lat.toFixed(4)}°, {point.lng.toFixed(4)}°
                  </Typography>
                ))}
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6" sx={{ color: '#10B981', mb: 2 }}>
                Mission Parameters
              </Typography>
              <Box sx={{ 
                bgcolor: 'rgba(16, 185, 129, 0.1)', 
                p: 2, 
                borderRadius: 1,
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <Typography variant="body2" sx={{ color: '#2D3748', mb: 1 }}>
                  🎯 Mission Type: Ocean Survey
                </Typography>
                <Typography variant="body2" sx={{ color: '#2D3748', mb: 1 }}>
                  📏 Total Distance: 78.5 km
                </Typography>
                <Typography variant="body2" sx={{ color: '#2D3748', mb: 1 }}>
                  ⏱️ Estimated Duration: 6.2 hours
                </Typography>
                <Typography variant="body2" sx={{ color: '#2D3748', mb: 1 }}>
                  🔋 Energy Consumption: 52%
                </Typography>
                <Typography variant="body2" sx={{ color: '#2D3748', mb: 1 }}>
                  🌊 Max Depth: 200m
                </Typography>
                <Typography variant="body2" sx={{ color: '#2D3748' }}>
                  📊 Coverage Area: 285 km²
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Typography variant="h6" sx={{ color: '#F59E0B', mt: 3, mb: 2 }}>
            Advanced Settings
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Button
                variant="outlined"
                fullWidth
                sx={{
                  color: '#6B73FF',
                  borderColor: 'rgba(107, 115, 255, 0.4)',
                  '&:hover': { borderColor: '#6B73FF', backgroundColor: 'rgba(107, 115, 255, 0.1)' }
                }}
              >
                Optimize Route
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Button
                variant="outlined"
                fullWidth
                sx={{
                  color: '#10B981',
                  borderColor: 'rgba(16, 185, 129, 0.4)',
                  '&:hover': { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)' }
                }}
              >
                Add Waypoint
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Button
                variant="outlined"
                fullWidth
                sx={{
                  color: '#EC4899',
                  borderColor: 'rgba(236, 72, 153, 0.4)',
                  '&:hover': { borderColor: '#EC4899', backgroundColor: 'rgba(236, 72, 153, 0.1)' }
                }}
              >
                Emergency Return
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #B8E6E1', p: 3 }}>
          <Button 
            onClick={() => setPathPlanningOpen(false)}
            sx={{ color: '#5A5A5A' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            sx={{ 
              bgcolor: '#6B73FF', 
              color: '#ffffff',
              '&:hover': { bgcolor: '#5A61E6' }
            }}
          >
            Deploy Mission
          </Button>
        </DialogActions>
      </Dialog>

      {/* 聊天抽屉 */}
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
        
        {/* 消息显示区 */}
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
              {/* 头像 */}
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
              
              {/* 消息气泡 */}
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
        
        {/* 输入区域 */}
        <Box sx={{
          borderTop: '1px solid #C6F2ED',
          bgcolor: '#F8FDFD',
          p: 1.5
        }}>
          {/* 输入区上方提示 */}
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

export default UserModePage; 