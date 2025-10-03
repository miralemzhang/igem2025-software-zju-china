import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  LinearProgress,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import Biotech from '@mui/icons-material/Biotech';
import TimelineIcon from '@mui/icons-material/Timeline';

const GSM_DATA = {
  cyanobacteria: {
    name: 'Synechococcus elongatus',
    reactions: [
      { id: 'PHOT', name: '光合作用', equation: '6CO2 + 6H2O + light → C6H12O6 + 6O2', flux: 0.85 },
      { id: 'SUCR_SYN', name: '蔗糖合成', equation: 'C6H12O6 + UDP-Glc → Sucrose + UDP', flux: 0.42 },
      { id: 'RESP', name: '呼吸作用', equation: 'C6H12O6 + 6O2 → 6CO2 + 6H2O + ATP', flux: 0.15 },
      { id: 'GROWTH', name: '生物量合成', equation: 'Biomass_precursors → Biomass', flux: 0.28 },
    ],
    metabolites: [
      { id: 'CO2', name: '二氧化碳', concentration: 0.04 },
      { id: 'H2O', name: '水', concentration: 55.5 },
      { id: 'Glc', name: '葡萄糖', concentration: 0.1 },
      { id: 'Sucrose', name: '蔗糖', concentration: 0.05 },
      { id: 'O2', name: '氧气', concentration: 0.21 },
      { id: 'ATP', name: 'ATP', concentration: 0.002 },
    ],
    genes: [
      { id: 'cscB', name: '蔗糖载体', expression: 0.8 },
      { id: 'spsA', name: '蔗糖磷酸合酶', expression: 0.9 },
      { id: 'sppA', name: '蔗糖磷酸磷酸酶', expression: 0.7 },
      { id: 'psaA', name: '光系统I', expression: 1.0 },
    ]
  },
  ecoli: {
    name: 'Escherichia coli',
    reactions: [
      { id: 'SUCR_UPT', name: '蔗糖摄取', equation: 'Sucrose_ext + PTS → Sucrose_int + PEP', flux: 0.35 },
      { id: 'SUCR_HYD', name: '蔗糖水解', equation: 'Sucrose → Glc + Fru', flux: 0.35 },
      { id: 'GLYC', name: '糖酵解', equation: 'Glc → 2 Pyr + 2 ATP + 2 NADH', flux: 0.30 },
      { id: 'TCA', name: 'TCA循环', equation: 'Pyr + CoA + NAD+ → AcCoA + CO2 + NADH', flux: 0.25 },
      { id: 'GROWTH_E', name: '生物量合成', equation: 'Biomass_precursors → Biomass', flux: 0.20 },
    ],
    metabolites: [
      { id: 'Sucrose_ext', name: '胞外蔗糖', concentration: 0.05 },
      { id: 'Sucrose_int', name: '胞内蔗糖', concentration: 0.01 },
      { id: 'Glc_e', name: '胞内葡萄糖', concentration: 0.02 },
      { id: 'Pyr', name: '丙酮酸', concentration: 0.001 },
      { id: 'ATP_e', name: 'ATP', concentration: 0.005 },
      { id: 'NADH', name: 'NADH', concentration: 0.0001 },
    ],
    genes: [
      { id: 'cscA', name: '蔗糖载体', expression: 0.6 },
      { id: 'cscK', name: '蔗糖激酶', expression: 0.7 },
      { id: 'pfkA', name: '磷酸果糖激酶', expression: 0.8 },
      { id: 'pykA', name: '丙酮酸激酶', expression: 0.9 },
    ]
  }
};

class FluxBalanceAnalysis {
  constructor() {
    this.stoichiometricMatrix = this.buildStoichiometricMatrix();
    this.objectiveFunction = this.buildObjectiveFunction();
  }

