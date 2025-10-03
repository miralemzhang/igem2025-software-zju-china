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
  
  const [leadConcentration, setLeadConcentration] = useState('');
  const [targetEfficiency, setTargetEfficiency] = useState(95);
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [plotImage, setPlotImage] = useState(null);

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
              Lead Ion Pollution Control System
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
        p: 3,
        display: 'flex',
        alignItems: 'stretch',
        minHeight: 'calc(100vh - 120px)',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          width: '100%', 
          maxWidth: 1400, 
          mx: 'auto',
          display: 'flex',
          gap: 3,
          height: '100%'
        }}>
          <Box sx={{ 
            width: '45%',
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}>
            <Card elevation={2} sx={{ 
              bgcolor: '#F8FDFD', 
              border: '1px solid #C6F2ED',
              flex: '0 0 auto'
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
                  <TextField
                    fullWidth
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

            <Card elevation={2} sx={{ 
              bgcolor: '#F8FDFD', 
              border: '1px solid #C6F2ED',
              flex: 1,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {results ? (
                  <>
                    <Typography variant="h6" sx={{ 
                      color: '#2D3748', 
                      fontWeight: 600, 
                      mb: 2 
                    }}>
                      Treatment Prediction Results
                    </Typography>
                    
                    {results.warning_message && (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          <strong>Warning:</strong> {results.warning_message}
                        </Typography>
                      </Alert>
                    )}
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#E1FAFB', borderRadius: 2 }}>
                          <Typography variant="h4" sx={{ color: '#6B73FF', fontWeight: 700 }}>
                            {results.treatment_time.toFixed(1)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#5A5A5A' }}>
                            Treatment Time (min)
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#E1FAFB', borderRadius: 2 }}>
                          <Typography variant="h4" sx={{ color: '#6B73FF', fontWeight: 700 }}>
                            {results.protein_bound.toFixed(0)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#5A5A5A' }}>
                            Protein Bound (ng/L)
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#E1FAFB', borderRadius: 2 }}>
                          <Typography variant="h4" sx={{ 
                            color: results.actual_efficiency < (results.target_efficiency - 0.05) ? '#ff6b6b' : '#6B73FF', 
                            fontWeight: 700 
                          }}>
                            {(results.actual_efficiency * 100).toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#5A5A5A' }}>
                            Actual Efficiency
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#E1FAFB', borderRadius: 2 }}>
                          <Typography variant="h4" sx={{ color: '#6B73FF', fontWeight: 700 }}>
                            {results.actual_final_concentration.toFixed(0)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#5A5A5A' }}>
                            Final Conc. (ng/L)
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </>
                ) : loading ? (
                  <Box sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    alignItems: 'center' 
                  }}>
                    <CircularProgress size={60} sx={{ color: '#6B73FF', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#2D3748' }}>
                      Analyzing Treatment Process...
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#5A5A5A', mt: 1 }}>
                      Running exponential decay model
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    alignItems: 'center' 
                  }}>
                    <Typography variant="h6" sx={{ color: '#2D3748', mb: 2 }}>
                      Lead Ion Treatment Prediction
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#5A5A5A', mb: 2, textAlign: 'center' }}>
                      Enter lead ion concentration and target efficiency to predict treatment time and visualize the process.
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#5A5A5A', fontStyle: 'italic', textAlign: 'center' }}>
                      Based on experimental data and exponential decay modeling
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ 
            width: '55%',
            display: 'flex'
          }}>
            <Card elevation={2} sx={{ 
              bgcolor: '#F8FDFD', 
              border: '1px solid #C6F2ED',
              width: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ 
                  color: '#2D3748', 
                  fontWeight: 600, 
                  mb: 2 
                }}>
                  Lead Ion Concentration vs Time
                </Typography>
                
                <Box sx={{ 
                  flex: 1,
                  display: 'flex', 
                  justifyContent: 'center',
                  alignItems: 'center',
                  p: 2,
                  bgcolor: 'white',
                  borderRadius: 2,
                  border: '1px solid #E2E8F0',
                  minHeight: 400
                }}>
                  {plotImage ? (
                    <img 
                      src={`data:image/png;base64,${plotImage}`} 
                      alt="Treatment Analysis Plot"
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        borderRadius: '8px'
                      }}
                    />
                  ) : (
                    <Box sx={{ 
                      textAlign: 'center',
                      color: '#5A5A5A'
                    }}>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        Visualization Area
                      </Typography>
                      <Typography variant="body2">
                        Treatment progress chart will appear here after analysis
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default PollutionControlPage; 