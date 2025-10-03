# iLUMA - Intelligent Laboratory Unified Modeling & Analysis Platform

[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![Python](https://img.shields.io/badge/Python-3.8%2B-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19.0%2B-blue.svg)](https://reactjs.org/)

**Developed by ZJU-China 2025 iGEM Team**

iLUMA is a comprehensive bioinformatics software tool designed for synthetic biology research, marine pollution monitoring, and intelligent data analysis. The platform integrates advanced AI capabilities with specialized biological modeling tools to provide researchers with a unified solution for complex biological system analysis.

## Features

**AI-Powered Assistant (Lumaris 4-Octo)**
- Intelligent chat interface built on Llama-3.1 8B-Instruct model
- Multi-language support for English, Chinese (Simplified & Traditional), and Cantonese
- Real-time responses with dynamic typing animation
- Project-specific knowledge trained on ZJU-China 2025 iGEM project data

**Protein Analysis Module**
- CSV file support for protein concentration data processing
- Statistical analysis including correlation analysis, curve fitting, and regression models
- Interactive visualizations with customizable parameters
- Specialized support for pDawn light-inducible protein systems

**Marine Pollution Control System**
- Real-time analysis of marine contamination
- Mathematical models for pollutant spread prediction
- Performance metrics for remediation strategies
- Comprehensive environmental impact assessment tools

**DNA Strand Displacement Visualization**
- Real-time animation of strand displacement reactions
- Biologically accurate reaction mechanisms implementation
- Adjustable parameters for different experimental conditions
- Educational interface with step-by-step visualization

**Sensor Layer Modeling**
- Advanced algorithms for biosensor behavior prediction
- Automated parameter fitting for experimental data
- 3D plots and interactive graphs
- Performance metrics including sensitivity, specificity, and response time analysis

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

## Usage Examples

### Protein Analysis
Upload CSV files with protein concentration data:
```csv
Time(h), Control, Treatment1, Treatment2
0, 100, 100, 100
1, 95, 120, 110
2, 90, 140, 125
```

### AI Assistant Interaction
Example chat interactions:
```
"What is the pDawn system?"
"How does strand displacement work?"
"Analyze my protein data"
"Generate a sensor visualization"
```

### Pollution Control Modeling
Configure parameters for environmental analysis:
```python
pollution_params = {
    'source_concentration': 1000,  # mg/L
    'diffusion_rate': 0.1,        # m²/s
    'degradation_rate': 0.05,     # 1/h
    'flow_velocity': 0.2          # m/s
}
```

## Configuration

### AI Model Setup
The AI assistant uses a fine-tuned Llama-3.1 8B model. Due to file size limitations, model files are not included in this repository.

To enable AI features:
1. Contact ZJU-China 2025 team for model files
2. Place model files in: `backend/Llama-3-8B-custom-RAG-zh/`
3. Required files: `adapter_config.json`, `adapter_model.safetensors`, `tokenizer_config.json`, `tokenizer.json`

Note: The system will use fallback responses if model files are unavailable.

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

## Performance Specifications

- Response Time: Less than 2 seconds for most API calls
- Concurrent Users: Supports up to 100 simultaneous connections
- Data Processing: Handles datasets up to 10MB
- AI Response: Average 1-3 seconds for chat responses

## Contributing

We welcome contributions from the synthetic biology and bioinformatics community.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Style
- Python: Follow PEP 8 guidelines
- JavaScript: Use ESLint configuration provided
- Documentation: Update README for new features

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 5000, and 5030 are available
2. **Python dependencies**: Use `pip install --upgrade pip` before installing requirements
3. **Node.js version**: Ensure you're using Node.js 16 or higher
4. **CORS issues**: Check that Flask-CORS is properly configured

### Getting Help

- Check the [Issues](https://gitlab.igem.org/2025/software-tools/zju-china/-/issues) page
- Contact the development team (see contact information below)
- Refer to the [ZJU-China 2025 Wiki](https://2025.igem.wiki/zju-china/software)

## License

This project is licensed under the Creative Commons Attribution 4.0 International License - see the [LICENSE](LICENSE) file for details.

## Authors and Acknowledgments

**ZJU-China 2025 iGEM Team - Dry Lab**

- Lead Developer: @MiralemZhang
- AI Model Training: ZJU-China 2025 Team
- Biological Modeling: ZJU-China 2025 Dry Lab
- Frontend Development: ZJU-China 2025 Team

### Special Thanks
- Zhejiang University iGEM Program for support and resources
- iGEM Foundation for the competition platform
- HuggingFace for the open-source Llama model
- React and Flask communities for excellent documentation

## Contact

- Email: ZJU_China@outlook.com
- Developer: miralemzhang@gmail.com
- Project Wiki: https://2025.igem.wiki/zju-china/software

## Related Links

- [ZJU-China 2025 iGEM Wiki](https://2025.igem.wiki/zju-china/)
- [iGEM Competition](https://competition.igem.org/)
- [Synthetic Biology Community](https://synbiocommunity.org/)

## Version History

- **v1.3.2** (Current) - Enhanced AI responses, improved UI/UX
- **v1.2.0** - Added pollution control module
- **v1.1.0** - Integrated protein analysis features
- **v1.0.0** - Initial release with basic functionality

## Awards and Recognition

This software tool is submitted for the **iGEM 2025 Best Software Tool** award, representing innovative solutions in synthetic biology and environmental monitoring.

---

**Built by ZJU-China 2025 for the global synthetic biology community**

*This software tool is part of our iGEM 2025 project focusing on marine pollution control through synthetic biology approaches.*