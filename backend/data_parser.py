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
    if '处理剂量模型' in str(df.iloc[dosage_row_start, 0]):
        original_pb = []
        added_pb = []
        treated_pb = []
        difference = []
        
        for col in range(1, 8):  # 列1-7
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
            'protein_concentration': 0.26,  # mg/ml
            'treatment_time': 30  # min
        }
    
    # 解析处理时间模型 (行8-10)
    time_row_start = 8
    if '处理时间模型' in str(df.iloc[time_row_start, 0]):
        time_points = []
        pb_concentrations = []
        
        for col in range(1, 8):
            try:
                if pd.notna(df.iloc[9, col]) and df.iloc[9, col] != 0:  # 时间
                    time_points.append(float(df.iloc[9, col]))
                if pd.notna(df.iloc[10, col]) and df.iloc[10, col] != 0:  # 醋酸铅量
                    pb_concentrations.append(float(df.iloc[10, col]))
            except (ValueError, TypeError):
                continue
        
        data['time_model'] = {
            'time_points': time_points,
            'pb_concentrations': pb_concentrations,
            'protein_concentration': 0.26  # mg/ml
        }
    
    # 解析蛋白表达量-时间模型 (行14-15)
    protein_row_start = 14
    if 'PbrD表达量-时间模型' in str(df.iloc[protein_row_start, 0]):
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
    # 测试数据解析
    data = parse_pollution_data('../polludata.xlsx')
    
    print("=== 处理剂量模型 ===")
    print(f"原始Pb浓度: {data['dosage_model']['original_pb_concentration']}")
    print(f"添加Pb量: {data['dosage_model']['added_pb_amount']}")
    print(f"处理后Pb量: {data['dosage_model']['treated_pb_amount']}")
    print(f"差值: {data['dosage_model']['difference']}")
    
    print("\n=== 处理时间模型 ===")
    print(f"时间点: {data['time_model']['time_points']}")
    print(f"Pb浓度: {data['time_model']['pb_concentrations']}")
    
    print("\n=== 蛋白表达量-时间模型 ===")
    print(f"时间点: {data['protein_expression']['time_points']}")
    print(f"蛋白浓度: {data['protein_expression']['protein_concentrations']}")