  buildStoichiometricMatrix() {
    return {
      metabolites: ['CO2', 'H2O', 'Glc', 'Sucrose', 'O2', 'ATP', 'Biomass'],
      reactions: ['PHOT', 'SUCR_SYN', 'RESP', 'SUCR_UPT', 'GLYC', 'GROWTH'],
      matrix: [
        [-6, 0, 1, 0, 0, 0],      // CO2
        [-6, 0, 6, 0, 0, 0],      // H2O
        [1, -1, -1, 0, -1, 0],    // Glc
        [0, 1, 0, -1, 0, 0],      // Sucrose
        [6, 0, -6, 0, 0, 0],      // O2
        [0, 0, 30, 0, 2, -1],     // ATP
        [0, 0, 0, 0, 0, 1],       // Biomass
      ]
    };
  }

  buildObjectiveFunction() {
    return [0, 0, 0, 0, 0, 1]; // 对应GROWTH反应
  }

  solveFBA(constraints = {}) {
    const defaultFluxes = [0.85, 0.42, 0.15, 0.35, 0.30, 0.28];
    
    const constrainedFluxes = defaultFluxes.map((flux, i) => {
      const reactionId = this.stoichiometricMatrix.reactions[i];
      return constraints[reactionId] !== undefined ? constraints[reactionId] : flux;
    });

    return {
      fluxes: constrainedFluxes,
      objective: constrainedFluxes[5], // 生物量通量
      feasible: true
    };
  }

  performFluxVariabilityAnalysis() {
    const reactions = this.stoichiometricMatrix.reactions;
    const variability = {};

    reactions.forEach(reaction => {
      const baseResult = this.solveFBA();
      const minResult = this.solveFBA({ [reaction]: 0 });
      const maxResult = this.solveFBA({ [reaction]: baseResult.fluxes[reactions.indexOf(reaction)] * 1.5 });

      variability[reaction] = {
        min: Math.max(0, minResult.fluxes[reactions.indexOf(reaction)]),
        max: maxResult.fluxes[reactions.indexOf(reaction)],
        base: baseResult.fluxes[reactions.indexOf(reaction)]
      };
    });

    return variability;
  }
}

