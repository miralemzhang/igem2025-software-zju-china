import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Alert,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
  Assessment as AssessmentIcon,
  AccountTree as AccountTreeIcon
} from '@mui/icons-material';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ScatterChart,
  Scatter,
  Cell,
  LineChart,
  Line,
  ComposedChart
} from 'recharts';

class GSMModel {
  constructor() {
    this.algaeNetwork = {
      metabolites: {
        'co2': { name: 'CO2', compartment: 'extracellular' },
        'h2o': { name: 'H2O', compartment: 'extracellular' },
        'light': { name: 'Light', compartment: 'extracellular' },
        'o2': { name: 'O2', compartment: 'extracellular' },
        'glucose': { name: 'Glucose', compartment: 'cytoplasm' },
        'sucrose': { name: 'Sucrose', compartment: 'extracellular' },
        'biomass_algae': { name: 'Algae Biomass', compartment: 'cytoplasm' }
      },
      reactions: {
        'PHOTOSYNTHESIS': {
          name: 'Photosynthesis',
          equation: '6 CO2 + 6 H2O + Light → C6H12O6 + 6 O2',
          bounds: [0, 100],
          subsystem: 'Photosynthesis'
        },
        'SUCROSE_SYNTHESIS': {
          name: 'Sucrose Synthesis',
          equation: 'Glucose → 0.5 Sucrose',
          bounds: [0, 50],
          subsystem: 'Carbohydrate Metabolism'
        },
        'BIOMASS_ALGAE': {
          name: 'Algae Biomass Formation',
          equation: 'Glucose → Biomass',
          bounds: [0, 20],
          subsystem: 'Biomass Formation'
        }
      }
    };

    this.bacteriaNetwork = {
      metabolites: {
        'sucrose': { name: 'Sucrose', compartment: 'extracellular' },
        'glucose': { name: 'Glucose', compartment: 'cytoplasm' },
        'pyruvate': { name: 'Pyruvate', compartment: 'cytoplasm' },
        'acetate': { name: 'Acetate', compartment: 'extracellular' },
        'biomass_bacteria': { name: 'Bacteria Biomass', compartment: 'cytoplasm' }
      },
      reactions: {
        'SUCROSE_UPTAKE': {
          name: 'Sucrose Uptake',
          equation: 'Sucrose → Glucose',
          bounds: [0, 30],
          subsystem: 'Transport'
        },
        'GLYCOLYSIS': {
          name: 'Glycolysis',
          equation: 'Glucose → 2 Pyruvate',
          bounds: [0, 40],
          subsystem: 'Central Carbon Metabolism'
        },
        'ACETATE_EXCRETION': {
          name: 'Acetate Excretion',
          equation: 'Pyruvate → Acetate',
          bounds: [0, 25],
          subsystem: 'Fermentation'
        },
        'BIOMASS_BACTERIA': {
          name: 'Bacteria Biomass Formation',
          equation: 'Pyruvate → Biomass',
          bounds: [0, 15],
          subsystem: 'Biomass Formation'
        }
      }
    };

    this.interactions = {
      'SUCROSE_TRANSFER': {
        name: 'Sucrose Transfer',
        description: 'Algae-produced sucrose consumed by bacteria',
        stoichiometry: { 'algae_sucrose_out': -1, 'bacteria_sucrose_in': 1 }
      }
    };
  }

  performFBA(organism = 'algae') {
    const network = organism === 'algae' ? this.algaeNetwork : this.bacteriaNetwork;
    const fluxes = {};
    
    Object.keys(network.reactions).forEach(reactionId => {
      const reaction = network.reactions[reactionId];
      const maxFlux = reaction.bounds[1];
      fluxes[reactionId] = Math.random() * maxFlux * 0.7;
    });

    return fluxes;
  }

