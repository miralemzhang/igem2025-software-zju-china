from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from io import BytesIO, StringIO
import base64
import json
import os
from datetime import datetime
from scipy import stats
from scipy.optimize import curve_fit
from sklearn.metrics import r2_score, mean_squared_error
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)


plt.rcParams['font.sans-serif'] = ['SimHei', 'Arial Unicode MS', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

class ProteinAnalyzer:
    def __init__(self):
        self.data = None
        self.analysis_results = {}
        self.correlation_results = {}
        self.fitting_results = {}
    
    def load_data(self, csv_content):

        try:
            
            df = pd.read_csv(StringIO(csv_content))
            
    
            df.columns = df.columns.str.strip()
            
    
            if 'Induction time/h' in df.columns:
                numeric_cols = df.columns[1:]
                for col in numeric_cols:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
            else:
                time_col = df.columns[0]
                df[time_col] = pd.to_datetime(df[time_col], errors='coerce')
                
                numeric_cols = df.columns[1:]
                for col in numeric_cols:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
            
            self.data = df
            return True, "success"
        except Exception as e:
            return False, f"error: {str(e)}"
    
    def analyze_growth_patterns(self):
        if self.data is None:
            return None
        
        try:
            if 'Induction time/h' in self.data.columns:
                row = self.data.iloc[0]
                
                if 'intensity' in str(row.iloc[0]).lower():
                    results = []
                    time_values = []
                    intensity_values = []
                    
                    for col in self.data.columns[1:]:  
                        try:
                            time_val = float(col)  
                            intensity_val = float(row[col])  
                            time_values.append(time_val)
                            intensity_values.append(intensity_val)
                            
                            if len(intensity_values) > 1:
                                prev_intensity = intensity_values[-2]
                                growth_rate = ((intensity_val - prev_intensity) / prev_intensity * 100) if prev_intensity != 0 else 0
                            else:
                                growth_rate = 0
                            
                            results.append({
                                'time': f'{time_val}h',
                                'groupA': round(intensity_val, 2),
                                'groupB': round(intensity_val, 2),  
                                'growthRate': round(growth_rate, 2)
                            })
                        except (ValueError, TypeError):
                            continue
                    
                    self.analysis_results['growth_patterns'] = results
                    return results
            
            else:
                numeric_cols = self.data.select_dtypes(include=[np.number]).columns
                
                a_cols = [col for col in numeric_cols if 'A-' in col or 'a-' in col]
                b_cols = [col for col in numeric_cols if 'B-' in col or 'b-' in col]
                
                results = []
                for idx, row in self.data.iterrows():
                    if pd.isna(row.iloc[0]):  
                        continue
                    
                    a_mean = row[a_cols].mean() if a_cols else 0
                    b_mean = row[b_cols].mean() if b_cols else 0
                    
                    if idx > 0:
                        prev_a = self.data.iloc[idx-1][a_cols].mean() if a_cols else 0
                        prev_b = self.data.iloc[idx-1][b_cols].mean() if b_cols else 0
                        
                        growth_rate_a = ((a_mean - prev_a) / prev_a * 100) if prev_a != 0 else 0
                        growth_rate_b = ((b_mean - prev_b) / prev_b * 100) if prev_b != 0 else 0
                    else:
                        growth_rate_a = growth_rate_b = 0
                    
                    results.append({
                        'time': row.iloc[0].strftime('%Y-%m-%d') if pd.notna(row.iloc[0]) else '',
                        'groupA': round(a_mean, 4),
                        'groupB': round(b_mean, 4),
                        'growthRate': round((growth_rate_a + growth_rate_b) / 2, 2)
                    })
                
                self.analysis_results['growth_patterns'] = results
                return results
                
        except Exception as e:
            print(f"error: {e}")
            return None
    
    def perform_correlation_analysis(self):
        if self.data is None:
            return None
        
        try:
            if 'Induction time/h' in self.data.columns:
                row = self.data.iloc[0]
                
                if 'intensity' in str(row.iloc[0]).lower():
                    time_values = []
                    intensity_values = []
                    
                    for col in self.data.columns[1:]:
                        try:
                            time_val = float(col) 
                            intensity_val = float(row[col])  
                            time_values.append(time_val)
                            intensity_values.append(intensity_val)
                        except (ValueError, TypeError):
                            continue
                    
                    if len(time_values) > 2 and len(intensity_values) > 2:
                        pearson_r, p_value = stats.pearsonr(time_values, intensity_values)
                        r_squared = r2_score(intensity_values, 
                                           np.poly1d(np.polyfit(time_values, intensity_values, 1))(time_values))
                        
                        results = {
                            'pearson_r': float(pearson_r),
                            'p_value': float(p_value),
                            'r_squared': float(r_squared),
                            'sample_size': len(time_values),
                            'analysis_type': 'time_vs_intensity'
                        }
                        
                        self.correlation_results = results
                        return results
            
            else:
                numeric_cols = self.data.select_dtypes(include=[np.number]).columns
                
                if len(numeric_cols) < 2:
                    return None
                
                a_cols = [col for col in numeric_cols if 'A-' in col or 'a-' in col]
                b_cols = [col for col in numeric_cols if 'B-' in col or 'b-' in col]
                
                results = {}
                
                if a_cols and b_cols:
                    a_mean = self.data[a_cols].mean(axis=1).dropna()
                    b_mean = self.data[b_cols].mean(axis=1).dropna()
                    
                    min_len = min(len(a_mean), len(b_mean))
                    a_mean = a_mean.iloc[:min_len]
                    b_mean = b_mean.iloc[:min_len]
                    
                    if len(a_mean) > 1 and len(b_mean) > 1:
                        pearson_r, p_value = stats.pearsonr(a_mean, b_mean)
                        r_squared = r2_score(a_mean, b_mean) if len(set(b_mean)) > 1 else 0
                        
                        results = {
                            'pearson_r': float(pearson_r),
                            'p_value': float(p_value),
                            'r_squared': float(r_squared),
                            'sample_size': len(a_mean),
                            'analysis_type': 'group_comparison'
                        }
                
                self.correlation_results = results
                return results
            
        except Exception as e:
            print(f"error: {e}")
            return None
    
    def perform_curve_fitting(self):
        if self.data is None:
            return None
        
        try:
            if 'Induction time/h' in self.data.columns:
                row = self.data.iloc[0]
                
                if 'intensity' in str(row.iloc[0]).lower():
                    time_values = []
                    intensity_values = []

                    for col in self.data.columns[1:]:
                        try:
                            time_val = float(col)  
                            intensity_val = float(row[col]) 
                            time_values.append(time_val)
                            intensity_values.append(intensity_val)
                        except (ValueError, TypeError):
                            continue
                    
                    if len(time_values) < 3:
                        return None
                    
                    x = np.array(time_values)
                    y = np.array(intensity_values)
                    
                    def linear_func(x, a, b):
                        return a * x + b
                    
                    def exponential_func(x, a, b, c):
                        return a * np.exp(b * x) + c
                    
                    def saturation_func(x, a, b, c):
                        return a * (1 - np.exp(-b * x)) + c
                    
                    results = {}
                    
                    models = []
                    
                    try:
                        popt_linear, _ = curve_fit(linear_func, x, y)
                        y_pred_linear = linear_func(x, *popt_linear)
                        rmse_linear = np.sqrt(mean_squared_error(y, y_pred_linear))
                        models.append({
                            'name': 'Linear',
                            'parameters': popt_linear.tolist(),
                            'rmse': float(rmse_linear),
                            'equation': f'y = {popt_linear[0]:.3f}x + {popt_linear[1]:.3f}'
                        })
                    except:
                        pass
                    
                    try:
                        p0 = [max(y) - min(y), 0.1, min(y)]
                        popt_sat, _ = curve_fit(saturation_func, x, y, p0=p0, maxfev=2000)
                        y_pred_sat = saturation_func(x, *popt_sat)
                        rmse_sat = np.sqrt(mean_squared_error(y, y_pred_sat))
                        models.append({
                            'name': 'Saturation',
                            'parameters': popt_sat.tolist(),
                            'rmse': float(rmse_sat),
                            'equation': f'y = {popt_sat[0]:.3f}(1-exp(-{popt_sat[1]:.3f}x)) + {popt_sat[2]:.3f}'
                        })
                    except:
                        pass
                    
                    try:
                        popt_exp, _ = curve_fit(exponential_func, x, y, maxfev=2000)
                        y_pred_exp = exponential_func(x, *popt_exp)
                        rmse_exp = np.sqrt(mean_squared_error(y, y_pred_exp))
                        models.append({
                            'name': 'Exponential',
                            'parameters': popt_exp.tolist(),
                            'rmse': float(rmse_exp),
                            'equation': f'y = {popt_exp[0]:.3f}exp({popt_exp[1]:.3f}x) + {popt_exp[2]:.3f}'
                        })
                    except:
                        pass
                    
                    if models:
                        best_model = min(models, key=lambda m: m['rmse'])
                        results = {
                            'best_model': best_model,
                            'all_models': models,
                            'data_points': len(time_values),
                            'model': best_model['name'],
                            'rmse': best_model['rmse'],
                            'equation': best_model['equation']
                        }
                    
                    self.fitting_results = results
                    return results
            
            else:
                numeric_cols = self.data.select_dtypes(include=[np.number]).columns
                
                a_cols = [col for col in numeric_cols if 'A-' in col or 'a-' in col]
                b_cols = [col for col in numeric_cols if 'B-' in col or 'b-' in col]
                
                if not (a_cols and b_cols):
                    return None
                
                a_mean = self.data[a_cols].mean(axis=1).dropna()
                b_mean = self.data[b_cols].mean(axis=1).dropna()
                
                min_len = min(len(a_mean), len(b_mean))
                if min_len < 3:  
                    return None
                
                x = np.array(range(min_len))
                y_a = np.array(a_mean.iloc[:min_len])
                y_b = np.array(b_mean.iloc[:min_len])
                
                def linear_func(x, a, b):
                    return a * x + b
                
                def exponential_func(x, a, b, c):
                    return a * np.exp(b * x) + c
                
                results = {}
                
            
                
                self.fitting_results = results
                return results
            
        except Exception as e:
            print(f"error: {e}")
            return None
    
    def generate_visualization(self):
        if self.data is None:
            return None
        
        try:
            if 'Induction time/h' in self.data.columns:
                fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 12))
                fig.suptitle('pDawn Optogenetic Protein Production Analysis', fontsize=16, fontweight='bold')
                
                row = self.data.iloc[0]
                
                if 'intensity' in str(row.iloc[0]).lower():
                    time_values = []
                    intensity_values = []
                    
                    for col in self.data.columns[1:]:
                        try:
                            time_val = float(col)  
                            intensity_val = float(row[col])  
                            time_values.append(time_val)
                            intensity_values.append(intensity_val)
                        except (ValueError, TypeError):
                            continue
                    
                    if time_values and intensity_values:
                        ax1.plot(time_values, intensity_values, 'bo-', linewidth=3, markersize=8, 
                                label='Fluorescence Intensity', color='#2E86AB')
                        ax1.set_title('Fluorescence Intensity vs Induction Time', fontweight='bold', fontsize=14)
                        ax1.set_xlabel('Induction Time (hours)', fontsize=12)
                        ax1.set_ylabel('Mean Intensity (a.u.)', fontsize=12)
                        ax1.grid(True, alpha=0.3)
                        ax1.legend()
                        
                        fitting_results = self.perform_curve_fitting()
                        if fitting_results and 'best_model' in fitting_results:
                            x_smooth = np.linspace(min(time_values), max(time_values), 100)
                            best_model = fitting_results['best_model']
                            
                            if best_model['name'] == 'Linear':
                                a, b = best_model['parameters']
                                y_smooth = a * x_smooth + b
                            elif best_model['name'] == 'Saturation':
                                a, b, c = best_model['parameters']
                                y_smooth = a * (1 - np.exp(-b * x_smooth)) + c
                            elif best_model['name'] == 'Exponential':
                                a, b, c = best_model['parameters']
                                y_smooth = a * np.exp(b * x_smooth) + c
                            
                            ax1.plot(x_smooth, y_smooth, 'r--', linewidth=2, 
                                   label=f'{best_model["name"]} Fit (RMSE: {best_model["rmse"]:.3f})')
                            ax1.legend()
                        
                        growth_rates = []
                        for i in range(1, len(intensity_values)):
                            if intensity_values[i-1] != 0:
                                rate = ((intensity_values[i] - intensity_values[i-1]) / intensity_values[i-1]) * 100
                                growth_rates.append(rate)
                            else:
                                growth_rates.append(0)
                        
                        if growth_rates:
                            ax2.bar(time_values[1:], growth_rates, 
                                   color=['green' if x > 0 else 'red' for x in growth_rates], 
                                   alpha=0.7, width=0.3)
                            ax2.set_title('Growth Rate Analysis', fontweight='bold', fontsize=14)
                            ax2.set_xlabel('Induction Time (hours)', fontsize=12)
                            ax2.set_ylabel('Growth Rate (%)', fontsize=12)
                            ax2.axhline(y=0, color='black', linestyle='-', alpha=0.5)
                            ax2.grid(True, alpha=0.3)
                        
                        cumulative_growth = [(val / intensity_values[0] - 1) * 100 for val in intensity_values]
                        ax3.plot(time_values, cumulative_growth, 'go-', linewidth=2, markersize=6)
                        ax3.set_title('Cumulative Growth from Baseline', fontweight='bold', fontsize=14)
                        ax3.set_xlabel('Induction Time (hours)', fontsize=12)
                        ax3.set_ylabel('Cumulative Growth (%)', fontsize=12)
                        ax3.grid(True, alpha=0.3)
                        ax3.axhline(y=0, color='black', linestyle='-', alpha=0.5)
                        
                        ax4.hist(intensity_values, bins=min(8, len(intensity_values)), 
                                alpha=0.7, color='skyblue', edgecolor='black')
                        ax4.set_title('Intensity Distribution', fontweight='bold', fontsize=14)
                        ax4.set_xlabel('Intensity (a.u.)', fontsize=12)
                        ax4.set_ylabel('Frequency', fontsize=12)
                        
                        mean_intensity = np.mean(intensity_values)
                        std_intensity = np.std(intensity_values)
                        ax4.axvline(mean_intensity, color='red', linestyle='--', 
                                   label=f'Mean: {mean_intensity:.2f}')
                        ax4.axvline(mean_intensity + std_intensity, color='orange', linestyle=':', 
                                   label=f'±1σ: {std_intensity:.2f}')
                        ax4.axvline(mean_intensity - std_intensity, color='orange', linestyle=':')
                        ax4.legend()
                        ax4.grid(True, alpha=0.3)
            
            else:
                fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 12))
                fig.suptitle('Multi-Group Experimental Analysis', fontsize=16, fontweight='bold')
                
                numeric_cols = self.data.select_dtypes(include=[np.number]).columns
                time_col = self.data.columns[0]
                
            
            plt.tight_layout()
            
            img_buffer = BytesIO()
            plt.savefig(img_buffer, format='png', dpi=300, bbox_inches='tight')
            img_buffer.seek(0)
            plt.close()
            
            return img_buffer
        except Exception as e:
            print(f"error: {e}")
            return None

