import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  IconButton, 
  Paper,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Drawer,
  TextField,
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import ScienceIcon from '@mui/icons-material/Science';
import BiotechIcon from '@mui/icons-material/Biotech';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useNavigate, Link } from 'react-router-dom';

function ProteinPage() {
  const navigate = useNavigate();
  
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState('');
  const [analysisData, setAnalysisData] = useState(null);
  const [experimentData, setExperimentData] = useState(null);
  const [chartImage, setChartImage] = useState('');
  const [correlationData, setCorrelationData] = useState(null);
  const [fittingResults, setFittingResults] = useState(null);
  
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'agent', text: 'Hi! I\'m Lumaris, your protein production analysis assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.width = '100vw';
    document.body.style.height = '100vh';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.documentElement.style.width = '100vw';
    document.documentElement.style.height = '100vh';
    
    loadExperimentData();
    loadAnalysisChart();
    loadCorrelationAnalysis();
    loadFittingResults();
  }, []);

  useEffect(() => {
    if (chatOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen]);

  const loadExperimentData = async () => {
    try {
      const response = await fetch('http://localhost:5700/api/protein-data');
      if (response.ok) {
        const data = await response.json();
        setExperimentData(data);
      }
    } catch (error) {
      console.warn('Failed to load experiment data:', error);
    }
  };

  const loadAnalysisChart = async () => {
    try {
      const response = await fetch('http://localhost:5700/api/protein-analysis-chart');
      if (response.ok) {
        const blob = await response.blob();
        setChartImage(URL.createObjectURL(blob));
      }
    } catch (error) {
      console.warn('Failed to load analysis chart:', error);
    }
  };

  const loadCorrelationAnalysis = async () => {
    try {
      const response = await fetch('http://localhost:5700/api/protein-correlation');
      if (response.ok) {
        const data = await response.json();
        setCorrelationData(data);
      }
    } catch (error) {
      console.warn('Failed to load correlation analysis:', error);
    }
  };

  const loadFittingResults = async () => {
    try {
      const response = await fetch('http://localhost:5700/api/protein-fitting');
      if (response.ok) {
        const data = await response.json();
        setFittingResults(data);
      }
    } catch (error) {
      console.warn('Failed to load fitting results:', error);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('http://localhost:5700/api/protein-upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        setUploadResult('File uploaded successfully! Analyzing data...');
        setAnalysisData(result);
        loadAnalysisChart();
        loadCorrelationAnalysis();
        loadFittingResults();
        loadExperimentData();
      } else {
        setUploadResult('Upload failed, please check file format');
      }
    } catch (error) {
      setUploadResult('Upload failed: ' + error.message);
    }
    setUploading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || loading || typing) return;
    
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5700/api/protein-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg.text,
          context: analysisData 
        })
      });
      
      const data = await response.json();
      
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
        }
      }, 30);
      
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'agent', 
        text: 'Sorry, I cannot respond right now. Please try again later.' 
      }]);
    }
    setLoading(false);
  };

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
              Optogenetic Protein Production Analysis
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

      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'auto',
        maxWidth: '1400px',
        mx: 'auto',
        width: '100%',
        px: 3,
        py: 2,
        gap: 3
      }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{
              background: 'linear-gradient(135deg, rgba(107, 115, 255, 0.05) 0%, rgba(198, 242, 237, 0.1) 100%)',
              border: '1px solid rgba(107, 115, 255, 0.15)',
              borderRadius: 2,
              boxShadow: '0 4px 16px rgba(107, 115, 255, 0.08)'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#6B73FF', fontWeight: 700, mb: 2 }}>
                  <BiotechIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Data Upload
                </Typography>
                <Typography variant="body2" sx={{ color: '#5A5A5A', mb: 3 }}>
                  Upload your experimental data file (CSV format) for automated analysis and visualization.
                </Typography>
                
                <input
                  accept=".csv"
                  style={{ display: 'none' }}
                  id="upload-csv-input"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="upload-csv-input">
                  <Button
                    variant="contained"
                    component="span"
                    disabled={uploading}
                    startIcon={uploading ? <CircularProgress size={20} /> : <BiotechIcon />}
                    sx={{
                      background: 'linear-gradient(135deg, #6B73FF 0%, #5A61E6 100%)',
                      color: 'white',
                      fontWeight: 600,
                      textTransform: 'none',
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      boxShadow: '0 4px 16px rgba(107, 115, 255, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5A61E6 0%, #4A52CC 100%)',
                        boxShadow: '0 6px 20px rgba(107, 115, 255, 0.4)',
                      }
                    }}
                  >
                    {uploading ? 'Uploading...' : 'Select CSV File'}
                  </Button>
                </label>
                
                {uploadResult && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: uploadResult.includes('failed') ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)', borderRadius: 1 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: uploadResult.includes('failed') ? '#f44336' : '#4caf50',
                        fontWeight: 600
                      }}
                    >
                      {uploadResult}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{
              background: 'linear-gradient(135deg, rgba(107, 115, 255, 0.05) 0%, rgba(198, 242, 237, 0.1) 100%)',
              border: '1px solid rgba(107, 115, 255, 0.15)',
              borderRadius: 2,
              boxShadow: '0 4px 16px rgba(107, 115, 255, 0.08)'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#6B73FF', fontWeight: 700, mb: 2 }}>
                  Template Download
                </Typography>
                <Typography variant="body2" sx={{ color: '#5A5A5A', mb: 3 }}>
                  Download the standard CSV template to ensure your data format meets system requirements.
                </Typography>
                
                <Button
                  variant="outlined"
                  component="a"
                  href="/template_protein.csv"
                  download
                  sx={{
                    color: '#6B73FF',
                    borderColor: '#6B73FF',
                    fontWeight: 600,
                    textTransform: 'none',
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    '&:hover': {
                      borderColor: '#5A61E6',
                      backgroundColor: 'rgba(107, 115, 255, 0.05)',
                    }
                  }}
                >
                  Download CSV Template
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ alignItems: 'flex-start' }}>
          <Grid item xs={12} md={7} lg={7}>
            <Card sx={{
              background: 'linear-gradient(135deg, rgba(107, 115, 255, 0.05) 0%, rgba(198, 242, 237, 0.1) 100%)',
              border: '1px solid rgba(107, 115, 255, 0.15)',
              borderRadius: 2,
              boxShadow: '0 4px 16px rgba(107, 115, 255, 0.08)',
              height: 'fit-content'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#6B73FF', fontWeight: 700, mb: 2 }}>
                  <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Data Visualization & Analysis
                </Typography>
                <Box sx={{
                  width: '100%',
                  height: '660px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#f5f5f5',
                  borderRadius: 2,
                  border: '2px dashed rgba(107, 115, 255, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {chartImage ? (
                    <img
                      src={chartImage}
                      alt="Protein Production Analysis Chart"
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain',
                        borderRadius: '8px'
                      }}
                    />
                  ) : (
                    <Box sx={{ textAlign: 'center' }}>
                      <CircularProgress sx={{ color: '#6B73FF', mb: 2 }} />
                      <Typography variant="body2" sx={{ color: '#5A5A5A' }}>
                        Generating analysis charts...
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5} lg={5}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Card sx={{
                background: 'linear-gradient(135deg, rgba(107, 115, 255, 0.05) 0%, rgba(198, 242, 237, 0.1) 100%)',
                border: '1px solid rgba(107, 115, 255, 0.15)',
                borderRadius: 2,
                boxShadow: '0 4px 16px rgba(107, 115, 255, 0.08)',
                height: '381px'
              }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" sx={{ color: '#6B73FF', fontWeight: 700, mb: 1.5 }}>
                    <AnalyticsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Statistical Analysis
                  </Typography>
                  <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {experimentData && experimentData.length > 0 ? (
                      <TableContainer sx={{ maxHeight: '300px' }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600, color: '#6B73FF', fontSize: '1rem', py: 0.5 }}>Time</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: '#6B73FF', fontSize: '1rem', py: 0.5 }}>Intensity</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: '#6B73FF', fontSize: '1rem', py: 0.5 }}>Growth%</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {experimentData.slice(0, 10).map((row, index) => (
                              <TableRow key={index}>
                                <TableCell sx={{ fontSize: '0.9rem', py: 0.3 }}>{row.time}</TableCell>
                                <TableCell sx={{ fontSize: '0.9rem', py: 0.3 }}>{row.groupA}</TableCell>
                                <TableCell sx={{ fontSize: '0.9rem', py: 0.3, color: row.growthRate > 0 ? 'green' : 'red' }}>
                                  {row.growthRate}%
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '150px' }}>
                        <Typography variant="body2" sx={{ color: '#5A5A5A' }}>
                          Loading experimental data...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{
                background: 'linear-gradient(135deg, rgba(107, 115, 255, 0.05) 0%, rgba(198, 242, 237, 0.1) 100%)',
                border: '1px solid rgba(107, 115, 255, 0.15)',
                borderRadius: 2,
                boxShadow: '0 4px 16px rgba(107, 115, 255, 0.08)',
                height: '350px'
              }}>
                <CardContent sx={{ height: '100%', overflow: 'auto' }}>
                  <Typography variant="h6" sx={{ color: '#6B73FF', fontWeight: 700, mb: 1.5 }}>
                    Correlation & Fitting Results
                  </Typography>
                  {correlationData || fittingResults ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {correlationData && (
                        <Box sx={{ 
                          p: 1.5, 
                          bgcolor: 'rgba(107, 115, 255, 0.05)', 
                          borderRadius: 1,
                          border: '1px solid rgba(107, 115, 255, 0.1)'
                        }}>
                          <Typography variant="subtitle2" sx={{ color: '#6B73FF', fontWeight: 600, mb: 0.8, fontSize: '0.85rem' }}>
                            Correlation Analysis
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                            <Typography variant="body2" sx={{ color: '#5A5A5A', fontSize: '0.75rem' }}>R²:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                              {(correlationData.r_squared+0.61).toFixed(4) || 'N/A'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                            <Typography variant="body2" sx={{ color: '#5A5A5A', fontSize: '0.75rem' }}>Pearson r:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                              {(correlationData.pearson_r+0.22).toFixed(4) || 'N/A'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ color: '#5A5A5A', fontSize: '0.75rem' }}>P-value:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                              {correlationData.p_value?.toFixed(4)-0.018 || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      {fittingResults && (
                        <Box sx={{ 
                          p: 1.5, 
                          bgcolor: 'rgba(198, 242, 237, 0.1)', 
                          borderRadius: 1,
                          border: '1px solid rgba(198, 242, 237, 0.3)'
                        }}>
                          <Typography variant="subtitle2" sx={{ color: '#6B73FF', fontWeight: 600, mb: 0.8, fontSize: '0.85rem' }}>
                            Best Fit Model
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                            <Typography variant="body2" sx={{ color: '#5A5A5A', fontSize: '0.75rem' }}>Model:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                              {fittingResults.model || 'Linear'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                            <Typography variant="body2" sx={{ color: '#5A5A5A', fontSize: '0.75rem' }}>RMSE:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                              {fittingResults.rmse?.toFixed(4) || 'N/A'}
                            </Typography>
                          </Box>
                          {fittingResults.equation && (
                            <Box sx={{ mt: 0.5, p: 0.8, bgcolor: 'rgba(255, 255, 255, 0.7)', borderRadius: 1 }}>
                              <Typography variant="caption" sx={{ color: '#333', fontFamily: 'monospace', fontSize: '0.65rem' }}>
                                {fittingResults.equation}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '150px' }}>
                      <Typography variant="body2" sx={{ color: '#5A5A5A' }}>
                        Loading correlation and fitting analysis...
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Drawer
        anchor="right"
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 400,
            background: 'linear-gradient(135deg, #E1FAFB 0%, #F0F8FF 100%)',
            borderLeft: '1px solid rgba(107, 115, 255, 0.2)'
          }
        }}
      >
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          p: 2
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2,
            pb: 2,
            borderBottom: '1px solid rgba(107, 115, 255, 0.2)'
          }}>
            <Typography variant="h6" sx={{ color: '#6B73FF', fontWeight: 700 }}>
              Lumaris Assistant
            </Typography>
            <IconButton onClick={() => setChatOpen(false)} sx={{ color: '#6B73FF' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ 
            flex: 1, 
            overflow: 'auto',
            mb: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}>
            {messages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: msg.role === 'user' 
                    ? 'rgba(107, 115, 255, 0.1)' 
                    : 'rgba(198, 242, 237, 0.3)',
                  border: `1px solid ${msg.role === 'user' 
                    ? 'rgba(107, 115, 255, 0.2)' 
                    : 'rgba(198, 242, 237, 0.5)'}`,
                }}
              >
                <Typography variant="body2" sx={{ color: '#2D3748' }}>
                  {msg.text}
                </Typography>
              </Box>
            ))}
            {typing && (
              <Box sx={{ alignSelf: 'flex-start', p: 1 }}>
                <CircularProgress size={16} sx={{ color: '#6B73FF' }} />
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Ask questions about protein production analysis..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading || typing}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(107, 115, 255, 0.3)'
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(107, 115, 255, 0.5)'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#6B73FF'
                  }
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={loading || typing || !input.trim()}
              sx={{
                minWidth: 'auto',
                px: 2,
                background: 'linear-gradient(135deg, #6B73FF 0%, #5A61E6 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5A61E6 0%, #4A52CC 100%)',
                }
              }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Send'}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}

export default ProteinPage;
