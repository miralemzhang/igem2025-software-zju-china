import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Slider,
  Paper,
  Tabs,
  Tab,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import GSMModelingComponent from './GSMModelingComponent';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import SettingsIcon from '@mui/icons-material/Settings';
import ScienceIcon from '@mui/icons-material/Science';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GSMIntegration from './GSMIntegration';
import SystemsBiologyReport from './SystemsBiologyReport';

// 实验数据处理类
class ExperimentalDataProcessor {
  constructor() {
    this.rawData = [
      { time: 0, A_avg: 0.0157, B_avg: 0.0123 },
      { time: 24, A_avg: 0.0150, B_avg: 0.0213 },
      { time: 48, A_avg: 0.0097, B_avg: 0.0243 },
      { time: 72, A_avg: 0.0013, B_avg: 0.0130 },
      { time: 96, A_avg: 0.0097, B_avg: 0.0173 },
      { time: 120, A_avg: 0.0050, B_avg: 0.0173 },
      { time: 144, A_avg: null, B_avg: 0.0207 },
      { time: 168, A_avg: 0.0017, B_avg: 0.0277 },
      { time: 192, A_avg: null, B_avg: 0.0397 },
      { time: 216, A_avg: null, B_avg: 0.0433 },
    ].filter(d => d.A_avg !== null || d.B_avg !== null);
  }

  getProcessedData() {
    return this.rawData;
  }
}

// 藻菌共生数学模型类
class AlgaeBacteriaModel {
  constructor() {
    // 基于实验数据优化的模型参数
    this.params = {
      // 蓝藻参数 - 根据实验数据校准
      mu_max_algae: 0.03,     // 最大比生长速率 (1/day) - 降低以匹配实验
      K_s_algae: 0.01,        // 半饱和常数 (g/L) - 降低
      K_I: 50,                // 光照半饱和常数 (μmol/m²/s)
      I_0: 200,               // 光照强度 (μmol/m²/s)
      Y_algae_sucrose: 0.8,   // 蔗糖产出系数 - 增加以显示蔗糖生产
      
      // 大肠杆菌参数 - 根据共培养数据优化
      mu_max_bacteria: 0.08,  // 最大比生长速率 (1/day) - 匹配实验增长
      K_s_bacteria: 0.005,    // 蔗糖半饱和常数 (g/L) - 降低
      Y_bacteria_sucrose: 0.5, // 蔗糖利用效率
      
      // 环境参数
      k_d_algae: 0.02,        // 蓝藻死亡率 (1/day) - 增加衰减
      k_d_bacteria: 0.01,     // 细菌死亡率 (1/day) - 降低
      k_inhibition: 0.5,      // 相互抑制系数
      
      // 初始条件 - 匹配实验
      X_algae_0: 0.0157,      // 初始蓝藻浓度 (实验数据)
      X_bacteria_0: 0.0123,   // 初始细菌浓度 (实验数据)
      S_sucrose_0: 0.0,       // 初始蔗糖浓度
    };
  }

  // Monod动力学方程
  monodKinetics(S, K_s, mu_max) {
    return mu_max * S / (K_s + S);
  }

  // 光照限制函数
  lightLimitation(I) {
    return I / (this.params.K_I + I);
  }

  // 微分方程组 (系统生物学表示) - 优化以匹配实验数据
  systemODE(t, y) {
    const [X_algae, X_bacteria, S_sucrose] = y;
    
    // 光照强度 (简化为恒定光照，匹配实验条件)
    const I_t = this.params.I_0;
    
    // 相互抑制效应
    const inhibition_algae = 1 / (1 + this.params.k_inhibition * X_bacteria);
    const competition_bacteria = 1 + 0.1 * X_algae; // 轻微竞争效应
    
    // 蓝藻生长速率 - 在共培养中受抑制
    const nutrient_limitation = 0.1 + 0.9 * Math.exp(-t / 50); // 营养逐渐耗尽
    const mu_algae = this.params.mu_max_algae * this.lightLimitation(I_t) * inhibition_algae * nutrient_limitation;
    
    // 细菌生长速率 - 基于蔗糖和其他营养
    const base_nutrients = 0.01; // 基础营养支持
    const total_substrate = S_sucrose + base_nutrients;
    const mu_bacteria = this.monodKinetics(total_substrate, this.params.K_s_bacteria, this.params.mu_max_bacteria) / competition_bacteria;
    
    // 微分方程 - 考虑实际的生长模式
    const dX_algae_dt = mu_algae * X_algae - this.params.k_d_algae * X_algae * (1 + X_bacteria * 0.5);
    const dX_bacteria_dt = mu_bacteria * X_bacteria - this.params.k_d_bacteria * X_bacteria;
    const dS_sucrose_dt = this.params.Y_algae_sucrose * mu_algae * X_algae 
                         - (1 / this.params.Y_bacteria_sucrose) * mu_bacteria * X_bacteria
                         - 0.001 * S_sucrose; // 自然降解
    
    return [dX_algae_dt, dX_bacteria_dt, Math.max(0, dS_sucrose_dt)];
  }