analyzer = ProteinAnalyzer()

@app.route('/api/protein-upload', methods=['POST'])
def upload_protein_data():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'no file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'no file selected'}), 400
        
        if not file.filename.endswith('.csv'):
            return jsonify({'error': 'please upload CSV file'}), 400
        
        csv_content = file.read().decode('utf-8')
        
        success, message = analyzer.load_data(csv_content)
        
        if success:
            growth_analysis = analyzer.analyze_growth_patterns()
            correlation_analysis = analyzer.perform_correlation_analysis()
            fitting_analysis = analyzer.perform_curve_fitting()
            
            return jsonify({
                'message': message,
                'data_preview': growth_analysis[:5] if growth_analysis else [],
                'total_records': len(growth_analysis) if growth_analysis else 0,
                'correlation': correlation_analysis,
                'fitting': fitting_analysis
            })
        else:
            return jsonify({'error': message}), 400
            
    except Exception as e:
        return jsonify({'error': f'error: {str(e)}'}), 500

@app.route('/api/protein-data', methods=['GET'])
def get_protein_data():
    try:
        if analyzer.data is None:
        if analyzer.data is None:
            sample_data = """Induction time/h,0.0 ,0.5 ,1.0 ,1.5 ,2.0 ,3.0 ,4.0 ,5.0 ,6.0 ,20.0 
Mean intensity (a.u.),0.20 ,7.95 ,10.38 ,11.49 ,12.49 ,13.97 ,15.76 ,17.48 ,17.68 ,18.02 """
            
            analyzer.load_data(sample_data)
            analyzer.analyze_growth_patterns()
        
        growth_data = analyzer.analysis_results.get('growth_patterns', [])
        return jsonify(growth_data)
        
    except Exception as e:
        return jsonify({'error': f'error: {str(e)}'}), 500

