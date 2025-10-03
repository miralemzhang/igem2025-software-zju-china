import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Grid, 
  CircularProgress,
  LinearProgress,
  Card,
  CardContent,
  Chip,
  Alert,
  IconButton,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Camera as CameraIcon,
  Visibility as VisibilityIcon,
  BarChart as ChartIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import io from 'socket.io-client';

const PlasticDetectionPanel = () => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [detectionData, setDetectionData] = useState(null);
  const [statistics, setStatistics] = useState({
    total_detections: 0,
    plastic_types: {},
    detection_confidence_avg: 0.0,
    session_start_time: null
  });
  const [currentFrame, setCurrentFrame] = useState(null);
  const [fps, setFps] = useState(0);
  const [error, setError] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [waitingTime, setWaitingTime] = useState(0);

  const socketRef = useRef(null);
  const detectionListRef = useRef(null);

  useEffect(() => {
    const socket = io('http://localhost:5001', {
      timeout: 5000,
      transports: ['websocket', 'polling'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ WebSocket连接成功');
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket连接断开:', reason);
      setIsConnected(false);
      setIsDetecting(false); // 断开连接时停止检测状态
      setCurrentFrame(null); // 清空视频帧
    });

    socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket连接错误:', error);
      setIsConnected(false);
      setError('无法连接到检测服务，请确保后端服务正在运行');
    });

    socket.on('detection_update', (data) => {
      try {
        setDetectionData(data);
        setCurrentFrame(data.frame);
        setStatistics(data.statistics);
        setFps(data.fps || 0);
        
        if (autoScroll && detectionListRef.current) {
          detectionListRef.current.scrollTop = detectionListRef.current.scrollHeight;
        }
      } catch (err) {
        console.error('处理检测数据错误:', err);
      }
    });

    socket.on('connection_status', (data) => {
      console.log('连接状态:', data);
    });

    socket.on('error', (error) => {
      console.error('Socket错误:', error);
      setError('WebSocket通信错误');
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [autoScroll]);

  useEffect(() => {
    let interval;
    if (isDetecting && !currentFrame) {
      interval = setInterval(() => {
        setWaitingTime(prev => prev + 1);
      }, 1000);
    } else {
      setWaitingTime(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDetecting, currentFrame]);

  const startDetection = async () => {
    try {
      setError(null);
      setIsDetecting(false); // 重置状态
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
      
      console.log('🔄 正在连接检测服务...');
      
      const response = await fetch('http://localhost:5001/api/detection/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ camera_id: 0 }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP错误: ${response.status} - ${response.statusText}\n详细信息: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        setIsDetecting(true);
        setWaitingTime(0); // 重置等待时间
        console.log('🎬 检测已启动');
        setError(null);
        
        setTimeout(() => {
          if (isDetecting && !currentFrame) {
            setError('视频流获取超时，请检查摄像头状态和权限');
            setIsDetecting(false);
          }
        }, 30000);
      } else {
        setError(result.message || '启动检测失败');
        setIsDetecting(false);
      }
    } catch (err) {
      setIsDetecting(false);
      
      if (err.name === 'AbortError') {
        setError('连接超时，请检查后端服务是否正在运行');
      } else if (err.message.includes('fetch')) {
        setError('无法连接到检测服务，请确保后端服务正在运行在端口5001');
      } else {
        setError(`启动检测失败: ${err.message}`);
      }
      
      console.error('启动检测错误:', err);
    }
  };

  const stopDetection = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/detection/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setIsDetecting(false);
        setCurrentFrame(null);
        console.log('⏹️ 检测已停止');
      } else {
        setError(result.message || '停止检测失败');
      }
    } catch (err) {
      setError('停止检测失败');
      console.error('停止检测错误:', err);
    }
  };

  const resetStatistics = async () => {
    try {
      await fetch('http://localhost:5001/api/detection/statistics/reset', {
        method: 'POST'
      });
      setStatistics({
        total_detections: 0,
        plastic_types: {},
        detection_confidence_avg: 0.0,
        session_start_time: null
      });
    } catch (err) {
      console.error('重置统计失败:', err);
    }
  };

  const getPlasticTypesChart = () => {
    const types = Object.entries(statistics.plastic_types || {});
    const total = statistics.total_detections || 1;
    
    return types.map(([name, count]) => ({
      name,
      count,
      percentage: ((count / total) * 100).toFixed(1)
    }));
  };

  const getSessionDuration = () => {
    if (!statistics.session_start_time) return '00:00:00';
    
    const start = new Date(statistics.session_start_time);
    const now = new Date();
    const duration = Math.floor((now - start) / 1000);
    
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper sx={{
        p: 2,
        background: 'linear-gradient(135deg, #F8FDFD 0%, #F0F8FF 100%)',
        border: '1px solid #C6F2ED',
        borderRadius: 2
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 6,
              height: 32,
              background: 'linear-gradient(180deg, #EC4899 0%, #DB2777 100%)',
              borderRadius: 1
            }} />
            <Box>
              <Typography variant="h5" sx={{ 
                color: '#2D3748', 
                fontWeight: 700,
                letterSpacing: '1px',
                fontFamily: '"Orbitron", "Roboto Mono", monospace',
                textShadow: '0 0 10px rgba(236, 72, 153, 0.2)'
              }}>
                AI PLASTIC DETECTION SYSTEM
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#5A5A5A', 
                fontFamily: 'monospace',
                letterSpacing: '2px',
                fontSize: '0.65rem'
              }}>
                基于YOLO的实时塑料垃圾检测
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isConnected ? '#10B981' : '#EF4444',
              boxShadow: isConnected ? '0 0 8px rgba(16, 185, 129, 0.6)' : '0 0 8px rgba(239, 68, 68, 0.6)',
              animation: isConnected ? 'pulse 2s infinite' : 'none'
            }} />
            <Typography variant="caption" sx={{ 
              color: isConnected ? '#10B981' : '#EF4444',
              fontFamily: 'monospace',
              fontWeight: 600
            }}>
              {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <IconButton size="small" onClick={() => setError(null)}>
                ×
              </IconButton>
            }
          >
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={isDetecting ? <StopIcon /> : <PlayIcon />}
            onClick={isDetecting ? stopDetection : startDetection}
            disabled={!isConnected}
            sx={{
              bgcolor: isDetecting ? '#EF4444' : '#10B981',
              color: '#ffffff',
              fontWeight: 600,
              px: 3,
              py: 1,
              '&:hover': {
                bgcolor: isDetecting ? '#DC2626' : '#059669'
              },
              '&:disabled': {
                bgcolor: '#9CA3AF'
              }
            }}
          >
            {isDetecting ? '停止检测' : '开始检测'}
          </Button>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={resetStatistics}
            sx={{
              color: '#6B73FF',
              borderColor: 'rgba(107, 115, 255, 0.4)',
              '&:hover': {
                borderColor: '#6B73FF',
                backgroundColor: 'rgba(107, 115, 255, 0.1)'
              }
            }}
          >
            重置统计
          </Button>

          <Button
            variant="outlined"
            onClick={async () => {
              try {
                const response = await fetch('http://localhost:5001/api/detection/status');
                const result = await response.json();
                alert(`服务状态: ${JSON.stringify(result, null, 2)}`);
              } catch (err) {
                alert(`服务检查失败: ${err.message}`);
              }
            }}
            sx={{
              color: '#8B5CF6',
              borderColor: 'rgba(139, 92, 246, 0.4)',
              '&:hover': {
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)'
              }
            }}
          >
            🔍 检查服务
          </Button>

          {isDetecting && !currentFrame && waitingTime > 15 && (
            <Button
              variant="outlined"
              onClick={async () => {
                await stopDetection();
                setTimeout(() => startDetection(), 1000);
              }}
              sx={{
                color: '#F59E0B',
                borderColor: 'rgba(245, 158, 11, 0.4)',
                '&:hover': {
                  borderColor: '#F59E0B',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)'
                }
              }}
            >
              🔄 重启检测
            </Button>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                color="primary"
              />
            }
            label="自动滚动"
            sx={{ ml: 2 }}
          />
        </Box>
      </Paper>

      <Grid container spacing={2} sx={{ flex: 1 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{
            height: '100%',
            minHeight: 400,
            p: 2,
            background: 'linear-gradient(135deg, #F8FDFD 0%, #F0F8FF 100%)',
            border: '1px solid #C6F2ED',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CameraIcon sx={{ color: '#EC4899' }} />
              <Typography variant="h6" sx={{ color: '#2D3748', fontWeight: 600 }}>
                实时检测视频流
              </Typography>
              {fps > 0 && (
                <Chip 
                  label={`${fps.toFixed(1)} FPS`} 
                  size="small" 
                  sx={{ ml: 'auto', bgcolor: '#10B981', color: '#ffffff' }}
                />
              )}
            </Box>
            
            <Box sx={{
              flex: 1,
              bgcolor: '#000000',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '300px'
            }}>
              {currentFrame ? (
                <img
                  src={`data:image/jpeg;base64,${currentFrame}`}
                  alt="检测视频流"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '4px'
                  }}
                  onError={() => {
                    console.error('视频帧加载失败');
                    setError('视频帧显示错误');
                  }}
                />
              ) : isDetecting ? (
                <Box sx={{ textAlign: 'center', color: '#ffffff', p: 4 }}>
                  <CircularProgress sx={{ color: '#EC4899', mb: 2 }} size={60} />
                  <Typography variant="h6" sx={{ mb: 1 }}>正在启动摄像头...</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
                    {isConnected ? '已连接到检测服务，等待视频流...' : '正在连接检测服务...'}
                  </Typography>
                  {waitingTime > 0 && (
                    <Typography variant="caption" sx={{ opacity: 0.6 }}>
                      等待时间: {waitingTime}秒
                    </Typography>
                  )}
                  {waitingTime > 10 && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', borderRadius: 1, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      <Typography variant="caption" sx={{ color: '#FEF2F2', display: 'block', mb: 1 }}>
                        📋 可能的问题：
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#FEF2F2', display: 'block', fontSize: '0.7rem' }}>
                        • 摄像头被其他应用占用<br/>
                        • 摄像头权限未授予<br/>
                        • 后端检测循环异常<br/>
                        • 尝试重新启动检测服务
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : !isConnected ? (
                <Box sx={{ textAlign: 'center', color: '#EF4444', p: 4 }}>
                  <WarningIcon sx={{ fontSize: 64, mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>服务未连接</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    请启动YOLO检测服务 (端口5001)
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', color: '#9CA3AF', p: 4 }}>
                  <CameraIcon sx={{ fontSize: 64, mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>准备就绪</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    点击"开始检测"启动摄像头
                  </Typography>
                </Box>
              )}
              
              {isDetecting && !currentFrame && (
                <Box sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                  color: '#ffffff',
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  fontSize: '0.8rem'
                }}>
                  等待视频流...
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
            <Paper sx={{
              p: 2,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(198, 242, 237, 0.2) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ChartIcon sx={{ color: '#10B981' }} />
                <Typography variant="h6" sx={{ color: '#059669', fontWeight: 600 }}>
                  检测统计
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: '#2D3748', fontWeight: 700 }}>
                      {statistics.total_detections}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#5A5A5A' }}>
                      总检测数
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: '#2D3748', fontWeight: 700 }}>
                      {(statistics.detection_confidence_avg * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#5A5A5A' }}>
                      平均置信度
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" sx={{ color: '#059669', mb: 1 }}>
                会话时长: {getSessionDuration()}
              </Typography>
              
              <Typography variant="subtitle2" sx={{ color: '#059669', mb: 1 }}>
                检测类型分布:
              </Typography>
              {getPlasticTypesChart().map((item, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: '#2D3748' }}>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#2D3748' }}>
                      {item.count} ({item.percentage}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={parseFloat(item.percentage)}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: 'rgba(16, 185, 129, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#10B981'
                      }
                    }}
                  />
                </Box>
              ))}
            </Paper>

            <Paper sx={{
              flex: 1,
              p: 2,
              background: 'linear-gradient(135deg, rgba(107, 115, 255, 0.1) 0%, rgba(198, 242, 237, 0.2) 100%)',
              border: '1px solid rgba(107, 115, 255, 0.2)',
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <VisibilityIcon sx={{ color: '#6B73FF' }} />
                <Typography variant="h6" sx={{ color: '#5A61E6', fontWeight: 600 }}>
                  最近检测
                </Typography>
              </Box>
              
              <Box 
                ref={detectionListRef}
                sx={{ 
                  flex: 1, 
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '4px'
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#F0F8FF'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#C6F2ED',
                    borderRadius: '2px'
                  }
                }}
              >
                {detectionData && detectionData.detections && detectionData.detections.length > 0 ? (
                  detectionData.detections.map((detection, index) => (
                    <Card key={index} sx={{ mb: 1, bgcolor: '#F8FDFD', border: '1px solid #E1FAFB' }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2" sx={{ color: '#2D3748', fontWeight: 600 }}>
                            {detection.class_name}
                          </Typography>
                          <Chip
                            label={`${(detection.confidence * 100).toFixed(1)}%`}
                            size="small"
                            sx={{
                              bgcolor: detection.confidence > 0.8 ? '#10B981' : detection.confidence > 0.5 ? '#F59E0B' : '#EF4444',
                              color: '#ffffff'
                            }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: '#5A5A5A' }}>
                          位置: [{detection.bbox.map(v => v.toFixed(0)).join(', ')}]
                        </Typography>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4, color: '#9CA3AF' }}>
                    <WarningIcon sx={{ fontSize: 48, mb: 1 }} />
                    <Typography variant="body2">暂无检测结果</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.2); }
          }
        `}
      </style>
    </Box>
  );
};

export default PlasticDetectionPanel; 