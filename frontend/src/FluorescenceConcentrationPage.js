import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper,
  TextField,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Slider,
  FormControl,
  InputLabel,
  InputAdornment,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatIcon from '@mui/icons-material/Chat';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useNavigate, Link } from 'react-router-dom';

function PollutionControlPage() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  
  // Input states
  const [leadConcentration, setLeadConcentration] = useState('');
  const [targetEfficiency, setTargetEfficiency] = useState(95);
  
  // Output states
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [plotImage, setPlotImage] = useState(null);

  // API call function
  const analyzePollutionControl = async () => {
    if (!leadConcentration || parseFloat(leadConcentration) <= 0) {
      setError('Please enter a valid lead concentration');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResults(null);
    setPlotImage(null);
    
    try {
      const response = await fetch('http://localhost:5003/api/pollution-control/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pb_initial: parseFloat(leadConcentration),
          target_efficiency: targetEfficiency / 100
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResults(data);
        setPlotImage(data.plot);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError('Failed to connect to analysis service. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // 保证body和html无留白
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
      {/* 顶部导航栏 - 采用DeveloperMode样式 */}
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
              Lead Ion Pollution Control System
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

      {/* 主要内容区域 */}
      <Box sx={{ 
        flex: 1, 
        p: 3,
        overflow: 'auto'
      }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          <Grid container spacing={3}>
            {/* Input Panel */}
            <Grid item xs={12} md={4}>
              <Card elevation={2} sx={{ 
                bgcolor: '#F8FDFD', 
                border: '1px solid #C6F2ED',
                height: 'fit-content'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ 
                    color: '#2D3748', 
                    fontWeight: 600, 
                    mb: 3,
                    textAlign: 'center'
                  }}>
                    Lead Ion Treatment Analysis
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <FormControl fullWidth>
                      <TextField
                        label="Initial Lead Ion Concentration"
                        value={leadConcentration}
                        onChange={(e) => setLeadConcentration(e.target.value)}
                        type="number"
                        InputProps={{
                          endAdornment: <InputAdornment position="end">ng/L</InputAdornment>,
                        }}
                        sx={{ mb: 2 }}
                        helperText="Enter the initial concentration of lead ions"
                      />
                    </FormControl>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography gutterBottom sx={{ color: '#2D3748', fontWeight: 500 }}>
                      Target Treatment Efficiency: {targetEfficiency}%
                    </Typography>
                    <Slider
                      value={targetEfficiency}
                      onChange={(e, newValue) => setTargetEfficiency(newValue)}
                      min={50}
                      max={99}
                      step={1}
                      marks={[
                        { value: 50, label: '50%' },
                        { value: 75, label: '75%' },
                        { value: 90, label: '90%' },
                        { value: 99, label: '99%' }
                      ]}
                      sx={{
                        color: '#6B73FF',
                        '& .MuiSlider-thumb': {
                          bgcolor: '#6B73FF',
                        },
                        '& .MuiSlider-track': {
                          bgcolor: '#6B73FF',
                        },
                        '& .MuiSlider-rail': {
                          bgcolor: '#C6F2ED',
                        }
                      }}
                    />
                  </Box>
                  
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={analyzePollutionControl}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                    sx={{
                      bgcolor: '#6B73FF',
                      color: 'white',
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: '#5A61E6',
                      },
                      '&:disabled': {
                        bgcolor: '#B8E6E1',
                      }
                    }}
                  >
                    {loading ? 'Analyzing...' : 'Start Analysis'}
                  </Button>
                  
                  {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {error}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Results Panel */}
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                {/* Treatment Summary */}
                {results && (
                  <Grid item xs={12}>
                    <Card elevation={2} sx={{ 
                      bgcolor: '#F8FDFD', 
                      border: '1px solid #C6F2ED'
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ 
                          color: '#2D3748', 
                          fontWeight: 600, 
                          mb: 2 
                        }}>
                          Treatment Prediction Results
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6} md={3}>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#E1FAFB', borderRadius: 2 }}>
                              <Typography variant="h4" sx={{ color: '#6B73FF', fontWeight: 700 }}>
                                {results.treatment_time.toFixed(1)}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#5A5A5A' }}>
                                Treatment Time (min)
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#E1FAFB', borderRadius: 2 }}>
                              <Typography variant="h4" sx={{ color: '#6B73FF', fontWeight: 700 }}>
                                {results.initial_concentration.toFixed(0)}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#5A5A5A' }}>
                                Initial Conc. (ng/L)
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#E1FAFB', borderRadius: 2 }}>
                              <Typography variant="h4" sx={{ color: '#6B73FF', fontWeight: 700 }}>
                                {results.final_concentration.toFixed(0)}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#5A5A5A' }}>
                                Final Conc. (ng/L)
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#E1FAFB', borderRadius: 2 }}>
                              <Typography variant="h4" sx={{ color: '#6B73FF', fontWeight: 700 }}>
                                {(results.target_efficiency * 100).toFixed(1)}%
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#5A5A5A' }}>
                                Target Efficiency
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                
                {/* Visualization */}
                {plotImage && (
                  <Grid item xs={12}>
                    <Card elevation={2} sx={{ 
                      bgcolor: '#F8FDFD', 
                      border: '1px solid #C6F2ED'
                    }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ 
                          color: '#2D3748', 
                          fontWeight: 600, 
                          mb: 2 
                        }}>
                          Treatment Progress Visualization
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'center',
                          p: 2,
                          bgcolor: 'white',
                          borderRadius: 2,
                          border: '1px solid #E2E8F0'
                        }}>
                          <img 
                            src={`data:image/png;base64,${plotImage}`} 
                            alt="Treatment Analysis Plot"
                            style={{ 
                              maxWidth: '100%', 
                              height: 'auto',
                              borderRadius: '8px'
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                
                {/* Loading State */}
                {loading && (
                  <Grid item xs={12}>
                    <Card elevation={2} sx={{ 
                      bgcolor: '#F8FDFD', 
                      border: '1px solid #C6F2ED'
                    }}>
                      <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <CircularProgress size={60} sx={{ color: '#6B73FF', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: '#2D3748' }}>
                          Analyzing Treatment Process...
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#5A5A5A', mt: 1 }}>
                          Running coupled differential equation model
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
                
                {/* Default State */}
                {!results && !loading && !error && (
                  <Grid item xs={12}>
                    <Card elevation={2} sx={{ 
                      bgcolor: '#F8FDFD', 
                      border: '1px solid #C6F2ED'
                    }}>
                      <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <Typography variant="h6" sx={{ color: '#2D3748', mb: 2 }}>
                          Lead Ion Treatment Prediction System
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#5A5A5A', mb: 2 }}>
                          Enter lead ion concentration and target efficiency to predict treatment time and visualize the process.
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#5A5A5A', fontStyle: 'italic' }}>
                          Based on experimental data and coupled differential equation modeling
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
}

export default PollutionControlPage; 