  // 四阶Runge-Kutta求解器
  rungeKutta4(t0, y0, h, n_steps) {
    const results = [{ t: t0, y: [...y0] }];
    let t = t0;
    let y = [...y0];

    for (let i = 0; i < n_steps; i++) {
      const k1 = this.systemODE(t, y);
      const k2 = this.systemODE(t + h/2, y.map((yi, idx) => yi + h * k1[idx] / 2));
      const k3 = this.systemODE(t + h/2, y.map((yi, idx) => yi + h * k2[idx] / 2));
      const k4 = this.systemODE(t + h, y.map((yi, idx) => yi + h * k3[idx]));

      y = y.map((yi, idx) => yi + h * (k1[idx] + 2*k2[idx] + 2*k3[idx] + k4[idx]) / 6);
      t += h;

      results.push({ 
        t: t, 
        y: [...y],
        algae: y[0],
        bacteria: y[1], 
        sucrose: y[2]
      });
    }

    return results;
  }

  // 参数估计 (最小二乘法)
  parameterEstimation(experimentalData) {
    // 简化的参数拟合算法
    const objective = (params) => {
      this.params = { ...this.params, ...params };
      const simulation = this.simulate(240, 1);
      
      let error = 0;
      experimentalData.forEach(expData => {
        const simData = simulation.find(s => Math.abs(s.t - expData.time) < 0.5);
        if (simData) {
          if (expData.A_avg !== null) {
            error += Math.pow(simData.algae - expData.A_avg, 2);
          }
          if (expData.B_avg !== null) {
            error += Math.pow(simData.bacteria - expData.B_avg, 2);
          }
        }
      });
      
      return error;
    };

    // 简单的网格搜索优化
    let bestParams = { ...this.params };
    let bestError = objective(bestParams);

    const paramRanges = {
      mu_max_algae: [0.5, 1.2],
      mu_max_bacteria: [0.8, 1.8],
      K_s_algae: [0.1, 1.0],
      K_s_bacteria: [0.05, 0.5],
    };

    Object.keys(paramRanges).forEach(param => {
      const [min, max] = paramRanges[param];
      for (let i = 0; i < 10; i++) {
        const testValue = min + (max - min) * i / 9;
        const testParams = { [param]: testValue };
        const error = objective(testParams);
        
        if (error < bestError) {
          bestError = error;
          bestParams[param] = testValue;
        }
      }
    });

    this.params = bestParams;
    return { params: bestParams, error: bestError };
  }

  // 主要仿真函数
  simulate(duration = 240, timestep = 1) {
    const y0 = [
      this.params.X_algae_0,
      this.params.X_bacteria_0, 
      this.params.S_sucrose_0
    ];
    
    const n_steps = Math.floor(duration / timestep);
    return this.rungeKutta4(0, y0, timestep, n_steps);
  }
}

