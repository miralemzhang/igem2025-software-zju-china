import pandas as pd
import numpy as np
from typing import Dict, List, Tuple

def parse_pollution_data(file_path: str) -> Dict:
    df = pd.read_excel(file_path, sheet_name='Sheet1', header=None)
    
    data = {
        'dosage_model': {},      
        'time_model': {},       
        'protein_expression': {} 
    }
    
    dosage_row_start = 0
    if 'dosage_model' in str(df.iloc[dosage_row_start, 0]):
        original_pb = []
        added_pb = []
        treated_pb = []
        difference = []
        
        for col in range(1, 8):  
            try:
                if pd.notna(df.iloc[1, col]) and df.iloc[1, col] != 0:  
                    original_pb.append(float(df.iloc[1, col]))
                if pd.notna(df.iloc[2, col]) and df.iloc[2, col] != 0:  
                    added_pb.append(float(df.iloc[2, col]))
                if pd.notna(df.iloc[3, col]) and df.iloc[3, col] != 0:  
                    treated_pb.append(float(df.iloc[3, col]))
                if pd.notna(df.iloc[4, col]) and df.iloc[4, col] != 0:  
                    difference.append(float(df.iloc[4, col]))
            except (ValueError, TypeError):
                continue
        
        data['dosage_model'] = {
            'original_pb_concentration': original_pb,
            'added_pb_amount': added_pb,
            'treated_pb_amount': treated_pb,
            'difference': difference,
            'protein_concentration': 0.26,  
            'treatment_time': 30  #
        }
    
    
    time_row_start = 8
    if 'time_model' in str(df.iloc[time_row_start, 0]):
        time_points = []
        pb_concentrations = []
        
        for col in range(1, 8):
            try:
                if pd.notna(df.iloc[9, col]) and df.iloc[9, col] != 0:  
                    time_points.append(float(df.iloc[9, col]))
                if pd.notna(df.iloc[10, col]) and df.iloc[10, col] != 0:  
                    pb_concentrations.append(float(df.iloc[10, col]))
            except (ValueError, TypeError):
                continue
        
        data['time_model'] = {
            'time_points': time_points,
            'pb_concentrations': pb_concentrations,
            'protein_concentration': 0.26  
        }
    

    protein_row_start = 14
    if 'protein_expression' in str(df.iloc[protein_row_start, 0]):
        time_points = []
        protein_concentrations = []
        
        for col in range(1, 8):
            try:
                if pd.notna(df.iloc[14, col]) and df.iloc[14, col] != 0:
                    time_points.append(float(df.iloc[14, col]))
                if pd.notna(df.iloc[15, col]) and df.iloc[15, col] != 0:
                    protein_concentrations.append(float(df.iloc[15, col]))
            except (ValueError, TypeError):
                continue
        
        data['protein_expression'] = {
            'time_points': time_points,
            'protein_concentrations': protein_concentrations
        }
    
    return data

if __name__ == "__main__":
    data = parse_pollution_data('../polludata.xlsx')
    
    print("=== dosage_model ===")
    print(f"original_pb_concentration: {data['dosage_model']['original_pb_concentration']}")
    print(f"added_pb_amount: {data['dosage_model']['added_pb_amount']}")
    print(f"treated_pb_amount: {data['dosage_model']['treated_pb_amount']}")
    print(f"difference: {data['dosage_model']['difference']}")
    
    print("\n=== time_model ===")
    print(f"time_points: {data['time_model']['time_points']}")
    print(f"pb_concentrations: {data['time_model']['pb_concentrations']}")
    
    print("\n=== protein_expression ===")
    print(f"time_points: {data['protein_expression']['time_points']}")
    print(f"protein_concentrations: {data['protein_expression']['protein_concentrations']}")