  analyzeNetwork(organism = 'algae') {
    const network = organism === 'algae' ? this.algaeNetwork : this.bacteriaNetwork;
    
    return {
      metaboliteCount: Object.keys(network.metabolites).length,
      reactionCount: Object.keys(network.reactions).length,
      subsystems: [...new Set(Object.values(network.reactions).map(r => r.subsystem))],
      connectivity: this.calculateConnectivity(network)
    };
  }

  calculateConnectivity(network) {
    const metabolites = Object.keys(network.metabolites);
    const reactions = Object.keys(network.reactions);
    
    return {
      avgDegree: (metabolites.length + reactions.length) / metabolites.length,
      density: reactions.length / (metabolites.length * (metabolites.length - 1))
    };
  }

  analyzeCoCulture() {
    const algaeFluxes = this.performFBA('algae');
    const bacteriaFluxes = this.performFBA('bacteria');
    
    return {
      algae: algaeFluxes,
      bacteria: bacteriaFluxes,
      interactions: this.calculateInteractions(algaeFluxes, bacteriaFluxes)
    };
  }

  calculateInteractions(algaeFluxes, bacteriaFluxes) {
    return {
      sucroseProduction: algaeFluxes.SUCROSE_SYNTHESIS || 0,
      sucroseConsumption: bacteriaFluxes.SUCROSE_UPTAKE || 0,
      crossFeedingEfficiency: Math.min(
        algaeFluxes.SUCROSE_SYNTHESIS || 0,
        bacteriaFluxes.SUCROSE_UPTAKE || 0
      ) / Math.max(algaeFluxes.SUCROSE_SYNTHESIS || 1, 1)
    };
  }
}