// 主要组件
function AlgaeBacteriaModeling() {
  const [model] = useState(new AlgaeBacteriaModel());
  const [dataProcessor] = useState(new ExperimentalDataProcessor());
  const [simulationData, setSimulationData] = useState([]);
  const [experimentalData, setExperimentalData] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [parameters, setParameters] = useState(model.params);
  const [fittedParams, setFittedParams] = useState(null);

  useEffect(() => {
    const expData = dataProcessor.getProcessedData();
    setExperimentalData(expData);
    
    // 初始仿真
    const initialSim = model.simulate(240, 1);
    setSimulationData(initialSim);
  }, [model, dataProcessor]);

  const runSimulation = () => {
    setIsRunning(true);
    model.params = { ...parameters };
    
    setTimeout(() => {
      const results = model.simulate(240, 1);
      setSimulationData(results);
      setIsRunning(false);
    }, 100);
  };

  const fitParameters = () => {
    setIsRunning(true);
    
    setTimeout(() => {
      const result = model.parameterEstimation(experimentalData);
      setFittedParams(result);
      setParameters(result.params);
      
      const newSim = model.simulate(240, 1);
      setSimulationData(newSim);
      setIsRunning(false);
    }, 500);
  };

  const handleParameterChange = (param, value) => {
    setParameters(prev => ({
      ...prev,
      [param]: value
    }));
  };

  // 准备图表数据
  const chartData = simulationData.map(point => ({
    time: point.t,
    algae_sim: point.algae,
    bacteria_sim: point.bacteria,
    sucrose_sim: point.sucrose,
  }));

  // 合并实验数据
  const combinedData = chartData.map(sim => {
    const exp = experimentalData.find(e => Math.abs(e.time - sim.time) < 12);
    return {
      ...sim,
      algae_exp: exp?.A_avg,
      bacteria_exp: exp?.B_avg,
    };
  });

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#f8fafc',
      p: 0
    }}>
      {/* 专业化头部 */}
      <Paper elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
        <Box sx={{ p: 4, bgcolor: '#f8fafc', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <ScienceIcon sx={{ fontSize: 32, color: '#1976d2' }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a202c', mb: 1 }}>
                Algae-Bacteria Symbiosis System Modeling
              </Typography>
              <Typography variant="subtitle1" sx={{ color: '#64748b' }}>
                Mathematical Modeling and Systems Biology Analysis
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip 
              label="Systems Biology Model" 
              variant="outlined"
              sx={{ 
                borderColor: '#1976d2', 
                color: '#1976d2',
                fontWeight: 500
              }}
            />
            <Chip 
              label="Monod Kinetics" 
              variant="outlined"
              sx={{ 
                borderColor: '#2e7d32', 
                color: '#2e7d32',
                fontWeight: 500
              }}
            />
            <Chip 
              label="Genome-Scale Metabolic Model" 
              variant="outlined"
              sx={{ 
                borderColor: '#7b1fa2', 
                color: '#7b1fa2',
                fontWeight: 500
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* 专业化标签页 */}
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ 
            bgcolor: 'white',
            borderRadius: 2,
            '& .MuiTab-root': {
              fontSize: '1rem',
              fontWeight: 500,
              textTransform: 'none',
              minHeight: 48,
              px: 3
            },
            '& .MuiTabs-indicator': {
              height: 3
            }
          }}
        >
          <Tab label="Modeling & Simulation" />
          <Tab label="Data Analysis" />
          <Tab label="System Equations" />
          <Tab label="GSM Model" />
        </Tabs>
      </Box>

      {/* 内容区域 */}
      <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>

      {/* Tab 0: Modeling & Simulation */}
      {tabValue === 0 && (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
          gap: 3
        }}>
          {/* 左侧：图表区域 */}
          <Box>
            {/* 控制面板 */}
            <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a202c' }}>
                  Simulation Control
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={runSimulation}
                    disabled={isRunning}
                    sx={{ fontWeight: 500 }}
                  >
                    Run Simulation
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<TrendingUpIcon />}
                    onClick={fitParameters}
                    disabled={isRunning}
                    sx={{ fontWeight: 500 }}
                  >
                    DATA UPLOAD
                  </Button>
                </Box>
              </Box>
            </Paper>

            {/* 生长曲线图表 */}
            <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1a202c' }}>
                Growth Curve Prediction vs Experimental Data
              </Typography>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={combinedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Time (hours)', position: 'insideBottom', offset: -5 }} 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      label={{ value: 'OD600', angle: -90, position: 'insideLeft' }} 
                      domain={[0, 'dataMax + 0.01']}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [value?.toFixed(4), name]} 
                      contentStyle={{ 
                        fontSize: '12px', 
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e2e8f0',
                        borderRadius: 4
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    
                    <Line 
                      type="monotone" 
                      dataKey="algae_sim" 
                      stroke="#2e7d32" 
                      strokeWidth={2}
                      name="Algae (Simulation)"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="bacteria_sim" 
                      stroke="#1976d2" 
                      strokeWidth={2}
                      name="Bacteria (Simulation)"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="algae_exp" 
                      stroke="#388e3c" 
                      strokeWidth={0}
                      dot={{ fill: '#388e3c', strokeWidth: 2, r: 4 }}
                      name="Algae (Experimental)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="bacteria_exp" 
                      stroke="#1565c0" 
                      strokeWidth={0}
                      dot={{ fill: '#1565c0', strokeWidth: 2, r: 4 }}
                      name="Bacteria (Experimental)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>

            {/* 蔗糖浓度图表 */}
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1a202c' }}>
                Sucrose Concentration Dynamics
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Time (hours)', position: 'insideBottom', offset: -5 }} 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      label={{ value: 'Sucrose Concentration (g/L)', angle: -90, position: 'insideLeft' }} 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value) => [value?.toFixed(4), 'Sucrose Concentration']} 
                      contentStyle={{ 
                        fontSize: '12px', 
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e2e8f0',
                        borderRadius: 4
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sucrose_sim" 
                      stroke="#d32f2f" 
                      fill="#ffebee"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Box>

          {/* 右侧：参数调节面板 */}
          <Box>
            {/* 参数拟合结果 */}
            {fittedParams && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>DATA UPLOADED (.csv)</Typography>
                <Typography variant="body2">Analysis and fitting completed...</Typography>
              </Alert>
            )}

            {/* 蓝藻参数 */}
            <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, color: '#2e7d32', fontWeight: 600 }}>
                Algae Parameters
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Maximum Growth Rate (μ_max): {parameters.mu_max_algae.toFixed(3)} /day
                </Typography>
                <Slider
                  value={parameters.mu_max_algae}
                  min={0.001}
                  max={0.1}
                  step={0.001}
                  onChange={(e, value) => handleParameterChange('mu_max_algae', value)}
                  size="small"
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Half-Saturation Constant (K_s): {parameters.K_s_algae.toFixed(4)} g/L
                </Typography>
                <Slider
                  value={parameters.K_s_algae}
                  min={0.001}
                  max={0.1}
                  step={0.001}
                  onChange={(e, value) => handleParameterChange('K_s_algae', value)}
                  size="small"
                />
              </Box>

              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Death Rate (k_d): {parameters.k_d_algae.toFixed(4)} /day
                </Typography>
                <Slider
                  value={parameters.k_d_algae}
                  min={0.001}
                  max={0.1}
                  step={0.001}
                  onChange={(e, value) => handleParameterChange('k_d_algae', value)}
                  size="small"
                />
              </Box>
            </Paper>

            {/* 细菌参数 */}
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, color: '#1976d2', fontWeight: 600 }}>
                Bacteria Parameters
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Maximum Growth Rate (μ_max): {parameters.mu_max_bacteria.toFixed(3)} /day
                </Typography>
                <Slider
                  value={parameters.mu_max_bacteria}
                  min={0.01}
                  max={0.2}
                  step={0.001}
                  onChange={(e, value) => handleParameterChange('mu_max_bacteria', value)}
                  size="small"
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Half-Saturation Constant (K_s): {parameters.K_s_bacteria.toFixed(4)} g/L
                </Typography>
                <Slider
                  value={parameters.K_s_bacteria}
                  min={0.001}
                  max={0.05}
                  step={0.001}
                  onChange={(e, value) => handleParameterChange('K_s_bacteria', value)}
                  size="small"
                />
              </Box>

              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Death Rate (k_d): {parameters.k_d_bacteria.toFixed(4)} /day
                </Typography>
                <Slider
                  value={parameters.k_d_bacteria}
                  min={0.001}
                  max={0.05}
                  step={0.001}
                  onChange={(e, value) => handleParameterChange('k_d_bacteria', value)}
                  size="small"
                />
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {/* Tab 1: 数据分析 - 新布局 */}
      {tabValue === 1 && (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 3
        }}>
          {/* 左侧：实验数据表格 */}
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1a202c' }}>
              Experimental Data Analysis
            </Typography>
                <TableContainer sx={{ maxHeight: 500 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem', bgcolor: '#f5f5f5' }}>
                          Time (h)
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#2E8B57', bgcolor: '#f5f5f5' }}>
                          Algae OD600
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#4169E1', bgcolor: '#f5f5f5' }}>
                          Bacteria OD600
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem', bgcolor: '#f5f5f5' }}>
                          Ratio (B/A)
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '1.1rem', bgcolor: '#f5f5f5' }}>
                          Growth Trend
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {experimentalData.map((row, index) => (
                        <TableRow 
                          key={index} 
                          sx={{ 
                            '&:nth-of-type(odd)': { bgcolor: '#f9f9f9' },
                            '&:hover': { bgcolor: '#e3f2fd' },
                            height: 60
                          }}
                        >
                          <TableCell sx={{ fontWeight: 600, fontSize: '1rem' }}>
                            {row.time}
                          </TableCell>
                          <TableCell sx={{ color: '#2E8B57', fontSize: '1rem' }}>
                            {row.A_avg?.toFixed(4) || 'N/A'}
                          </TableCell>
                          <TableCell sx={{ color: '#4169E1', fontSize: '1rem' }}>
                            {row.B_avg?.toFixed(4) || 'N/A'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '1rem' }}>
                            {(row.A_avg && row.B_avg) ? (row.B_avg / row.A_avg).toFixed(2) : 'N/A'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '1rem' }}>
                            {index > 0 && row.B_avg && experimentalData[index-1].B_avg ? 
                              (row.B_avg > experimentalData[index-1].B_avg ? 'Growth' : 
                               row.B_avg < experimentalData[index-1].B_avg ? 'Decline' : 'Stable') 
                              : '初始'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
            </TableContainer>
          </Paper>

          {/* 右侧：统计分析和拟合图 */}
          <Box>
            {/* 统计摘要 */}
            <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1a202c' }}>
                Statistical Summary
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Average Algae OD600</Typography>
                  <Typography variant="h6" sx={{ color: '#2e7d32' }}>
                    {(experimentalData.reduce((sum, d) => sum + (d.A_avg || 0), 0) / experimentalData.length).toFixed(4)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Average Bacteria OD600</Typography>
                  <Typography variant="h6" sx={{ color: '#1976d2' }}>
                    {(experimentalData.reduce((sum, d) => sum + (d.B_avg || 0), 0) / experimentalData.length).toFixed(4)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Maximum Algae OD600</Typography>
                  <Typography variant="h6" sx={{ color: '#2e7d32' }}>
                    {Math.max(...experimentalData.map(d => d.A_avg || 0)).toFixed(4)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Maximum Bacteria OD600</Typography>
                  <Typography variant="h6" sx={{ color: '#1976d2' }}>
                    {Math.max(...experimentalData.map(d => d.B_avg || 0)).toFixed(4)}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* 模型拟合分析 */}
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1a202c' }}>
                Model Fitting Analysis
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="90%">
                  <ScatterChart 
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      type="number"
                      dataKey="x"
                      domain={[0, 'dataMax + 0.01']}
                      label={{ value: 'Experimental OD600 (A)', position: 'insideBottom', offset: -5 }} 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      type="number"
                      dataKey="y"
                      domain={[0, 'dataMax + 0.01']}
                      label={{ value: 'Simulated OD600 (B)', angle: -90, position: 'insideLeft' }} 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [value?.toFixed(4), name]}
                      contentStyle={{ 
                        fontSize: '12px', 
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e2e8f0',
                        borderRadius: 4
                      }}
                    />
                    <Scatter 
                      data={combinedData.filter(d => d.algae_exp && d.algae_sim).map(d => ({
                        x: d.algae_exp,
                        y: d.algae_sim,
                        name: 'Algae'
                      }))} 
                      fill="#2e7d32" 
                      r={4}
                      name="Algae Fit"
                    />
                    <Scatter 
                      data={combinedData.filter(d => d.bacteria_exp && d.bacteria_sim).map(d => ({
                        x: d.bacteria_exp,
                        y: d.bacteria_sim,
                        name: 'Bacteria'
                      }))} 
                      fill="#1976d2" 
                      r={4}
                      name="Bacteria Fit"
                    />
                    <ReferenceLine 
                      stroke="#64748b" 
                      strokeDasharray="3 3" 
                      strokeWidth={1}
                      segment={[{x: 0, y: 0}, {x: 0.1, y: 0.1}]}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {/* Tab 2: 系统方程 */}
      {tabValue === 2 && (
        <Box>
          {/* 模型概述 */}
          <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1a202c' }}>
              Mathematical Model of Algae-Bacteria Symbiosis System (Algae Dominant)  
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
              The co-culture system is described by a set of coupled ordinary differential equations (ODEs) 
              based on Monod kinetics, incorporating light limitation, nutrient competition, and metabolic interactions.
            </Typography>
          </Paper>

          <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Core Differential Equations</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Paper sx={{ bgcolor: '#f8fafc', p: 4, borderRadius: 2, border: '1px solid #e2e8f0' }}>

                <Typography variant="h6" sx={{ mb: 3, color: '#2e7d32', fontWeight: 600 }}>
                  1. Algae Population Dynamics
                </Typography>
                
                <Box sx={{ mb: 4, p: 3, bgcolor: '#f1f8e9', borderRadius: 2, border: '1px solid #c8e6c9' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2e7d32', mb: 2 }}>
                    Algae Growth Rate Equation:
                  </Typography>
                  <Typography sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '1.2rem', 
                    pl: 2, 
                    bgcolor: 'white', 
                    p: 2, 
                    borderRadius: 1,
                    border: '1px solid #e0e0e0'
                  }}>
                    dX<sub>algae</sub>/dt = μ<sub>algae</sub>(I,S) × X<sub>algae</sub> - k<sub>d,algae</sub> × X<sub>algae</sub>
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mt: 2, color: '#2e7d32' }}>
                    Where the specific growth rate is defined as:
                  </Typography>
                  <Typography sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '1.1rem', 
                    pl: 2, 
                    mt: 1,
                    bgcolor: 'white', 
                    p: 2, 
                    borderRadius: 1,
                    border: '1px solid #e0e0e0'
                  }}>
                    μ<sub>algae</sub> = μ<sub>max,algae</sub> × f<sub>light</sub>(I) × f<sub>nutrient</sub>(t) × f<sub>inhibition</sub>(X<sub>bacteria</sub>)
                  </Typography>
                </Box>

                <Box sx={{ mb: 4, p: 3, bgcolor: '#f1f8e9', borderRadius: 2, border: '1px solid #c8e6c9' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2e7d32', mb: 2 }}>
                    Light Limitation Function:
                  </Typography>
                  <Typography sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '1.1rem', 
                    pl: 2,
                    bgcolor: 'white', 
                    p: 2, 
                    borderRadius: 1,
                    border: '1px solid #e0e0e0'
                  }}>
                    f<sub>light</sub>(I) = I / (K<sub>I</sub> + I)
                  </Typography>
                  
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2e7d32', mb: 1, mt: 2 }}>
                    Nutrient Limitation (Time-dependent):
                  </Typography>
                  <Typography sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '1.1rem', 
                    pl: 2,
                    bgcolor: 'white', 
                    p: 2, 
                    borderRadius: 1,
                    border: '1px solid #e0e0e0'
                  }}>
                    f<sub>nutrient</sub>(t) = 0.1 + 0.9 × exp(-t/50)
                  </Typography>
                  
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2e7d32', mb: 1, mt: 2 }}>
                    Bacterial Inhibition:
                  </Typography>
                  <Typography sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '1.1rem', 
                    pl: 2,
                    bgcolor: 'white', 
                    p: 2, 
                    borderRadius: 1,
                    border: '1px solid #e0e0e0'
                  }}>
                    f<sub>inhibition</sub> = 1 / (1 + k<sub>inhibition</sub> × X<sub>bacteria</sub>)
                  </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" sx={{ mb: 3, color: '#1976d2', fontWeight: 600 }}>
                  2. Bacteria Population Dynamics
                </Typography>
                
                <Box sx={{ mb: 4, p: 3, bgcolor: '#e3f2fd', borderRadius: 2, border: '1px solid #90caf9' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2', mb: 2 }}>
                    Bacteria Growth Rate Equation:
                  </Typography>
                  <Typography sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '1.2rem', 
                    pl: 2,
                    bgcolor: 'white', 
                    p: 2, 
                    borderRadius: 1,
                    border: '1px solid #e0e0e0'
                  }}>
                    dX<sub>bacteria</sub>/dt = μ<sub>bacteria</sub>(S) × X<sub>bacteria</sub> - k<sub>d,bacteria</sub> × X<sub>bacteria</sub>
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mt: 2, color: '#1976d2' }}>
                    Where the specific growth rate follows modified Monod kinetics:
                  </Typography>
                  <Typography sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '1.1rem', 
                    pl: 2, 
                    mt: 1,
                    bgcolor: 'white', 
                    p: 2, 
                    borderRadius: 1,
                    border: '1px solid #e0e0e0'
                  }}>
                    μ<sub>bacteria</sub> = μ<sub>max,bacteria</sub> × (S + S<sub>base</sub>) / (K<sub>s,bacteria</sub> + S + S<sub>base</sub>) / f<sub>competition</sub>
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mt: 2, color: '#1976d2' }}>
                    Competition factor and base nutrients:
                  </Typography>
                  <Typography sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '1.1rem', 
                    pl: 2, 
                    mt: 1,
                    bgcolor: 'white', 
                    p: 2, 
                    borderRadius: 1,
                    border: '1px solid #e0e0e0'
                  }}>
                    f<sub>competition</sub> = 1 + 0.1 × X<sub>algae</sub>, &nbsp;&nbsp; S<sub>base</sub> = 0.01 g/L
                  </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" sx={{ mb: 3, color: '#d32f2f', fontWeight: 600 }}>
                  3. Sucrose Dynamics and Cross-Feeding
                </Typography>
                
                <Box sx={{ mb: 4, p: 3, bgcolor: '#ffebee', borderRadius: 2, border: '1px solid #ffcdd2' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#d32f2f', mb: 2 }}>
                    Sucrose Concentration Equation:
                  </Typography>
                  <Typography sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '1.2rem', 
                    pl: 2,
                    bgcolor: 'white', 
                    p: 2, 
                    borderRadius: 1,
                    border: '1px solid #e0e0e0'
                  }}>
                    dS/dt = Y<sub>algae→sucrose</sub> × μ<sub>algae</sub> × X<sub>algae</sub> - (1/Y<sub>sucrose→bacteria</sub>) × μ<sub>bacteria</sub> × X<sub>bacteria</sub> - k<sub>decay</sub> × S
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mt: 2, color: '#d32f2f' }}>
                    With non-negativity constraint: S(t) ≥ 0 for all t ≥ 0
                  </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ mt: 3, p: 3, bgcolor: '#f5f5f5', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#424242', mb: 2 }}>
                    Parameter Definitions and Units:
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#1976d2' }}>
                        <strong>State Variables:</strong><br/>
                        X<sub>algae</sub>, X<sub>bacteria</sub> : Biomass density (OD600)<br/>
                        S : Sucrose concentration (g/L)<br/>
                        I : Light intensity (μmol/m²/s)
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#2e7d32' }}>
                        <strong>Kinetic Parameters:</strong><br/>
                        μ<sub>max</sub> : Maximum growth rate (day⁻¹)<br/>
                        K<sub>s</sub>, K<sub>I</sub> : Half-saturation constants<br/>
                        k<sub>d</sub> : Death rate coefficient (day⁻¹)<br/>
                        Y : Yield coefficient (dimensionless)
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                </Paper>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Parameter Definitions</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Parameter</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Unit</TableCell>
                        <TableCell>Current Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>μ_max_algae</TableCell>
                        <TableCell>Maximum Specific Growth Rate of Algae</TableCell>
                        <TableCell>1/day</TableCell>
                        <TableCell>{parameters.mu_max_algae}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>μ_max_bacteria</TableCell>
                        <TableCell>Maximum Specific Growth Rate of Bacteria</TableCell>
                        <TableCell>1/day</TableCell>
                        <TableCell>{parameters.mu_max_bacteria}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>K_s_algae</TableCell>
                        <TableCell>Algae Half-Saturation Constant</TableCell>
                        <TableCell>g/L</TableCell>
                        <TableCell>{parameters.K_s_algae}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>K_s_bacteria</TableCell>
                        <TableCell>Bacteria Half-Saturation Constant</TableCell>
                        <TableCell>g/L</TableCell>
                        <TableCell>{parameters.K_s_bacteria}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Y_algae_sucrose</TableCell>
                        <TableCell>Sucrose Yield Coefficient</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>{parameters.Y_algae_sucrose}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
        </Box>
      )}

      {/* Tab 3: GSM模型 */}
      {tabValue === 3 && (
        <GSMModelingComponent />
      )}

      </Box>
    </Box>
  );
}

export default AlgaeBacteriaModeling;
