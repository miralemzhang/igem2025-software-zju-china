// 实验数据处理和格式化
export const EXPERIMENTAL_DATA = {
  // 原始OD600数据
  rawData: [
    { time: 0, A_avg: 0.0157, A_std: 0.0020, B_avg: 0.0123, B_std: 0.0042 },
    { time: 24, A_avg: 0.0150, A_std: 0.0135, B_avg: 0.0213, B_std: 0.0081 },
    { time: 48, A_avg: 0.0097, A_std: 0.0095, B_avg: 0.0243, B_std: 0.0115 },
    { time: 72, A_avg: 0.0013, A_std: 0.0070, B_avg: 0.0130, B_std: 0.0075 },
    { time: 96, A_avg: 0.0097, A_std: 0.0075, B_avg: 0.0173, B_std: 0.0060 },
    { time: 120, A_avg: 0.0050, A_std: 0.0090, B_avg: 0.0173, B_std: 0.0085 },
    { time: 144, A_avg: null, A_std: null, B_avg: 0.0207, B_std: 0.0075 },
    { time: 168, A_avg: 0.0017, A_std: 0.0150, B_avg: 0.0277, B_std: 0.0255 },
    { time: 192, A_avg: null, A_std: null, B_avg: 0.0397, B_std: 0.0200 },
    { time: 216, A_avg: null, A_std: null, B_avg: 0.0433, B_std: 0.0125 },
  ],

  // 实验条件
  conditions: {
    temperature: 35, // °C
    pH: 8.0,
    lightIntensity: 200, // μmol/m²/s
    shaking: 150, // rpm
    volume: 50, // mL
    initialBiomass: {
      algae: 0.02, // OD600
      bacteria: 0.01 // OD600
    }
  },

  // 预期的蔗糖浓度数据 (基于文献估算)
  sucroseData: [
    { time: 0, concentration: 0.0 },
    { time: 24, concentration: 0.02 },
    { time: 48, concentration: 0.05 },
    { time: 72, concentration: 0.08 },
    { time: 96, concentration: 0.10 },
    { time: 120, concentration: 0.12 },
    { time: 144, concentration: 0.11 },
    { time: 168, concentration: 0.09 },
    { time: 192, concentration: 0.07 },
    { time: 216, concentration: 0.05 },
  ]
};

// 数据处理函数
export const processExperimentalData = () => {
  return EXPERIMENTAL_DATA.rawData.map(point => ({
    ...point,
    A_present: point.A_avg !== null,
    B_present: point.B_avg !== null,
    ratio: point.A_avg && point.B_avg ? point.B_avg / point.A_avg : null
  }));
};

// 统计分析函数
export const calculateStatistics = () => {
  const validAData = EXPERIMENTAL_DATA.rawData.filter(d => d.A_avg !== null);
  const validBData = EXPERIMENTAL_DATA.rawData.filter(d => d.B_avg !== null);
  
  return {
    groupA: {
      n: validAData.length,
      mean: validAData.reduce((sum, d) => sum + d.A_avg, 0) / validAData.length,
      max: Math.max(...validAData.map(d => d.A_avg)),
      min: Math.min(...validAData.map(d => d.A_avg))
    },
    groupB: {
      n: validBData.length,
      mean: validBData.reduce((sum, d) => sum + d.B_avg, 0) / validBData.length,
      max: Math.max(...validBData.map(d => d.B_avg)),
      min: Math.min(...validBData.map(d => d.B_avg))
    }
  };
};

export default EXPERIMENTAL_DATA;



