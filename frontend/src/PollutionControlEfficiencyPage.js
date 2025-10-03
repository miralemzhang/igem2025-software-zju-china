import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatIcon from '@mui/icons-material/Chat';
import { Link } from 'react-router-dom';
import AlgaeBacteriaModeling from './components/AlgaeBacteriaModeling';

function PollutionControlEfficiencyPage() {
  const [chatOpen, setChatOpen] = useState(false);

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
              Algae-Bacteria Symbiosis
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
        overflow: 'auto',
        p: 2 
      }}>
        <AlgaeBacteriaModeling />
      </Box>
    </Box>
  );
}

export default PollutionControlEfficiencyPage; 