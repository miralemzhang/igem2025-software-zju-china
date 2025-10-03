# iLUMA - Intelligent Laboratory Unified Modeling & Analysis Platform

[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![Python](https://img.shields.io/badge/Python-3.8%2B-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19.0%2B-blue.svg)](https://reactjs.org/)

**Developed by ZJU-China 2025**

iLUMA is a comprehensive bioinformatics software tool designed for synthetic biology research, marine pollution monitoring, and intelligent data analysis. The platform integrates advanced AI capabilities with specialized biological modeling tools to provide researchers with a unified solution for complex biological system analysis.

## Features

- User Console — an intuitive front end for operational use, composed primarily of two modules:
  - Monitor: a monitoring dashboard for real-time visualization of sensor data, pollutant dispersion maps, and alerting.
  - Terminal: a control panel for user commands, report generation, and interaction with Lumaris.
- Developer Console — a research-focused environment that provides tools for model development and validation, including four core scientific modelling modules (for data preprocessing, mechanistic/empirical modelling, predictive simulation, and model evaluation).
- AI Agent Lumaris — the integrated conversational and graph-generation agent based on a novel Soft-Supervised Mixture of Micro-Experts (SSMoME) and built on Llama3.1 by Meta, used for natural language interaction.

## Quick Start

### Prerequisites
- Python 3.8+ with pip
- Node.js 16+ with npm
- Git for version control

### Installation

1. Clone the repository
   ```bash
   git clone https://gitlab.igem.org/2025/software-tools/zju-china.git
   cd zju-china
   ```

2. Backend setup
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Frontend setup
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. Start backend services (Port 5030)
   ```bash
   cd backend
   python app.py
   ```

2. Start frontend (Port 3000)
   ```bash
   cd frontend
   npm start
   ```

3. Access the application at `http://localhost:3000`



## Configuration

### AI Model Setup
The AI assistant uses a fine-tuned Llama-3.1 8B model.

To enable AI features:
1. Contact ZJU-China 2025 team for model files
2. Place model files in: `backend/Llama-3-8B-custom-RAG-zh/`
3. Required files: `adapter_config.json`, `adapter_model.safetensors`, `tokenizer_config.json`, `tokenizer.json`


## Architecture

```
backend/
├── app.py                      # Main Flask application
├── UserAgentBackend.py         # AI agent service
├── protein_analysis_api.py     # Protein analysis module
├── pollution_control_api.py    # Pollution control system
├── sensor_layer_api.py         # Sensor modeling API
├── diffusion_visualization.py  # Strand displacement visualization
├── requirements.txt            # Python dependencies
└── images/                     # Static image assets

frontend/
├── src/
│   ├── App.js                  # Main React application
│   ├── components/             # Reusable React components
│   ├── utils/                  # Utility functions
│   └── data/                   # Static data files
├── public/                     # Public assets
└── package.json               # Node.js dependencies
```

## Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```


## Contributing

We welcome all related contributions through pull requests or issues.



## License

This project is licensed under the Creative Commons Attribution 4.0 International License - see the [LICENSE](LICENSE) file for details.

## Author

- **Mingtao Zhang**
  - Undergraduate student, Zhejiang University
  - Majoring in **Pharmaceutical Sxcience *(Honor)*** , minoring in **AI** and **DS&BDT**

## Acknowledgments
I would like to express my sincere gratitude to the following individuals and teams for their invaluable support and contributions:
- **Zhan Zhou**, Assistant Dean of the Innovation Institude of Artificial Intelligence in Medicine, Zhejiang University
- **Junbo Zhao**, Director of the Artificial Intelligence Frontier Research Center, Institute of Computer Innovation Technology, Zhejiang University
- and **All member of ZJU-China 2025**

## Contact

- Email: ZJU_China@outlook.com
- Developer: 
   - Email: miralemzhang@gmail.com
   - Blog: https://miralemzhang.github.io/
- Project Wiki: https://2025.igem.wiki/zju-china/software



## Version History (Brief)

- **v1.3.2** (Current) - Enhanced AI responses, improved UI/UX
- v1.2.0 - Added pollution control module
- v1.1.0 - Integrated protein analysis features
- v1.0.0 - Initial release with basic functionality


**Built by ZJU-China 2025 for the global synthetic biology community**