@app.route('/api/protein-analysis-chart', methods=['GET'])
def get_analysis_chart():
    try:
        if analyzer.data is None:
        if analyzer.data is None:
            sample_data = """OD600值,A-a-1,A-a-2,A-a-3,B-a-1,B-a-2,B-a-3
2025/8/10 22:00,0.018,0.015,0.014,0.015,0.016,0.016
2025/8/11 22:00,0.014,0.029,0.002,0.026,0.027,0.011
2025/8/12 22:00,0.018,0.020,0.002,0.021,0.032,0.004
2025/8/13 22:00,0.005,0.006,-0.008,0.012,0.019,0.008
2025/8/14 22:00,0.019,0.017,0.005,0.018,0.021,0.011
2025/8/15 22:00,0.012,0.013,-0.006,0.011,0.024,0.010
2025/8/16 22:00,0.015,0.018,0.003,0.012,0.022,0.008"""
            analyzer.load_data(sample_data)
        
        img_buffer = analyzer.generate_visualization()
        
        if img_buffer:
            img_buffer.seek(0)
            return send_file(img_buffer, mimetype='image/png')
        else:
            return jsonify({'error': 'error: failed to generate chart'}), 500
            
    except Exception as e:
        return jsonify({'error': f'error: failed to generate chart: {str(e)}'}), 500

