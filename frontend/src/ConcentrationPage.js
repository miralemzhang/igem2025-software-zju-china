import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  IconButton,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  LinearProgress,
  Drawer
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate, Link } from 'react-router-dom';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import MenuBookIcon from '@mui/icons-material/MenuBook';

function ConcentrationPage() {

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [waitingText, setWaitingText] = useState('Waiting for your data');
  const [dotIndex, setDotIndex] = useState(0);
  const navigate = useNavigate();

  const [sensorDialogOpen, setSensorDialogOpen] = useState(false);
  const [A_total, setA_total] = useState('');
  const [Dop_total, setDop_total] = useState('');
  const [pollutantConcentrations, setPollutantConcentrations] = useState('');
  const [kf1, setKf1] = useState('');
  const [kr1, setKr1] = useState('');
  const [kf2, setKf2] = useState('');
  const [kr2, setKr2] = useState('');
  const [T, setT] = useState('');
  const [sensorSubmitting, setSensorSubmitting] = useState(false);
  const [sensorError, setSensorError] = useState('');
  const [sensorConfigured, setSensorConfigured] = useState(false);

  const [referenceOpen, setReferenceOpen] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'agent', text: 'Hi, welcome to use our latest model Lumaris 4-Octo! You can call me Luma, what can I do for you?' },
    { role: 'agent', text: 'Available for English Now / 現已支援粵語 / 现在支持中文' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const [strandType, setStrandType] = useState('');
  const [strandValue, setStrandValue] = useState('');
  const [strandBtnActive, setStrandBtnActive] = useState(false);
  const [strandLocked, setStrandLocked] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');

  useEffect(() => {
    if (chatOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen]);

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

  const handleStrandBtnClick = () => {
    if (!strandType || !strandValue || strandLocked) {
      return;
    }
    setStrandBtnActive(true);
    setStrandLocked(true);
  };

  const checkBackendServices = async () => {
    const services = [
      { name: 'Sensor Layer API', url: 'http://localhost:5002/api/sensor-layer' },
      { name: 'Strand API', url: 'http://localhost:5003/strand_replace_result' }
    ];
    
    for (const service of services) {
      try {
        const response = await fetch(service.url, { method: 'OPTIONS' });
        console.log(`${service.name}: connection successful`);
      } catch (err) {
        console.error(`${service.name}: connection failed`);
        return { success: false, service: service.name };
      }
    }
    return { success: true };
  };

  const handleStartAnalyze = async () => {
    if (!strandLocked || analyzing || !sensorConfigured) return;
    
    console.log('Starting analysis, sending data to backend...');
    setAnalyzing(true);
    setAnalysisStatus('checking backend services...');
    
    const serviceCheck = await checkBackendServices();
    if (!serviceCheck.success) {
      setAnalysisStatus(`backend service not running: ${serviceCheck.service || 'unknown service'}`);
      setAnalyzing(false);
      return;
    }
    
    try {
      const sensorData = {
        A_total: parseFloat(A_total),
        Dop_total: parseFloat(Dop_total),
        pollutant_concentrations: pollutantConcentrations.split(',').map(s => parseFloat(s.trim())),
        kf1: parseFloat(kf1),
        kr1: parseFloat(kr1),
        kf2: parseFloat(kf2),
        kr2: parseFloat(kr2),
        T: parseFloat(T)
      };
      
      console.log('Sending sensor layer data:', sensorData);
      setAnalysisStatus('Sending request to backend...');
      
      const [strandResponse, sensorResponse] = await Promise.all([
        fetch('http://localhost:5003/strand_replace_result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: strandType, value: strandValue }),
          timeout: 30000 
        }),
        fetch('http://localhost:5002/api/sensor-layer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sensorData),
          timeout: 30000 
        })
      ]);

      console.log('Sensor response status:', sensorResponse.status);
      console.log('Strand response status:', strandResponse.status);
      setAnalysisStatus('Processing response data...');

      if (sensorResponse.ok) {
        const data = await sensorResponse.json();
        console.log('Sensor API response data:', data);
        
        if (data.status === 'success' && data.filename) {
          const url = `http://localhost:5002/api/sensor-layer-image/${data.filename}`;
          console.log('image URL:', url);
          setImageUrl(url);
          setAnalysisStatus('Image generated successfully!');
        } else {
          console.error('Sensor API response format error:', data);
          setAnalysisStatus('API response format error');
        }
      } else {
        const errorText = await sensorResponse.text();
        console.error('Sensor API request failed:', sensorResponse.status, errorText);
        setAnalysisStatus(`API request failed: ${sensorResponse.status}`);
      }

      if (strandResponse.ok) {
        const strandData = await strandResponse.json();
        console.log('Strand API response data:', strandData);
      } else {
        const strandErrorText = await strandResponse.text();
        console.error('Strand API request failed:', strandResponse.status, strandErrorText);
      }
      
    } catch (err) {
      console.error('Network request failed:', err);
      setAnalysisStatus('Network request failed: ' + err.message);
    }
    
    setAnalyzing(false);
    console.log('Analysis completed !');
  };

  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.width = '100vw';
    document.body.style.height = '100vh';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.documentElement.style.width = '100vw';
    document.documentElement.style.height = '100vh';
    
  }, []);

  useEffect(() => {
    if (imageUrl) return;
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % 3;
      setDotIndex(idx);
    }, 400);
    return () => clearInterval(interval);
  }, [imageUrl]);


  const handleSensorOpen = () => {
    setSensorDialogOpen(true);
    if (!sensorConfigured) {
      setA_total('');
      setDop_total('');
      setPollutantConcentrations('');
      setKf1('');
      setKr1('');
      setKf2('');
      setKr2('');
      setT('');
    }
    setSensorError('');
  };
  
  const handleSensorClose = () => {
    setSensorDialogOpen(false);
    setSensorError('');
  };
  
  const handleSensorSubmit = async () => {
    if (!A_total || !Dop_total || !pollutantConcentrations || !kf1 || !kr1 || !kf2 || !kr2 || !T) {
      setSensorError('Please fill in all fields');
      return;
    }
    setSensorSubmitting(true);
    setSensorError('');
    
    setSensorConfigured(true);
    setSensorDialogOpen(false);
    setSensorSubmitting(false);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
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
              Strand Replacement Reaction
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
              to="/developer-mode" 
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
              Developer Mode
            </Button>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Paper
          elevation={0}
          sx={{
            width: 420,
            bgcolor: '#F8FDFD',
            borderRight: '1px solid #C6F2ED',
            p: 3,
            overflowY: 'auto',
          }}
        >
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#2D3748' }}>
            Analysis Configuration
          </Typography>

          <Card sx={{ mb: 3, bgcolor: '#F0F8FF', border: '1px solid #C6F2ED' }}>
            <CardHeader
              avatar={<DataUsageIcon sx={{ color: '#10B981' }} />}
              title={
                <Typography sx={{ color: '#2D3748', fontWeight: 600 }}>
                  Model Status
                </Typography>
              }
              subheader={
                <Typography sx={{ color: '#5A5A5A', fontSize: '0.875rem' }}>
                  Pre-trained model configuration
                </Typography>
              }
              sx={{ pb: 1 }}
            />
            <CardContent sx={{ pt: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <TextField
                  value="./pre_trained_model/integrated_ckpt_001.ckpt"
                  InputProps={{
                    readOnly: true,
                    style: { fontSize: '0.875rem', color: '#2D3748' }
                  }}
                  fullWidth
                  size="small"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#C6F2ED' },
                      '&:hover fieldset': { borderColor: '#B8E6E1' },
                      '&.Mui-focused fieldset': { borderColor: '#6B73FF' },
                      bgcolor: '#E0F2FE',
                    },
                  }}
                />
                <CheckCircleIcon sx={{ color: '#10B981', fontSize: 24 }} />
              </Box>
              <Chip 
                label="Ready" 
                size="small" 
                sx={{ bgcolor: '#DCFCE7', color: '#16A34A' }}
              />
            </CardContent>
          </Card>

          <Card sx={{ mb: 3, bgcolor: '#F0F8FF', border: '1px solid #C6F2ED' }}>
            <CardHeader
              avatar={<SettingsIcon sx={{ color: '#6B73FF' }} />}
              title={
                <Typography sx={{ color: '#2D3748', fontWeight: 600 }}>
                  Sensor Layer
                </Typography>
              }
              subheader={
                <Typography sx={{ color: '#5A5A5A', fontSize: '0.875rem' }}>
                  Configure sensor parameters
                </Typography>
              }
            />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSensorOpen}
                  sx={{
                    bgcolor: '#6B73FF',
                    py: 1.5,
                    '&:hover': { bgcolor: '#5A61E6' },
                  }}
                >
                  {sensorConfigured ? 'Reconfigure Parameters' : 'Configure Parameters'}
                </Button>
                {sensorConfigured && <CheckCircleIcon sx={{ color: '#10B981', fontSize: 24 }} />}
              </Box>
              {sensorConfigured && (
                <Chip 
                  label="Configured" 
                  size="small" 
                  sx={{ bgcolor: '#DCFCE7', color: '#16A34A' }}
                />
              )}
            </CardContent>
          </Card>

          <Card sx={{ mb: 3, bgcolor: '#F0F8FF', border: '1px solid #C6F2ED' }}>
            <CardHeader
              avatar={<PlayArrowIcon sx={{ color: '#CEB1E1' }} />}
              title={
                <Typography sx={{ color: '#2D3748', fontWeight: 600 }}>
                  Analysis Setup
                </Typography>
              }
              subheader={
                <Typography sx={{ color: '#5A5A5A', fontSize: '0.875rem' }}>
                  Configure analysis parameters
                </Typography>
              }
            />
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  select
                  label="Type"
                  value={strandType}
                  onChange={e => setStrandType(e.target.value)}
                  SelectProps={{ native: true }}
                  size="small"
                  disabled={strandLocked}
                  fullWidth
                  sx={{
                    '& .MuiInputLabel-root': { color: '#5A5A5A' },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#C6F2ED' },
                      '&:hover fieldset': { borderColor: '#B8E6E1' },
                      '&.Mui-focused fieldset': { borderColor: '#6B73FF' },
                      bgcolor: '#E0F2FE',
                      color: '#2D3748',
                    },
                  }}
                >
                  <option value=""></option>
                  <option value="type1">Type 1</option>
                  <option value="type2">Type 2</option>
                  <option value="type3">Type 3</option>
                </TextField>
                <TextField
                  label="Value"
                  value={strandValue}
                  onChange={e => setStrandValue(e.target.value)}
                  size="small"
                  disabled={strandLocked}
                  fullWidth
                  sx={{
                    '& .MuiInputLabel-root': { color: '#5A5A5A' },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#C6F2ED' },
                      '&:hover fieldset': { borderColor: '#B8E6E1' },
                      '&.Mui-focused fieldset': { borderColor: '#6B73FF' },
                      bgcolor: '#E0F2FE',
                      color: '#2D3748',
                    },
                  }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Button
                  variant="outlined"
                  onClick={handleStrandBtnClick}
                  disabled={!strandType || !strandValue || strandLocked}
                  sx={{ 
                    flex: 1,
                    borderColor: '#B8E6E1',
                    color: '#2D3748',
                    '&:hover': {
                      borderColor: '#C6F2ED',
                      bgcolor: 'rgba(198, 242, 237, 0.1)',
                    },
                  }}
                >
                  Lock Configuration
                </Button>
                {strandBtnActive && <CheckCircleIcon sx={{ color: '#10B981' }} />}
              </Box>

              <Button
                variant="contained"
                fullWidth
                disabled={!strandLocked || analyzing || !sensorConfigured}
                onClick={() => {
                  console.log('Start Analysis按钮被点击');
                  console.log('strandLocked:', strandLocked);
                  console.log('analyzing:', analyzing);
                  console.log('sensorConfigured:', sensorConfigured);
                  handleStartAnalyze();
                }}
                sx={{
                  bgcolor: (strandLocked && !analyzing && sensorConfigured) ? '#10B981' : '#D1D5DB',
                  py: 1.5,
                  '&:hover': {
                    bgcolor: (strandLocked && !analyzing && sensorConfigured) ? '#059669' : '#D1D5DB',
                  },
                }}
              >
                {analyzing ? 'Analyzing...' : 'Start Analysis'}
              </Button>
              
              {analyzing && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress sx={{ 
                    bgcolor: '#E0F2FE',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#10B981'
                    }
                  }} />
                  <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center', color: '#5A5A5A' }}>
                    {analysisStatus || 'Processing data...'}
                  </Typography>
                </Box>
              )}

              {analysisStatus && !analyzing && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: analysisStatus.includes('成功') ? '#10B981' : '#EF4444' }}>
                    {analysisStatus}
                  </Typography>
                  {analysisStatus.includes('后端服务未运行') && (
                    <Box sx={{ mt: 1, p: 2, bgcolor: '#E0F2FE', borderRadius: 1, border: '1px solid #C6F2ED' }}>
                      <Typography variant="caption" sx={{ color: '#5A5A5A', display: 'block', mb: 1 }}>
                        请启动后端服务：
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#F59E0B', display: 'block', fontFamily: 'monospace' }}>
                        1. Sensor Layer API: python app.py (端口5002)
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#F59E0B', display: 'block', fontFamily: 'monospace' }}>
                        2. Strand API: python strand_app.py (端口5003)
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setAnalysisStatus('');
                          handleStartAnalyze();
                        }}
                        sx={{ 
                          mt: 1, 
                          borderColor: '#B8E6E1', 
                          color: '#2D3748',
                          fontSize: '0.75rem',
                          '&:hover': {
                            borderColor: '#C6F2ED',
                            bgcolor: 'rgba(198, 242, 237, 0.1)',
                          },
                        }}
                      >
                        重试连接
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
              
              {(!sensorConfigured || !strandLocked) && (
                <Typography variant="caption" sx={{ mt: 2, display: 'block', textAlign: 'center', color: '#5A5A5A' }}>
                  {!sensorConfigured && !strandLocked 
                    ? 'Configure sensor parameters and lock analysis settings to start'
                    : !sensorConfigured 
                    ? 'Configure sensor parameters to start analysis'
                    : 'Lock analysis configuration to start'
                  }
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mb: 3, bgcolor: '#F0F8FF', border: '1px solid #C6F2ED' }}>
            <CardHeader
              avatar={<MenuBookIcon sx={{ color: '#F59E0B' }} />}
              title={
                <Typography sx={{ color: '#2D3748', fontWeight: 600 }}>
                  Documentation
                </Typography>
              }
              subheader={
                <Typography sx={{ color: '#5A5A5A', fontSize: '0.875rem' }}>
                  Modeling algorithm reference
                </Typography>
              }
              sx={{ pb: 1 }}
            />
            <CardContent sx={{ pt: 0 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<OpenInNewIcon />}
                onClick={() => setReferenceOpen(true)}
                sx={{
                  borderColor: '#F59E0B',
                  color: '#F59E0B',
                  py: 1.5,
                  '&:hover': {
                    borderColor: '#D97706',
                    bgcolor: 'rgba(245, 158, 11, 0.1)',
                  },
                }}
              >
                View Reference PDF
              </Button>
            </CardContent>
          </Card>
        </Paper>

        <Box sx={{ flex: 1, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#2D3748' }}>
            Visualization Results
          </Typography>
          
          <Paper
            elevation={2}
            sx={{
              height: 'calc(100vh - 180px)',
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid #C6F2ED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#F8FDFD',
            }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Concentration Image"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain', 
                  display: 'block' 
                }}
              />
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9CA3AF',
                  textAlign: 'center',
                }}
              >
                <DataUsageIcon sx={{ fontSize: 80, color: '#D1D5DB', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 500, color: '#5A5A5A' }}>
                  Waiting for Data
                </Typography>
                <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                  Configure parameters and start analysis to view results
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 0.5 }}>
                  {[0,1,2].map(i => (
                    <Box
                      key={i}
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: dotIndex === i ? '#6B73FF' : '#D1D5DB',
                        transition: 'all 0.3s ease',
                        transform: dotIndex === i ? 'scale(1.2)' : 'scale(1)',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      <Dialog open={sensorDialogOpen} onClose={handleSensorClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#C6F2ED', color: '#2D3748' }}>
          Sensor Layer Parameter Input
        </DialogTitle>
        <DialogContent sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2, 
          mt: 1, 
          minHeight: 200,
          bgcolor: '#F8FDFD'
        }}>
          {sensorSubmitting ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
              <CircularProgress sx={{ color: '#6B73FF' }} />
              <Typography sx={{ mt: 2, color: '#2D3748' }}>Backend API is responding, please wait...</Typography>
            </Box>
          ) : (
            <>
              <TextField
                label="A_total (aTF protein total concentration)"
                placeholder="e.g., 12.5"
                value={A_total}
                onChange={e => setA_total(e.target.value)}
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiInputLabel-root': { color: '#5A5A5A' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#C6F2ED' },
                    '&:hover fieldset': { borderColor: '#B8E6E1' },
                    '&.Mui-focused fieldset': { borderColor: '#6B73FF' },
                    bgcolor: '#E0F2FE',
                    color: '#2D3748',
                  },
                }}
              />
              <TextField
                label="Dop_total (DNA template total concentration)"
                placeholder="e.g., 1.0"
                value={Dop_total}
                onChange={e => setDop_total(e.target.value)}
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiInputLabel-root': { color: '#5A5A5A' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#C6F2ED' },
                    '&:hover fieldset': { borderColor: '#B8E6E1' },
                    '&.Mui-focused fieldset': { borderColor: '#6B73FF' },
                    bgcolor: '#E0F2FE',
                    color: '#2D3748',
                  },
                }}
              />
              <TextField
                label="pollutant_concentrations (pollutant concentration array)"
                placeholder="e.g., 0, 10, 50, 100, 500"
                value={pollutantConcentrations}
                onChange={e => setPollutantConcentrations(e.target.value)}
                fullWidth
                variant="outlined"
                helperText="Separate multiple concentrations with commas"
                sx={{
                  '& .MuiInputLabel-root': { color: '#5A5A5A' },
                  '& .MuiFormHelperText-root': { color: '#9CA3AF' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#C6F2ED' },
                    '&:hover fieldset': { borderColor: '#B8E6E1' },
                    '&.Mui-focused fieldset': { borderColor: '#6B73FF' },
                    bgcolor: '#E0F2FE',
                    color: '#2D3748',
                  },
                }}
              />
              <TextField
                label="kf1 (pollutant and aTF binding rate constant)"
                placeholder="e.g., 0.1"
                value={kf1}
                onChange={e => setKf1(e.target.value)}
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiInputLabel-root': { color: '#5A5A5A' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#C6F2ED' },
                    '&:hover fieldset': { borderColor: '#B8E6E1' },
                    '&.Mui-focused fieldset': { borderColor: '#6B73FF' },
                    bgcolor: '#E0F2FE',
                    color: '#2D3748',
                  },
                }}
              />
              <TextField
                label="kr1 (pollutant and aTF dissociation rate constant)"
                placeholder="e.g., 0.01"
                value={kr1}
                onChange={e => setKr1(e.target.value)}
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiInputLabel-root': { color: '#5A5A5A' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#C6F2ED' },
                    '&:hover fieldset': { borderColor: '#B8E6E1' },
                    '&.Mui-focused fieldset': { borderColor: '#6B73FF' },
                    bgcolor: '#E0F2FE',
                    color: '#2D3748',
                  },
                }}
              />
              <TextField
                label="kf2 (aTF and DNA binding rate constant)"
                placeholder="e.g., 0.5"
                value={kf2}
                onChange={e => setKf2(e.target.value)}
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiInputLabel-root': { color: '#5A5A5A' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#C6F2ED' },
                    '&:hover fieldset': { borderColor: '#B8E6E1' },
                    '&.Mui-focused fieldset': { borderColor: '#6B73FF' },
                    bgcolor: '#E0F2FE',
                    color: '#2D3748',
                  },
                }}
              />
              <TextField
                label="kr2 (aTF and DNA dissociation rate constant)"
                placeholder="e.g., 0.05"
                value={kr2}
                onChange={e => setKr2(e.target.value)}
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiInputLabel-root': { color: '#5A5A5A' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#C6F2ED' },
                    '&:hover fieldset': { borderColor: '#B8E6E1' },
                    '&.Mui-focused fieldset': { borderColor: '#6B73FF' },
                    bgcolor: '#E0F2FE',
                    color: '#2D3748',
                  },
                }}
              />
              <TextField
                label="T (effective detection time)"
                placeholder="e.g., 100"
                value={T}
                onChange={e => setT(e.target.value)}
                fullWidth
                variant="outlined"
                sx={{
                  '& .MuiInputLabel-root': { color: '#5A5A5A' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#C6F2ED' },
                    '&:hover fieldset': { borderColor: '#B8E6E1' },
                    '&.Mui-focused fieldset': { borderColor: '#6B73FF' },
                    bgcolor: '#E0F2FE',
                    color: '#2D3748',
                  },
                }}
              />
              {sensorError && <span style={{ color: '#EF4444', fontSize: 14 }}>{sensorError}</span>}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#C6F2ED' }}>
          <Button 
            onClick={handleSensorClose} 
            disabled={sensorSubmitting}
            sx={{ color: '#5A5A5A' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSensorSubmit} 
            variant="contained" 
            disabled={sensorSubmitting}
            sx={{ bgcolor: '#6B73FF', '&:hover': { bgcolor: '#5A61E6' } }}
          >
            {sensorSubmitting ? 'Submitting...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={referenceOpen} onClose={() => setReferenceOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#C6F2ED', color: '#2D3748' }}>
          Modeling Algorithm Reference
        </DialogTitle>
        <DialogContent sx={{ height: '70vh', p: 0, bgcolor: '#F8FDFD' }}>
          <iframe
            src="/reference.pdf"
            title="Reference PDF"
            width="100%"
            height="100%"
            style={{ border: 'none', minHeight: '50vh' }}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#C6F2ED' }}>
          <Button 
            onClick={() => setReferenceOpen(false)}
            sx={{ color: '#5A5A5A' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

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

export default ConcentrationPage;
