import numpy as np
import pandas as pd
from scipy.integrate import odeint
from scipy.optimize import curve_fit
from scipy.interpolate import interp1d
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  
import io
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

class PollutionControlModel:
    def __init__(self):
        
        self.load_experimental_data()
        self.fit_models()
    
    def load_experimental_data(self):
        self.dose_data = {
            'pb_initial': [0, 1896.5, 3793, 7586, 11379],  
            'pb_final': [0, 865.6, 877.9, 4452.5, 7378.1],  
            'removal': [0, 1030.9, 2915.1, 3133.5, 4000.9],  
            'protein_conc': 0.26,  
            'time': 30  
        }
        
        self.time_data = {
            'time': [0, 5, 10, 20, 30, 40],  
            'pb_conc': [3793.2, 2087.4, 1670.1, 1276.3, 876.7, 665.5],  
            'protein_conc': 0.26  
        }
        
        self.expression_data = {
            'time': [0, 3, 7, 14, 21],  
            'protein_conc': [0, 1.56, 3.06, 3.22, 3.25]  
        }
    
    def fit_models(self):
        time_min = np.array(self.time_data['time'])
        pb_conc = np.array(self.time_data['pb_conc'])
        
        def lead_decay(t, c0, k, c_inf):
            return c_inf + (c0 - c_inf) * np.exp(-k * t)
        
        try:
            popt_lead, pcov_lead = curve_fit(
                lead_decay,
                time_min,
                pb_conc,
                p0=[3800, 0.08, 600],  
                bounds=([3000, 0.01, 0], [5000, 0.5, 1500])
            )
            self.lead_params = popt_lead
            print(f"Fitted parameters: C0={popt_lead[0]:.1f}, k={popt_lead[1]:.4f}, C_inf={popt_lead[2]:.1f}")
        except Exception as e:
            print(f"Fitting failed: {e}")
            self.lead_params = [3793.2, 0.044, 600]
        
        initial_concs = np.array(self.dose_data['pb_initial'][1:])  
        final_concs = np.array(self.dose_data['pb_final'][1:])      
        removal_rates = (initial_concs - final_concs) / initial_concs
        
        self.avg_efficiency_30min = np.mean(removal_rates)
        print(f"Average 30-min efficiency from dose data: {self.avg_efficiency_30min:.3f}")
        
        self.protein_params = {
            'max_conc': 3.25,      
            'growth_rate': 0.15,   
            'lag_time': 2.0        
        }
    
    def exponential_decay_model(self, t, pb_initial, target_efficiency):
        c0_ref, k_ref, c_inf_ref = self.lead_params
        
        concentration_factor = min(1.5, pb_initial / c0_ref)  
        
        efficiency_factor = 1.0 + (target_efficiency - 0.5) * 0.8
        
        k_eff = k_ref * efficiency_factor / concentration_factor
        
        c_inf_scaled = c_inf_ref * (pb_initial / c0_ref) * 0.8
        
        pb_conc = c_inf_scaled + (pb_initial - c_inf_scaled) * np.exp(-k_eff * t)
        
        return pb_conc
    
    def predict_treatment_time(self, pb_initial, target_efficiency):
        
        try:
            target_final_concentration = pb_initial * (1 - target_efficiency)
            
            t_max = 120  
            t = np.linspace(0, t_max, 1000)
            
            pb_concentrations = []
            for time_point in t:
                conc = self.exponential_decay_model(time_point, pb_initial, target_efficiency)
                pb_concentrations.append(conc)
            
            pb_concentrations = np.array(pb_concentrations)
            
            target_idx = np.where(pb_concentrations <= target_final_concentration)[0]
            
            if len(target_idx) > 0:
                treatment_time = t[target_idx[0]]
                t_viz_end = min(treatment_time * 1.2, t_max)
            else:
                treatment_time = t_max
                t_viz_end = t_max
                
                c0_ref, k_ref, c_inf_ref = self.lead_params
                concentration_factor = min(1.5, pb_initial / c0_ref)
                efficiency_factor = 1.0 + (target_efficiency - 0.5) * 0.8
                k_eff = k_ref * efficiency_factor / concentration_factor
                c_inf_scaled = c_inf_ref * (pb_initial / c0_ref) * 0.8
                
                if target_final_concentration > c_inf_scaled:
                    treatment_time = -np.log((target_final_concentration - c_inf_scaled) / 
                                           (pb_initial - c_inf_scaled)) / k_eff
                    treatment_time = min(treatment_time, 300)  
                    t_viz_end = min(treatment_time * 1.2, 300)
            
            t_viz = np.linspace(0, t_viz_end, 300)
            pb_viz = []
            for time_point in t_viz:
                conc = self.exponential_decay_model(time_point, pb_initial, target_efficiency)
                pb_viz.append(conc)
            
            pb_viz = np.array(pb_viz)
            
            final_concentration = self.exponential_decay_model(treatment_time, pb_initial, target_efficiency)
            
            actual_efficiency = (pb_initial - final_concentration) / pb_initial
            protein_bound = pb_initial - final_concentration
            
            efficiency_gap = target_efficiency - actual_efficiency
            warning_message = None
            
            if efficiency_gap > 0.05:  
                if actual_efficiency < 0.5:
                    warning_message = f"Target efficiency ({target_efficiency*100:.1f}%) is significantly higher than achievable ({actual_efficiency*100:.1f}%). Consider increasing initial protein concentration or extending treatment time."
                elif actual_efficiency < 0.8:
                    warning_message = f"Target efficiency ({target_efficiency*100:.1f}%) may require longer treatment time. Current model predicts {actual_efficiency*100:.1f}% efficiency."
                else:
                    warning_message = f"Target efficiency ({target_efficiency*100:.1f}%) is close but not fully achievable. Actual: {actual_efficiency*100:.1f}%. Consider slight adjustment of parameters."
            
            return {
                'success': True,
                'treatment_time': float(treatment_time),
                'time_points': t_viz.tolist(),
                'pb_concentration': pb_viz.tolist(),
                'target_efficiency': target_efficiency,
                'actual_efficiency': float(actual_efficiency),
                'initial_concentration': pb_initial,
                'target_final_concentration': float(target_final_concentration),
                'actual_final_concentration': float(final_concentration),
                'protein_bound': float(protein_bound),
                'efficiency_gap': float(efficiency_gap),
                'warning_message': warning_message,
                'model_params': {
                    'k_effective': float(self.lead_params[1] * (1.0 + (target_efficiency - 0.5) * 0.8) / 
                                       min(1.5, pb_initial / self.lead_params[0])),
                    'c_infinity': float(self.lead_params[2] * (pb_initial / self.lead_params[0]) * 0.8)
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'treatment_time': None
            }
    
    def generate_visualization(self, prediction_data):
        if not prediction_data['success']:
            return None
        
        plt.style.use('seaborn-v0_8')
        fig, ax = plt.subplots(1, 1, figsize=(12, 8))
        
        time_points = np.array(prediction_data['time_points'])
        pb_conc = np.array(prediction_data['pb_concentration'])
        
        ax.plot(time_points, pb_conc, 'b-', linewidth=3, label='Lead Ion Concentration', color='#2E86AB')
        
        target_conc = prediction_data['target_final_concentration']
        ax.axhline(y=target_conc, color='red', linestyle='--', linewidth=2.5, 
                   label=f'Target Concentration: {target_conc:.1f} ng/L\n({prediction_data["target_efficiency"]*100:.1f}% removal)')
        
        treatment_time = prediction_data['treatment_time']
        ax.axvline(x=treatment_time, color='green', linestyle='--', linewidth=2.5, 
                   label=f'Treatment Time: {treatment_time:.1f} min')
        
        ax.plot(treatment_time, target_conc, 'ro', markersize=10, 
                label=f'Target Point\n({treatment_time:.1f} min, {target_conc:.1f} ng/L)')
        
        initial_conc = prediction_data['initial_concentration']
        ax.axhline(y=initial_conc, color='gray', linestyle=':', alpha=0.7, linewidth=1.5,
                   label=f'Initial Concentration: {initial_conc:.1f} ng/L')
        
        ax.set_xlabel('Time (minutes)', fontsize=14, fontweight='bold')
        ax.set_ylabel('Lead Ion Concentration (ng/L)', fontsize=14, fontweight='bold')
        ax.set_title('Lead Ion Treatment Prediction\nProtein-Based Adsorption Process', 
                     fontsize=16, fontweight='bold', pad=20)
        
        ax.legend(fontsize=11, loc='upper right', framealpha=0.9, 
                 bbox_to_anchor=(0.98, 0.98))
        
        ax.grid(True, alpha=0.3, linestyle='-', linewidth=0.5)
        ax.set_facecolor('#f8f9fa')
        
        ax.set_xlim(0, max(time_points) * 1.05)
        y_min = min(0, min(pb_conc) * 0.95)
        y_max = initial_conc * 1.1
        ax.set_ylim(y_min, y_max)
        
        textstr = f'Efficiency: {prediction_data["actual_efficiency"]*100:.1f}%\n'
        textstr += f'Protein Bound: {prediction_data["protein_bound"]:.1f} ng/L\n'
        textstr += f'Final Conc.: {prediction_data["actual_final_concentration"]:.1f} ng/L'
        
        props = dict(boxstyle='round', facecolor='lightblue', alpha=0.8)
        ax.text(0.02, 0.98, textstr, transform=ax.transAxes, fontsize=10,
                verticalalignment='top', bbox=props)
        
        plt.tight_layout()
        
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=300, bbox_inches='tight', 
                   facecolor='white', edgecolor='none')
        img_buffer.seek(0)
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        plt.close()
        
        return img_base64

# Initialize model
model = PollutionControlModel()

@app.route('/api/pollution-control/predict', methods=['POST'])
def predict_treatment():
    try:
        data = request.get_json()
        pb_initial = float(data.get('pb_initial', 0))
        target_efficiency = float(data.get('target_efficiency', 0.95))
        
        if pb_initial <= 0 or target_efficiency <= 0 or target_efficiency >= 1:
            return jsonify({
                'success': False,
                'error': 'Invalid input parameters'
            }), 400
        
        prediction = model.predict_treatment_time(pb_initial, target_efficiency)
        
        if prediction['success']:
            plot_base64 = model.generate_visualization(prediction)
            prediction['plot'] = plot_base64
        
        return jsonify(prediction)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/pollution-control/experimental-data', methods=['GET'])
def get_experimental_data():
    return jsonify({
        'dose_response': model.dose_data,
        'time_course': model.time_data,
        'protein_expression': model.expression_data
    })

@app.route('/api/pollution-control/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'model': 'pollution_control'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5003)