@app.route('/api/protein-chat', methods=['POST'])
def protein_chat():
    try:
        data = request.get_json()
        message = data.get('message', '')
        context = data.get('context', {})
        message_lower = message.lower()
        #...
        
        
@app.route('/api/protein-correlation', methods=['GET'])
def get_correlation_analysis():
    
    try:
        if analyzer.data is None:
            sample_data = """Induction time/h,0.0 ,0.5 ,1.0 ,1.5 ,2.0 ,3.0 ,4.0 ,5.0 ,6.0 ,20.0 
Mean intensity (a.u.),0.20 ,7.95 ,10.38 ,11.49 ,12.49 ,13.97 ,15.76 ,17.48 ,17.68 ,18.02 """
            analyzer.load_data(sample_data)
            analyzer.perform_correlation_analysis()
        
        correlation_data = analyzer.correlation_results
        return jsonify(correlation_data)
        
    except Exception as e:
        return jsonify({'error': f'error: failed to get correlation analysis: {str(e)}'}), 500

@app.route('/api/protein-fitting', methods=['GET'])
def get_fitting_results():
    try:
        if analyzer.data is None:
            sample_data = """Induction time/h,0.0 ,0.5 ,1.0 ,1.5 ,2.0 ,3.0 ,4.0 ,5.0 ,6.0 ,20.0 
Mean intensity (a.u.),0.20 ,7.95 ,10.38 ,11.49 ,12.49 ,13.97 ,15.76 ,17.48 ,17.68 ,18.02 """
            analyzer.load_data(sample_data)
            analyzer.perform_curve_fitting()
        
        fitting_data = analyzer.fitting_results
        return jsonify(fitting_data)
        
    except Exception as e:
        return jsonify({'error': f'error: failed to get fitting results: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5700, debug=True)