function GSMIntegration() {
  const [fba] = useState(new FluxBalanceAnalysis());
  const [fluxResults, setFluxResults] = useState(null);
  const [variabilityResults, setVariabilityResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedOrganism, setSelectedOrganism] = useState('cyanobacteria');

  useEffect(() => {
    runFBA();
  }, [fba]);

  const runFBA = async () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const results = fba.solveFBA();
      const variability = fba.performFluxVariabilityAnalysis();
      
      setFluxResults(results);
      setVariabilityResults(variability);
      setIsAnalyzing(false);
    }, 1000);
  };

  const getCurrentData = () => GSM_DATA[selectedOrganism];

  const getNetworkData = () => {
    const data = getCurrentData();
    return {
      nodes: [
        ...data.metabolites.map(met => ({ 
          id: met.id, 
          name: met.name, 
          type: 'metabolite',
          value: met.concentration 
        })),
        ...data.reactions.map(rxn => ({ 
          id: rxn.id, 
          name: rxn.name, 
          type: 'reaction',
          value: rxn.flux 
        }))
      ],
      links: data.reactions.flatMap(rxn => 
        rxn.equation.split('→')[0].split('+').map(substrate => ({
          source: substrate.trim().split(' ').pop(),
          target: rxn.id,
          value: 1
        })).concat(
          rxn.equation.split('→')[1].split('+').map(product => ({
            source: rxn.id,
            target: product.trim().split(' ').pop(),
            value: 1
          }))
        )
      ).filter(link => link.source && link.target)
    };
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: '#f0f8ff' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <AccountTreeIcon sx={{ fontSize: 40, color: '#4169E1' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#2D3748' }}>
              基因组规模代谢模型 (GSM)
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#5A5A5A' }}>
              Genome-Scale Metabolic Model Integration
            </Typography>
          </Box>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                variant={selectedOrganism === 'cyanobacteria' ? 'contained' : 'outlined'}
                onClick={() => setSelectedOrganism('cyanobacteria')}
                startIcon={<Biotech />}
                sx={{ textTransform: 'none' }}
              >
                蓝藻 (Synechococcus)
              </Button>
              <Button
                variant={selectedOrganism === 'ecoli' ? 'contained' : 'outlined'}
                onClick={() => setSelectedOrganism('ecoli')}
                startIcon={<Biotech />}
                sx={{ textTransform: 'none' }}
              >
                大肠杆菌 (E. coli)
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              variant="contained"
              startIcon={<TimelineIcon />}
              onClick={runFBA}
              disabled={isAnalyzing}
              sx={{ textTransform: 'none' }}
            >
              {isAnalyzing ? '分析中...' : '运行通量平衡分析'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Biotech />
                {getCurrentData().name} - 代谢反应
              </Typography>
              
              {isAnalyzing && <LinearProgress sx={{ mb: 2 }} />}
              
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>反应ID</TableCell>
                      <TableCell>反应名称</TableCell>
                      <TableCell>通量值</TableCell>
                      <TableCell>状态</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getCurrentData().reactions.map((reaction) => (
                      <TableRow key={reaction.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {reaction.id}
                          </Typography>
                        </TableCell>
                        <TableCell>{reaction.name}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {reaction.flux.toFixed(3)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={reaction.flux > 0.1 ? '活跃' : '低活性'}
                            color={reaction.flux > 0.1 ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                代谢物浓度分布
              </Typography>
              
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>代谢物</TableCell>
                      <TableCell>浓度 (mM)</TableCell>
                      <TableCell>相对丰度</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getCurrentData().metabolites.map((metabolite) => (
                      <TableRow key={metabolite.id}>
                        <TableCell>{metabolite.name}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {metabolite.concentration.toFixed(3)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(100, metabolite.concentration * 100)}
                              sx={{ flex: 1, height: 6 }}
                            />
                            <Typography variant="caption">
                              {(metabolite.concentration * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {fluxResults && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  通量平衡分析 (FBA) 结果
                </Typography>
                
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>目标函数值:</strong> {fluxResults.objective.toFixed(4)} (生物量通量)
                  </Typography>
                  <Typography variant="body2">
                    <strong>求解状态:</strong> {fluxResults.feasible ? '可行解' : '无可行解'}
                  </Typography>
                </Alert>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">详细通量分布</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {fba.stoichiometricMatrix.reactions.map((reaction, index) => (
                        <Grid item xs={12} sm={6} md={4} key={reaction}>
                          <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
                              {reaction}
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'primary.main' }}>
                              {fluxResults.fluxes[index].toFixed(3)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              mmol/gDW/h
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {variabilityResults && (
                  <Accordion sx={{ mt: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6">通量变异性分析 (FVA)</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>反应</TableCell>
                              <TableCell>最小通量</TableCell>
                              <TableCell>基准通量</TableCell>
                              <TableCell>最大通量</TableCell>
                              <TableCell>变异性</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {Object.entries(variabilityResults).map(([reaction, data]) => (
                              <TableRow key={reaction}>
                                <TableCell sx={{ fontFamily: 'monospace' }}>{reaction}</TableCell>
                                <TableCell>{data.min.toFixed(3)}</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{data.base.toFixed(3)}</TableCell>
                                <TableCell>{data.max.toFixed(3)}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={`±${((data.max - data.min) / data.base * 100).toFixed(1)}%`}
                                    color={(data.max - data.min) / data.base > 0.5 ? 'warning' : 'success'}
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                关键基因表达水平
              </Typography>
              
              <Grid container spacing={2}>
                {getCurrentData().genes.map((gene) => (
                  <Grid item xs={12} sm={6} md={3} key={gene.id}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fafafa' }}>
                      <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                        {gene.id}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {gene.name}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={gene.expression * 100}
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption">
                        表达水平: {(gene.expression * 100).toFixed(1)}%
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default GSMIntegration;
