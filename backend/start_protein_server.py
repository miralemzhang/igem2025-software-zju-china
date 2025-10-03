import os
import sys
from app import app

def main():
    print("=" * 60)
    print("iLUMA protein production analysis system")
    print("ZJU-CHINA iGEM 2025")
    print("=" * 60)
    print()
    

    try:
        import pandas
        import numpy
        import matplotlib
        import seaborn
        print("all dependencies installed correctly")
    except ImportError as e:
        print(f"missing dependencies: {e}")
        print("please run: pip install -r requirements.txt")
        return
    
    print("✓ backend service is starting...")
    print("✓ API endpoints:")
    print("  - /api/protein-upload (POST) - upload experimental data")
    print("  - /api/protein-data (GET) - get analysis data")
    print("  - /api/protein-analysis-chart (GET) - get visualization chart")
    print("  - /api/protein-chat (POST) - intelligent analysis assistant")
    print()
    print("server address: http://localhost:5000")
    print("press Ctrl+C to stop server")
    print("=" * 60)
    
    try:
        app.run(host='0.0.0.0', port=5000, debug=True)
    except KeyboardInterrupt:
        print("\nserver stopped")

if __name__ == '__main__':
    main()

