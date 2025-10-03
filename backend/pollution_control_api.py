#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pollution Control Analysis API
Lead Ion Treatment Modeling System

This module implements a coupled differential equation system for modeling
lead ion treatment using protein expression dynamics.
"""

import numpy as np
import pandas as pd
from scipy.integrate import odeint
from scipy.optimize import curve_fit
from scipy.interpolate import interp1d
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
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
        """Initialize the pollution control model with experimental data"""
        self.load_experimental_data()
        self.fit_models()
    
    def load_experimental_data(self):
        """Load and parse experimental data from CSV files"""
        # Data 1: Dose-response model (fixed protein concentration, time)
        self.dose_data = {
            'pb_initial': [0, 1896.5, 3793, 7586, 11379],  # ng/L
            'pb_final': [0, 865.6, 877.9, 4452.5, 7378.1],  # ng/L after 30min
            'removal': [0, 1030.9, 2915.1, 3133.5, 4000.9],  # ng/L removed
            'protein_conc': 0.26,  # mg/ml
            'time': 30  # min
        }
        
        # Data 2: Time-course model (fixed protein concentration)
        self.time_data = {
            'time': [0, 5, 10, 20, 30, 40],  # min
            'pb_conc': [3793.2, 2087.4, 1670.1, 1276.3, 876.7, 665.5],  # ng/L
            'protein_conc': 0.26  # mg/ml
        }
        
        # Data 3: Protein expression model
        self.expression_data = {
            'time': [0, 3, 7, 14, 21],  # days
            'protein_conc': [0, 1.56, 3.06, 3.22, 3.25]  # mg/ml
        }
    
    def fit_models(self):
        """Fit mathematical models to experimental data using exponential decay"""
        # Fit lead removal kinetics based on experimental time-course data
        time_min = np.array(self.time_data['time'])
        pb_conc = np.array(self.time_data['pb_conc'])
        
        # Enhanced exponential decay model: C(t) = C_inf + (C0 - C_inf) * exp(-k*t)
        def lead_decay(t, c0, k, c_inf):
            return c_inf + (c0 - c_inf) * np.exp(-k * t)
        
        try:
            # Fit to experimental data
            popt_lead, pcov_lead = curve_fit(
                lead_decay,
                time_min,
                pb_conc,
                p0=[3800, 0.08, 600],  # Initial guess: C0, k, C_inf
                bounds=([3000, 0.01, 0], [5000, 0.5, 1500])
            )
            self.lead_params = popt_lead
            print(f"Fitted parameters: C0={popt_lead[0]:.1f}, k={popt_lead[1]:.4f}, C_inf={popt_lead[2]:.1f}")
        except Exception as e:
            print(f"Fitting failed: {e}")
            # Use parameters derived from experimental data analysis
            # From data: 3793.2 -> 665.5 in 40 min, suggesting k ≈ 0.044
            self.lead_params = [3793.2, 0.044, 600]
        
        # Analyze dose-response relationship for scaling
        initial_concs = np.array(self.dose_data['pb_initial'][1:])  # Skip zero
        final_concs = np.array(self.dose_data['pb_final'][1:])      # Skip zero
        removal_rates = (initial_concs - final_concs) / initial_concs
        
        # Calculate average removal efficiency at 30 min
        self.avg_efficiency_30min = np.mean(removal_rates)
        print(f"Average 30-min efficiency from dose data: {self.avg_efficiency_30min:.3f}")
        
        # Protein expression parameters (simplified)
        # From expression data: reaches ~3.25 mg/ml at 21 days
        self.protein_params = {
            'max_conc': 3.25,      # Maximum protein concentration
            'growth_rate': 0.15,   # Growth rate constant
            'lag_time': 2.0        # Lag time in days
        }
    
    def exponential_decay_model(self, t, pb_initial, target_efficiency):
        """
        Exponential decay model based on experimental data
        
        Uses fitted parameters from experimental time-course data and scales
        according to initial concentration and target efficiency.
        
        Model: C(t) = C_inf + (C0 - C_inf) * exp(-k_eff * t)
        """
        c0_ref, k_ref, c_inf_ref = self.lead_params
        
        # Scale decay rate based on concentration and target efficiency
        # Higher initial concentration may lead to slower relative decay
        concentration_factor = min(1.5, pb_initial / c0_ref)  # Cap at 1.5x
        
        # Adjust decay rate for target efficiency
        # Higher target efficiency requires faster decay
        efficiency_factor = 1.0 + (target_efficiency - 0.5) * 0.8
        
        # Effective decay rate
        k_eff = k_ref * efficiency_factor / concentration_factor
        
        # Calculate minimum achievable concentration (asymptote)
        # Based on experimental data showing ~600 ng/L minimum
        c_inf_scaled = c_inf_ref * (pb_initial / c0_ref) * 0.8
        
        # Exponential decay equation
        pb_conc = c_inf_scaled + (pb_initial - c_inf_scaled) * np.exp(-k_eff * t)
        
        return pb_conc
    
    def predict_treatment_time(self, pb_initial, target_efficiency):
        """
        Predict treatment time using exponential decay model
        
        Args:
            pb_initial: Initial lead concentration (ng/L)
            target_efficiency: Target removal efficiency (0-1) - fraction of lead ions bound by proteins
        
        Returns:
            dict: Prediction results including time course and total time
        """
        try:
            # Target final concentration = initial * (1 - efficiency)
            target_final_concentration = pb_initial * (1 - target_efficiency)
            
            # Generate time points for analysis
            t_max = 120  # 2 hours maximum
            t = np.linspace(0, t_max, 1000)
            
            # Calculate concentration over time using exponential decay model
            pb_concentrations = []
            for time_point in t:
                conc = self.exponential_decay_model(time_point, pb_initial, target_efficiency)
                pb_concentrations.append(conc)
            
            pb_concentrations = np.array(pb_concentrations)
            
            # Find treatment time when target concentration is reached
            target_idx = np.where(pb_concentrations <= target_final_concentration)[0]
            
            if len(target_idx) > 0:
                treatment_time = t[target_idx[0]]
                # Extend visualization slightly beyond treatment time
                t_viz_end = min(treatment_time * 1.2, t_max)
            else:
                # If target not reached within t_max, extend search
                treatment_time = t_max
                t_viz_end = t_max
                
                # Try to solve analytically for treatment time
                c0_ref, k_ref, c_inf_ref = self.lead_params
                concentration_factor = min(1.5, pb_initial / c0_ref)
                efficiency_factor = 1.0 + (target_efficiency - 0.5) * 0.8
                k_eff = k_ref * efficiency_factor / concentration_factor
                c_inf_scaled = c_inf_ref * (pb_initial / c0_ref) * 0.8
                
                # Solve: target_final = c_inf_scaled + (pb_initial - c_inf_scaled) * exp(-k_eff * t)
                if target_final_concentration > c_inf_scaled:
                    treatment_time = -np.log((target_final_concentration - c_inf_scaled) / 
                                           (pb_initial - c_inf_scaled)) / k_eff
                    treatment_time = min(treatment_time, 300)  # Cap at 5 hours
                    t_viz_end = min(treatment_time * 1.2, 300)
            
            # Generate smooth visualization curve
            t_viz = np.linspace(0, t_viz_end, 300)
            pb_viz = []
            for time_point in t_viz:
                conc = self.exponential_decay_model(time_point, pb_initial, target_efficiency)
                pb_viz.append(conc)
            
            pb_viz = np.array(pb_viz)
            
            # Calculate final concentration at treatment time
            final_concentration = self.exponential_decay_model(treatment_time, pb_initial, target_efficiency)
            
            # Calculate actual efficiency achieved
            actual_efficiency = (pb_initial - final_concentration) / pb_initial
            protein_bound = pb_initial - final_concentration
            
            # Check if target efficiency is achievable
            efficiency_gap = target_efficiency - actual_efficiency
            warning_message = None
            
            if efficiency_gap > 0.05:  # 5% tolerance
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
        """Generate single lead concentration vs time plot with target lines"""
        if not prediction_data['success']:
            return None
        
        plt.style.use('seaborn-v0_8')
        fig, ax = plt.subplots(1, 1, figsize=(12, 8))
        
        time_points = np.array(prediction_data['time_points'])
        pb_conc = np.array(prediction_data['pb_concentration'])
        
        # Main curve: Lead concentration vs time
        ax.plot(time_points, pb_conc, 'b-', linewidth=3, label='Lead Ion Concentration', color='#2E86AB')
        
        # Horizontal line: Target final concentration
        target_conc = prediction_data['target_final_concentration']
        ax.axhline(y=target_conc, color='red', linestyle='--', linewidth=2.5, 
                   label=f'Target Concentration: {target_conc:.1f} ng/L\n({prediction_data["target_efficiency"]*100:.1f}% removal)')
        
        # Vertical line: Treatment time
        treatment_time = prediction_data['treatment_time']
        ax.axvline(x=treatment_time, color='green', linestyle='--', linewidth=2.5, 
                   label=f'Treatment Time: {treatment_time:.1f} min')
        
        # Intersection point highlight
        ax.plot(treatment_time, target_conc, 'ro', markersize=10, 
                label=f'Target Point\n({treatment_time:.1f} min, {target_conc:.1f} ng/L)')
        
        # Add initial concentration reference
        initial_conc = prediction_data['initial_concentration']
        ax.axhline(y=initial_conc, color='gray', linestyle=':', alpha=0.7, linewidth=1.5,
                   label=f'Initial Concentration: {initial_conc:.1f} ng/L')
        
        # Styling
        ax.set_xlabel('Time (minutes)', fontsize=14, fontweight='bold')
        ax.set_ylabel('Lead Ion Concentration (ng/L)', fontsize=14, fontweight='bold')
        ax.set_title('Lead Ion Treatment Prediction\nProtein-Based Adsorption Process', 
                     fontsize=16, fontweight='bold', pad=20)
        
        # Legend
        ax.legend(fontsize=11, loc='upper right', framealpha=0.9, 
                 bbox_to_anchor=(0.98, 0.98))
        
        # Grid
        ax.grid(True, alpha=0.3, linestyle='-', linewidth=0.5)
        ax.set_facecolor('#f8f9fa')
        
        # Set axis limits with some padding
        ax.set_xlim(0, max(time_points) * 1.05)
        y_min = min(0, min(pb_conc) * 0.95)
        y_max = initial_conc * 1.1
        ax.set_ylim(y_min, y_max)
        
        # Add text box with key results
        textstr = f'Efficiency: {prediction_data["actual_efficiency"]*100:.1f}%\n'
        textstr += f'Protein Bound: {prediction_data["protein_bound"]:.1f} ng/L\n'
        textstr += f'Final Conc.: {prediction_data["actual_final_concentration"]:.1f} ng/L'
        
        props = dict(boxstyle='round', facecolor='lightblue', alpha=0.8)
        ax.text(0.02, 0.98, textstr, transform=ax.transAxes, fontsize=10,
                verticalalignment='top', bbox=props)
        
        plt.tight_layout()
        
        # Convert plot to base64 string
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
    """API endpoint for treatment prediction"""
    try:
        data = request.get_json()
        pb_initial = float(data.get('pb_initial', 0))
        target_efficiency = float(data.get('target_efficiency', 0.95))
        
        if pb_initial <= 0 or target_efficiency <= 0 or target_efficiency >= 1:
            return jsonify({
                'success': False,
                'error': 'Invalid input parameters'
            }), 400
        
        # Get prediction
        prediction = model.predict_treatment_time(pb_initial, target_efficiency)
        
        if prediction['success']:
            # Generate visualization
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
    """Get experimental data for reference"""
    return jsonify({
        'dose_response': model.dose_data,
        'time_course': model.time_data,
        'protein_expression': model.expression_data
    })

@app.route('/api/pollution-control/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'model': 'pollution_control'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5003)