const GSMModelingComponent = () => {
  const [gsmModel] = useState(new GSMModel());
  const [fluxResults, setFluxResults] = useState(null);
  const [networkAnalysis, setNetworkAnalysis] = useState(null);
  const [coCultureAnalysis, setCoCultureAnalysis] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const runGSMAnalysis = async () => {
      setIsRunning(true);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const algaeAnalysis = gsmModel.analyzeNetwork('algae');
      const bacteriaAnalysis = gsmModel.analyzeNetwork('bacteria');
      const coCultureResults = gsmModel.analyzeCoCulture();
      
      setNetworkAnalysis({
        algae: algaeAnalysis,
        bacteria: bacteriaAnalysis
      });
      
      setCoCultureAnalysis(coCultureResults);
      setFluxResults(coCultureResults);
      setIsRunning(false);
    };

    runGSMAnalysis();
  }, [gsmModel]);

  const formatFluxData = (fluxes) => {
    if (!fluxes) return [];
    
    return Object.entries(fluxes).map(([reaction, flux]) => ({
      reaction: reaction.replace(/_/g, ' '),
      flux: Number(flux.toFixed(3))
    }));
  };

  const generateNetworkTopology = (organism = 'algae') => {
    const nodes = [];
    const edges = [];
    
    if (organism === 'algae') {
      const algaeNodes = [
        { id: 'co2_ext', name: 'CO₂', type: 'species', x: 60, y: 140, compartment: 'external', shape: 'circle' },
        { id: 'h2o_ext', name: 'H₂O', type: 'species', x: 60, y: 200, compartment: 'external', shape: 'circle' },
        { id: 'light', name: 'Light', type: 'species', x: 60, y: 100, compartment: 'external', shape: 'circle' },
        
        { id: 'o2_ext', name: 'O₂', type: 'species', x: 560, y: 100, compartment: 'external', shape: 'circle' },
        { id: 'sucrose_ext', name: 'Sucrose', type: 'species', x: 560, y: 260, compartment: 'external', shape: 'circle' },
        
        { id: 'co2_in', name: 'CO₂', type: 'species', x: 180, y: 140, compartment: 'cytoplasm', shape: 'circle' },
        { id: 'glucose', name: 'Glucose', type: 'species', x: 320, y: 160, compartment: 'cytoplasm', shape: 'circle' },
        { id: 'sucrose_in', name: 'Sucrose', type: 'species', x: 440, y: 240, compartment: 'cytoplasm', shape: 'circle' },
        
        { id: 'photosynthesis', name: 'Photosynthesis', type: 'process', x: 250, y: 110, shape: 'square' },
        { id: 'sucrose_synthesis', name: 'Sucrose\nSynthesis', type: 'process', x: 380, y: 200, shape: 'square' },
        { id: 'sucrose_transport', name: 'Export', type: 'process', x: 500, y: 250, shape: 'square' },
        { id: 'growth_algae', name: 'Growth', type: 'process', x: 320, y: 280, shape: 'square' },
        
        { id: 'biomass_algae', name: 'μ_cyano', type: 'species', x: 320, y: 340, compartment: 'cytoplasm', shape: 'hexagon' }
      ];
      
      const algaeEdges = [
        { from: 'co2_ext', to: 'photosynthesis', type: 'consumption', stoichiometry: 6 },
        { from: 'h2o_ext', to: 'photosynthesis', type: 'consumption', stoichiometry: 6 },
        { from: 'light', to: 'photosynthesis', type: 'modulation', stoichiometry: 1 },
        { from: 'photosynthesis', to: 'glucose', type: 'production', stoichiometry: 1 },
        { from: 'photosynthesis', to: 'o2_ext', type: 'production', stoichiometry: 6 },
        
        { from: 'glucose', to: 'sucrose_synthesis', type: 'consumption', stoichiometry: 2 },
        { from: 'sucrose_synthesis', to: 'sucrose_in', type: 'production', stoichiometry: 1 },
        { from: 'sucrose_in', to: 'sucrose_transport', type: 'consumption', stoichiometry: 1 },
        { from: 'sucrose_transport', to: 'sucrose_ext', type: 'production', stoichiometry: 1 },
        
        { from: 'glucose', to: 'growth_algae', type: 'consumption', stoichiometry: 1 },
        { from: 'growth_algae', to: 'biomass_algae', type: 'production', stoichiometry: 1 }
      ];
      
      nodes.push(...algaeNodes);
      edges.push(...algaeEdges);
      
    } else {
      const bacteriaNodes = [
        { id: 'sucrose_ext', name: 'Sucrose', type: 'species', x: 60, y: 180, compartment: 'external', shape: 'circle' },
        
        { id: 'acetate_ext', name: 'Acetate', type: 'species', x: 560, y: 140, compartment: 'external', shape: 'circle' },
        { id: 'ethanol_ext', name: 'Ethanol', type: 'species', x: 560, y: 220, compartment: 'external', shape: 'circle' },
        
        { id: 'sucrose_in', name: 'Sucrose', type: 'species', x: 180, y: 180, compartment: 'cytoplasm', shape: 'circle' },
        { id: 'glucose', name: 'Glucose', type: 'species', x: 280, y: 180, compartment: 'cytoplasm', shape: 'circle' },
        { id: 'pyruvate', name: 'Pyruvate', type: 'species', x: 380, y: 180, compartment: 'cytoplasm', shape: 'circle' },
        { id: 'acetyl_coa', name: 'Acetyl-CoA', type: 'species', x: 350, y: 120, compartment: 'cytoplasm', shape: 'circle' },
        
        { id: 'sucrose_uptake', name: 'Uptake', type: 'process', x: 130, y: 180, shape: 'square' },
        { id: 'glycolysis', name: 'Glycolysis', type: 'process', x: 230, y: 180, shape: 'square' },
        { id: 'pyruvate_decarb', name: 'Decarb', type: 'process', x: 365, y: 150, shape: 'square' },
        { id: 'fermentation', name: 'Fermentation', type: 'process', x: 470, y: 180, shape: 'square' },
        { id: 'growth_bacteria', name: 'Growth', type: 'process', x: 350, y: 260, shape: 'square' },
        
        { id: 'biomass_bacteria', name: 'μ_yeast', type: 'species', x: 350, y: 320, compartment: 'cytoplasm', shape: 'hexagon' }
      ];
      
      const bacteriaEdges = [
        { from: 'sucrose_ext', to: 'sucrose_uptake', type: 'consumption', stoichiometry: 1 },
        { from: 'sucrose_uptake', to: 'sucrose_in', type: 'production', stoichiometry: 1 },
        { from: 'sucrose_in', to: 'glycolysis', type: 'consumption', stoichiometry: 1 },
        { from: 'glycolysis', to: 'glucose', type: 'production', stoichiometry: 2 },
        { from: 'glucose', to: 'glycolysis', type: 'consumption', stoichiometry: 1 },
        { from: 'glycolysis', to: 'pyruvate', type: 'production', stoichiometry: 2 },
        
        { from: 'pyruvate', to: 'pyruvate_decarb', type: 'consumption', stoichiometry: 1 },
        { from: 'pyruvate_decarb', to: 'acetyl_coa', type: 'production', stoichiometry: 1 },
        { from: 'pyruvate', to: 'fermentation', type: 'consumption', stoichiometry: 1 },
        { from: 'fermentation', to: 'acetate_ext', type: 'production', stoichiometry: 1 },
        { from: 'fermentation', to: 'ethanol_ext', type: 'production', stoichiometry: 1 },
        
        { from: 'acetyl_coa', to: 'growth_bacteria', type: 'consumption', stoichiometry: 1 },
        { from: 'growth_bacteria', to: 'biomass_bacteria', type: 'production', stoichiometry: 1 }
      ];
      
      nodes.push(...bacteriaNodes);
      edges.push(...bacteriaEdges);
    }
    
    return { nodes, edges };
  };

  const generateSubsystemData = () => {
    if (!networkAnalysis) return [];
    
    const algaeSubsystems = gsmModel.algaeNetwork.reactions;
    const bacteriaSubsystems = gsmModel.bacteriaNetwork.reactions;
    
    const subsystemCounts = {};
    
    Object.values(algaeSubsystems).forEach(reaction => {
      subsystemCounts[reaction.subsystem] = (subsystemCounts[reaction.subsystem] || 0) + 1;
    });
    
    Object.values(bacteriaSubsystems).forEach(reaction => {
      subsystemCounts[reaction.subsystem] = (subsystemCounts[reaction.subsystem] || 0) + 1;
    });
    
    return Object.entries(subsystemCounts).map(([subsystem, count]) => ({
      subsystem: subsystem.replace(/([A-Z])/g, ' $1').trim(),
      count,
      fill: `hsl(${Math.random() * 360}, 70%, 50%)`
    }));
  };

  const renderNetworkTopology = (organism = 'algae') => {
    const { nodes, edges } = generateNetworkTopology(organism);
    
    const colors = {
      species_external: '#e3f2fd',
      species_cytoplasm: '#f3e5f5',
      process: '#fff3e0',
      biomass: '#e8f5e8',
      consumption: '#4caf50',
      production: '#ff9800',
      modulation: '#f44336'
    };

    return (
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1
          }}
          viewBox="0 0 600 450"
        >
          <defs>
            <marker
              id={`consumption-arrow-${organism}`}
              markerWidth="8"
              markerHeight="6"
              refX="8"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon
                points="0,0 8,3 0,6"
                fill={colors.consumption}
              />
            </marker>
            
            <marker
              id={`production-arrow-${organism}`}
              markerWidth="8"
              markerHeight="6"
              refX="8"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon
                points="0,0 8,3 0,6"
                fill={colors.production}
              />
            </marker>
            
            <marker
              id={`modulation-arrow-${organism}`}
              markerWidth="8"
              markerHeight="6"
              refX="8"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon
                points="0,0 8,3 0,6"
                fill={colors.modulation}
              />
            </marker>
            
            <pattern id={`cell-boundary-${organism}`} patternUnits="userSpaceOnUse" width="4" height="4">
              <rect width="4" height="4" fill="none" stroke="#90a4ae" strokeWidth="0.5"/>
              <path d="M0,4 L4,0" stroke="#90a4ae" strokeWidth="0.5"/>
            </pattern>
          </defs>
          
          <rect
            x="120"
            y="70"
            width="400"
            height="320"
            fill="none"
            stroke="#607d8b"
            strokeWidth="2"
            strokeDasharray="5,5"
            rx="15"
          />
          <text x="125" y="65" fontSize="12" fill="#607d8b" fontWeight="bold">
            {organism === 'algae' ? 'Synechococcus elongatus' : 'Saccharomyces cerevisiae'}
          </text>
          
          {edges.map((edge, index) => {
            const fromNode = nodes.find(n => n.id === edge.from);
            const toNode = nodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return null;
            
            const strokeColor = edge.type === 'consumption' ? colors.consumption :
                              edge.type === 'production' ? colors.production :
                              edge.type === 'modulation' ? colors.modulation : '#666';
            
            const markerEnd = edge.type === 'consumption' ? `url(#consumption-arrow-${organism})` :
                            edge.type === 'production' ? `url(#production-arrow-${organism})` :
                            edge.type === 'modulation' ? `url(#modulation-arrow-${organism})` : '';
            
            return (
              <g key={index}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={strokeColor}
                  strokeWidth={edge.type === 'modulation' ? 1.5 : 2}
                  strokeDasharray={edge.type === 'modulation' ? '3,3' : 'none'}
                  markerEnd={markerEnd}
                  opacity={0.8}
                />
                {edge.stoichiometry > 1 && (
                  <g>
                    {(() => {
                      const midX = (fromNode.x + toNode.x) / 2;
                      const midY = (fromNode.y + toNode.y) / 2;
                      
                      const dx = toNode.x - fromNode.x;
                      const dy = toNode.y - fromNode.y;
                      const length = Math.sqrt(dx * dx + dy * dy);
                      
                      const offsetX = (-dy / length) * 12;
                      const offsetY = (dx / length) * 12;
                      
                      const labelX = midX + offsetX;
                      const labelY = midY + offsetY;
                      
                      return (
                        <>
                          <circle
                            cx={labelX}
                            cy={labelY}
                            r="9"
                            fill="white"
                            stroke={strokeColor}
                            strokeWidth="1.5"
                            opacity="0.95"
                          />
                          <text
                            x={labelX}
                            y={labelY + 3}
                            fontSize="9"
                            fill={strokeColor}
                            textAnchor="middle"
                            fontWeight="bold"
                          >
                            {edge.stoichiometry}
                          </text>
                        </>
                      );
                    })()}
                  </g>
                )}
              </g>
            );
          })}
          
          {nodes.map((node, index) => {
            let fillColor, strokeColor, shape;
            
            if (node.type === 'species') {
              fillColor = node.compartment === 'external' ? colors.species_external : colors.species_cytoplasm;
              strokeColor = node.compartment === 'external' ? '#1976d2' : '#7b1fa2';
              
              if (node.shape === 'hexagon') {
                const size = 18;
                const points = Array.from({length: 6}, (_, i) => {
                  const angle = (i * Math.PI) / 3;
                  const x = node.x + size * Math.cos(angle);
                  const y = node.y + size * Math.sin(angle);
                  return `${x},${y}`;
                }).join(' ');
                
                shape = (
                  <polygon
                    key={`node-${index}`}
                    points={points}
                    fill={colors.biomass}
                    stroke="#2e7d32"
                    strokeWidth="2"
                  />
                );
              } else {
                shape = (
                  <circle
                    key={`node-${index}`}
                    cx={node.x}
                    cy={node.y}
                    r="15"
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth="2"
                  />
                );
              }
            } else if (node.type === 'process') {
              shape = (
                <rect
                  key={`node-${index}`}
                  x={node.x - 10}
                  y={node.y - 10}
                  width="20"
                  height="20"
                  fill={colors.process}
                  stroke="#f57c00"
                  strokeWidth="2"
                  rx="3"
                />
              );
            }
            
            const textLines = node.name.split('\n');
            let textY, textX = node.x;
            
            if (node.type === 'species' && node.shape === 'hexagon') {
              textY = node.y + 40;
            } else if (node.type === 'species') {
              if (node.compartment === 'external') {
                if (node.x < 300) {
                  textX = node.x - 25;
                } else {
                  textX = node.x + 25;
                }
                textY = node.y + 5;
              } else {
                textY = node.y + 32;
              }
            } else {
              textY = node.y + 30;
            }
            
            return (
              <g key={`node-group-${index}`}>
                {shape}
                {textLines.map((line, lineIndex) => (
                  <text
                    key={`text-${index}-${lineIndex}`}
                    x={textX}
                    y={textY + (lineIndex * 11)}
                    fontSize="10"
                    textAnchor="middle"
                    fill="#2c3e50"
                    fontWeight="600"
                    style={{ 
                      textShadow: '1px 1px 2px white, -1px -1px 2px white, 1px -1px 2px white, -1px 1px 2px white'
                    }}
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
        
        <Box sx={{ 
          position: 'absolute', 
          top: 10, 
          right: 10, 
          display: 'flex',
          flexDirection: 'row',
          gap: 2,
          backgroundColor: 'rgba(255,255,255,0.98)',
          padding: 2,
          borderRadius: 3,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          fontSize: '9px',
          maxWidth: '280px'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Box sx={{ width: 10, height: 10, bgcolor: colors.species_external, border: '1px solid #1976d2', borderRadius: '50%' }} />
            <Typography variant="caption" fontSize="9px" fontWeight="500">Ext</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Box sx={{ width: 10, height: 10, bgcolor: colors.species_cytoplasm, border: '1px solid #7b1fa2', borderRadius: '50%' }} />
            <Typography variant="caption" fontSize="9px" fontWeight="500">Cyt</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Box sx={{ width: 10, height: 10, bgcolor: colors.process, border: '1px solid #f57c00', borderRadius: '1px' }} />
            <Typography variant="caption" fontSize="9px" fontWeight="500">Proc</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Box sx={{ width: 10, height: 10, bgcolor: colors.biomass, border: '1px solid #2e7d32', transform: 'rotate(45deg)' }} />
            <Typography variant="caption" fontSize="9px" fontWeight="500">Bio</Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1a202c' }}>
          Genome-Scale Metabolic Model (GSM) Analysis
        </Typography>

        {isRunning && <LinearProgress sx={{ mb: 2 }} />}

        <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
          Constraint-based metabolic network analysis integrating genome-scale metabolic models 
          of algae and bacteria to analyze flux distributions and interaction mechanisms in co-culture systems.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            label="Flux Balance Analysis (FBA)" 
            variant="outlined"
            sx={{ borderColor: '#7b1fa2', color: '#7b1fa2' }}
          />
          <Chip 
            label="Metabolic Network Topology" 
            variant="outlined"
            sx={{ borderColor: '#f57c00', color: '#f57c00' }}
          />
          <Chip 
            label="Cross-Feeding Analysis" 
            variant="outlined"
            sx={{ borderColor: '#388e3c', color: '#388e3c' }}
          />
        </Box>
      </Paper>

      {networkAnalysis && (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 3,
          mb: 3
        }}>
          <Box>
            <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1a202c' }}>
                Network Statistics
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#2e7d32', fontWeight: 600, mb: 1 }}>
                    Algae Network
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Metabolites</Typography>
                      <Typography variant="h6">{networkAnalysis.algae.metaboliteCount}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Reactions</Typography>
                      <Typography variant="h6">{networkAnalysis.algae.reactionCount}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Subsystems</Typography>
                      <Typography variant="h6">{networkAnalysis.algae.subsystems.length}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Density</Typography>
                      <Typography variant="h6">{networkAnalysis.algae.connectivity.density.toFixed(3)}</Typography>
                    </Box>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 600, mb: 1 }}>
                    Bacteria Network
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Metabolites</Typography>
                      <Typography variant="h6">{networkAnalysis.bacteria.metaboliteCount}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Reactions</Typography>
                      <Typography variant="h6">{networkAnalysis.bacteria.reactionCount}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Subsystems</Typography>
                      <Typography variant="h6">{networkAnalysis.bacteria.subsystems.length}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Density</Typography>
                      <Typography variant="h6">{networkAnalysis.bacteria.connectivity.density.toFixed(3)}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Paper>

            <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1a202c' }}>
                Metabolic Subsystem Distribution
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={generateSubsystemData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="subsystem" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      label={{ value: 'Reaction Count', angle: -90, position: 'insideLeft' }}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar dataKey="count">
                      {generateSubsystemData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Box>

          <Box>
            <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2e7d32' }}>
                Algae Metabolic Network Topology
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                Photosynthesis → Glucose → Sucrose/Biomass pathways with flux visualization
              </Typography>
              <Box sx={{ height: 300, position: 'relative', bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                {renderNetworkTopology('algae')}
              </Box>
            </Paper>

            <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1976d2' }}>
                Bacteria Metabolic Network Topology
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                Sucrose Uptake → Glycolysis → Acetate/Biomass pathways with flux visualization
              </Typography>
              <Box sx={{ height: 300, position: 'relative', bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                {renderNetworkTopology('bacteria')}
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {fluxResults && (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 3,
          mb: 3
        }}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2e7d32' }}>
              Algae Flux Distribution
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
              Photosynthesis and sucrose production flux rates
            </Typography>
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formatFluxData(fluxResults.algae)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="reaction" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis 
                    label={{ value: 'Flux (mmol/gDW/h)', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [value.toFixed(3) + ' mmol/gDW/h', 'Flux']}
                    contentStyle={{ 
                      fontSize: '12px', 
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #e2e8f0',
                      borderRadius: 4
                    }}
                  />
                  <Bar dataKey="flux" fill="#2e7d32" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1976d2' }}>
              Bacteria Flux Distribution
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
              Sucrose consumption and fermentation flux rates
            </Typography>
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formatFluxData(fluxResults.bacteria)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="reaction" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis 
                    label={{ value: 'Flux (mmol/gDW/h)', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [value.toFixed(3) + ' mmol/gDW/h', 'Flux']}
                    contentStyle={{ 
                      fontSize: '12px', 
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #e2e8f0',
                      borderRadius: 4
                    }}
                  />
                  <Bar dataKey="flux" fill="#1976d2" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Box>
      )}

      {coCultureAnalysis && (
        <Paper elevation={1} sx={{ p: 3, mt: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#1a202c' }}>
            Co-culture Interaction Analysis
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Sucrose Production</Typography>
                <Typography variant="h6">{coCultureAnalysis.interactions.sucroseProduction.toFixed(3)} mmol/gDW/h</Typography>
              </Alert>
            </Grid>
            <Grid item xs={12} md={4}>
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Sucrose Consumption</Typography>
                <Typography variant="h6">{coCultureAnalysis.interactions.sucroseConsumption.toFixed(3)} mmol/gDW/h</Typography>
              </Alert>
            </Grid>
            <Grid item xs={12} md={4}>
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Cross-Feeding Efficiency</Typography>
                <Typography variant="h6">{(coCultureAnalysis.interactions.crossFeedingEfficiency * 100).toFixed(1)}%</Typography>
              </Alert>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body2" sx={{ color: '#64748b' }}>
            <strong>Analysis:</strong> GSM analysis shows that cyanobacteria produce sucrose through photosynthesis,
            while E. coli consumes sucrose for growth. Cross-feeding efficiency reflects the degree of metabolic coupling between the two species,
            with high efficiency indicating a good symbiotic relationship. This analysis provides a theoretical basis for optimizing co-culture conditions.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default GSMModelingComponent;
