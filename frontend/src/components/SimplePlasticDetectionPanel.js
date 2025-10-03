import React, { useState, useEffect } from 'react';
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
  Divider
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Camera as CameraIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  BarChart as ChartIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

const SimplePlasticDetectionPanel = () => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(null);
  const [currentDetections, setCurrentDetections] = useState([]);
  const [statistics, setStatistics] = useState({
    total_detections: 0,
    plastic_types: {},
    detection_confidence_avg: 0.0,
    session_start_time: null,
    current_fps: 0
  });
  const [error, setError] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);

  const checkServiceStatus = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/detection/status');
      const result = await response.json();
      setServiceStatus(result);
      return result;
    } catch (err) {
      setServiceStatus(null);
      return null;
    }
  };

  const fetchFrame = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/detection/frame');
      if (response.ok) {
        const result = await response.json();
        setCurrentFrame(result.frame);
        setCurrentDetections(result.detections || []);
        setStatistics(result.statistics || statistics);
        setError(null);
      }
    } catch (err) {
    }
  };

  const resetStatistics = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/detection/statistics/reset', {
        method: 'POST'
      });
      if (response.ok) {
        setStatistics({
          total_detections: 0,
          plastic_types: {},
          detection_confidence_avg: 0.0,
          session_start_time: null,
          current_fps: 0
        });
      }
    } catch (err) {
      console.error(err);
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
    
    const start = new Date(statistics.session_start_time * 1000);
    const now = new Date();
    const duration = Math.floor((now - start) / 1000);
    
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const startDetection = async () => {
    try {
      setError(null);
      
      const response = await fetch('http://localhost:5001/api/detection/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ camera_id: 0 })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setIsDetecting(true);
        console.log('activated');
      } else {
        setError(result.message || 'activation failed');
      }
    } catch (err) {
      setError('cannot connect to detection service, please ensure the backend service is running');
      console.error(err);
    }
  };

  const stopDetection = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/detection/stop', {
        method: 'POST'
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setIsDetecting(false);
        setCurrentFrame(null);
        console.log('deactivated');
      } else {
        setError(result.message || 'deactivation failed');
      }
    } catch (err) {
      setError('deactivation failed');
      console.error(err);
    }
  };

  useEffect(() => {
    checkServiceStatus();
    const statusInterval = setInterval(checkServiceStatus, 5000);
    return () => clearInterval(statusInterval);
  }, []);

  useEffect(() => {
    let frameInterval;
    if (isDetecting) {
      frameInterval = setInterval(fetchFrame, 200);
    }
    return () => {
      if (frameInterval) clearInterval(frameInterval);
    };
  }, [isDetecting]);

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 2,
      overflow: 'hidden',
      p: 2,
      bgcolor: '#F3F8FC'
    }}>
      <Paper sx={{
        p: 2,
        flexShrink: 0,
        background: 'linear-gradient(135deg,rgba(35, 255, 255, 0.21) 0%,rgba(129, 188, 224, 0.25) 100%)',
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: '"Poppins", "Montserrat", "Arial Black", "Arial", "sans-serif"',
                    fontWeight: 900,
                    fontSize: '1.7rem',
                    letterSpacing: '0em',
                    color: '#1A237E'
                  }}
                >
                  LUplaSEE 2.0
                </Typography>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '56px',
                  height: '30px',
                  borderRadius: 1,
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(26, 35, 126, 0.3)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <img
                    src="/yolo-logo.png"
                    alt="YOLO"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
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
              <Typography variant="caption" sx={{ 
                color: '#5A5A5A', 
                fontFamily: 'monospace',
                letterSpacing: '2px',
                fontSize: '0.65rem'
              }}>
                A Real-time Plastic-Garbage Detection System Powered by YOLOv8 and Trained by ZJU-China 2025 Dry Lab
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: serviceStatus ? '#10B981' : '#EF4444',
              boxShadow: serviceStatus ? '0 0 8px rgba(16, 185, 129, 0.6)' : '0 0 8px rgba(239, 68, 68, 0.6)'
            }} />
            <Typography variant="caption" sx={{ 
              color: serviceStatus ? '#10B981' : '#EF4444',
              fontFamily: 'monospace',
              fontWeight: 900
            }}>
              {serviceStatus ? 'ONLINE' : 'OFFLINE'}
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={isDetecting ? <StopIcon /> : <PlayIcon />}
            onClick={isDetecting ? stopDetection : startDetection}
            disabled={!serviceStatus}
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
            {isDetecting ? 'Stop Detection' : 'Start Detection'}
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
            Reset Statistics
          </Button>

          {serviceStatus && (
            <Typography variant="body2" sx={{ ml: 1.5, color: '#5A5A5A' }}>
              Total: {statistics.total_detections} | 
              FPS: {statistics.current_fps.toFixed(1)} |
              Model: {serviceStatus.model_loaded ? '✅Loaded: YOLOv8' : '❌Not Loaded'} 

            </Typography>
          )}
        </Box>
      </Paper>

      <Box sx={{ 
        flex: 1, 
        minHeight: 0,
        display: 'flex',
        gap: 2
      }}>
        <Box sx={{ 
          flex: '1 1 60%',
          minWidth: '400px',
          maxWidth: '65%'
        }}>
          <Paper sx={{
            height: '100%',
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
                Real-time Detection Video Stream
              </Typography>
              {statistics.current_fps > 0 && (
                <Chip 
                  label={`${statistics.current_fps.toFixed(1)} FPS`} 
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
              minHeight: '400px', // 固定最小高度
              maxHeight: '500px'  // 固定最大高度
            }}>
              {currentFrame ? (
                <img
                  src={`data:image/jpeg;base64,${currentFrame}`}
                  alt="Real-time Detection Video Stream"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    borderRadius: '4px'
                  }}
                />
              ) : isDetecting ? (
                <Box sx={{ textAlign: 'center', color: '#ffffff', p: 4 }}>
                  <CircularProgress sx={{ color: '#EC4899', mb: 2 }} size={60} />
                  <Typography variant="h6" sx={{ mb: 1 }}>Starting Camera...</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    Waiting for video stream data...
                  </Typography>
                </Box>
              ) : !serviceStatus ? (
                <Box sx={{ textAlign: 'center', color: '#EF4444', p: 4 }}>
                  <WarningIcon sx={{ fontSize: 64, mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>Service Not Connected</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Please start the simplified detection service: python simple_detection_service.py
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', color: '#9CA3AF', p: 4 }}>
                  <CameraIcon sx={{ fontSize: 64, mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>Ready</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Click "Start Detection" to start the camera
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>

        <Box sx={{ 
          flex: '1 1 40%',
          minWidth: '350px',
          maxWidth: '45%',
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2,
          height: '100%'
        }}>
          <Paper sx={{
            p: 2,
            height: '280px', // 固定高度
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(198, 242, 237, 0.2) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ChartIcon sx={{ color: '#10B981' }} />
              <Typography variant="h6" sx={{ color: '#059669', fontWeight: 600 }}>
                Detection Statistics
              </Typography>
            </Box>
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: '#2D3748', fontWeight: 700 }}>
                    {statistics.total_detections}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#5A5A5A' }}>
                    Total Detections
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: '#2D3748', fontWeight: 700 }}>
                    {(statistics.detection_confidence_avg * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#5A5A5A' }}>
                    Average Confidence
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="subtitle2" sx={{ color: '#059669', mb: 1 }}>
              Session Duration: {getSessionDuration()}
            </Typography>
            
            <Typography variant="subtitle2" sx={{ color: '#059669', mb: 1 }}>
              Detection Type Distribution:
            </Typography>
            <Box sx={{ 
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
            }}>
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
            </Box>
          </Paper>

          <Paper sx={{
            flex: 1,
            minHeight: '200px',
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
                Recent Detections
              </Typography>
            </Box>
            
            <Box sx={{ 
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
            }}>
              {currentDetections && currentDetections.length > 0 ? (
                currentDetections.map((detection, index) => (
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
                        Position: [{detection.bbox.map(v => v.toFixed(0)).join(', ')}]
                      </Typography>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Box sx={{ textAlign: 'center', py: 4, color: '#9CA3AF' }}>
                  <WarningIcon sx={{ fontSize: 48, mb: 1 }} />
                  <Typography variant="body2">No detection results</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default SimplePlasticDetectionPanel; 