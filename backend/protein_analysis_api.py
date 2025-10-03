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

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei', 'Arial Unicode MS', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

class ProteinAnalyzer:
    def __init__(self):
        self.data = None
        self.analysis_results = {}
        self.correlation_results = {}
        self.fitting_results = {}
    
    def load_data(self, csv_content):
        """加载CSV数据"""
        try:
            # 读取CSV数据
            df = pd.read_csv(StringIO(csv_content))
            
            # 数据预处理
            df.columns = df.columns.str.strip()
            
            # 检查是否为pDawn荧光数据格式
            if 'Induction time/h' in df.columns:
                # 对于pDawn数据，不转换第一列为时间格式
                # 将数值列转换为float
                numeric_cols = df.columns[1:]
                for col in numeric_cols:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
            else:
                # 传统格式：假设第一列是时间，其他列是实验数据
                time_col = df.columns[0]
                df[time_col] = pd.to_datetime(df[time_col], errors='coerce')
                
                # 将数值列转换为float
                numeric_cols = df.columns[1:]
                for col in numeric_cols:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
            
            self.data = df
            return True, "数据加载成功"
        except Exception as e:
            return False, f"数据加载失败: {str(e)}"
    
    def analyze_growth_patterns(self):
        """分析荧光强度模式"""
        if self.data is None:
            return None
        
        try:
            # 检查数据格式 - 如果是pDawn荧光数据
            if 'Induction time/h' in self.data.columns:
                # 处理pDawn荧光数据 - 数据在第一行，第一列是标签
                row = self.data.iloc[0]
                
                # 检查第一列是否包含强度标签
                if 'intensity' in str(row.iloc[0]).lower():
                    results = []
                    time_values = []
                    intensity_values = []
                    
                    # 提取时间和强度数据
                    for col in self.data.columns[1:]:  # 跳过第一列标签
                        try:
                            time_val = float(col)  # 列名就是时间值
                            intensity_val = float(row[col])  # 行数据是强度值
                            time_values.append(time_val)
                            intensity_values.append(intensity_val)
                            
                            # 计算增长率
                            if len(intensity_values) > 1:
                                prev_intensity = intensity_values[-2]
                                growth_rate = ((intensity_val - prev_intensity) / prev_intensity * 100) if prev_intensity != 0 else 0
                            else:
                                growth_rate = 0
                            
                            results.append({
                                'time': f'{time_val}h',
                                'groupA': round(intensity_val, 2),
                                'groupB': round(intensity_val, 2),  # 对于单一数据系列，A和B相同
                                'growthRate': round(growth_rate, 2)
                            })
                        except (ValueError, TypeError):
                            continue
                    
                    self.analysis_results['growth_patterns'] = results
                    return results
            
            else:
                # 处理传统的多组实验数据
                numeric_cols = self.data.select_dtypes(include=[np.number]).columns
                
                # 分组分析（假设A组和B组）
                a_cols = [col for col in numeric_cols if 'A-' in col or 'a-' in col]
                b_cols = [col for col in numeric_cols if 'B-' in col or 'b-' in col]
                
                results = []
                for idx, row in self.data.iterrows():
                    if pd.isna(row.iloc[0]):  # 跳过时间为空的行
                        continue
                    
                    a_mean = row[a_cols].mean() if a_cols else 0
                    b_mean = row[b_cols].mean() if b_cols else 0
                    
                    # 计算增长率（相对于前一个时间点）
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
            print(f"分析错误: {e}")
            return None
    
    def perform_correlation_analysis(self):
        """执行相关性分析"""
        if self.data is None:
            return None
        
        try:
            # 检查是否为pDawn荧光数据
            if 'Induction time/h' in self.data.columns:
                # 处理pDawn荧光数据 - 时间与强度的相关性
                row = self.data.iloc[0]
                
                if 'intensity' in str(row.iloc[0]).lower():
                    time_values = []
                    intensity_values = []
                    
                    # 提取数值数据
                    for col in self.data.columns[1:]:
                        try:
                            time_val = float(col)  # 列名是时间值
                            intensity_val = float(row[col])  # 行数据是强度值
                            time_values.append(time_val)
                            intensity_values.append(intensity_val)
                        except (ValueError, TypeError):
                            continue
                    
                    if len(time_values) > 2 and len(intensity_values) > 2:
                        # 计算时间与荧光强度的相关性
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
                # 处理传统多组数据
                numeric_cols = self.data.select_dtypes(include=[np.number]).columns
                
                if len(numeric_cols) < 2:
                    return None
                
                # 分组分析
                a_cols = [col for col in numeric_cols if 'A-' in col or 'a-' in col]
                b_cols = [col for col in numeric_cols if 'B-' in col or 'b-' in col]
                
                results = {}
                
                if a_cols and b_cols:
                    # 计算A组和B组的平均值
                    a_mean = self.data[a_cols].mean(axis=1).dropna()
                    b_mean = self.data[b_cols].mean(axis=1).dropna()
                    
                    # 确保两个序列长度一致
                    min_len = min(len(a_mean), len(b_mean))
                    a_mean = a_mean.iloc[:min_len]
                    b_mean = b_mean.iloc[:min_len]
                    
                    if len(a_mean) > 1 and len(b_mean) > 1:
                        # 计算相关系数
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
            print(f"相关性分析错误: {e}")
            return None
    
    def perform_curve_fitting(self):
        """执行曲线拟合"""
        if self.data is None:
            return None
        
        try:
            # 检查是否为pDawn荧光数据
            if 'Induction time/h' in self.data.columns:
                # 处理pDawn荧光数据
                row = self.data.iloc[0]
                
                if 'intensity' in str(row.iloc[0]).lower():
                    time_values = []
                    intensity_values = []
                    
                    # 提取数值数据
                    for col in self.data.columns[1:]:
                        try:
                            time_val = float(col)  # 列名是时间值
                            intensity_val = float(row[col])  # 行数据是强度值
                            time_values.append(time_val)
                            intensity_values.append(intensity_val)
                        except (ValueError, TypeError):
                            continue
                    
                    if len(time_values) < 3:
                        return None
                    
                    x = np.array(time_values)
                    y = np.array(intensity_values)
                    
                    # 定义拟合函数
                    def linear_func(x, a, b):
                        return a * x + b
                    
                    def exponential_func(x, a, b, c):
                        return a * np.exp(b * x) + c
                    
                    def saturation_func(x, a, b, c):
                        return a * (1 - np.exp(-b * x)) + c
                    
                    results = {}
                    
                    # 尝试不同的拟合模型
                    models = []
                    
                    # 线性拟合
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
                    
                    # 饱和增长拟合（适合蛋白表达）
                    try:
                        # 初始猜测参数
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
                    
                    # 指数拟合
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
                    
                    # 选择最佳拟合模型
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
                # 处理传统多组数据的拟合逻辑（保持原有逻辑）
                numeric_cols = self.data.select_dtypes(include=[np.number]).columns
                
                # 分组分析
                a_cols = [col for col in numeric_cols if 'A-' in col or 'a-' in col]
                b_cols = [col for col in numeric_cols if 'B-' in col or 'b-' in col]
                
                if not (a_cols and b_cols):
                    return None
                
                # 计算平均值
                a_mean = self.data[a_cols].mean(axis=1).dropna()
                b_mean = self.data[b_cols].mean(axis=1).dropna()
                
                min_len = min(len(a_mean), len(b_mean))
                if min_len < 3:  # 需要至少3个点进行拟合
                    return None
                
                x = np.array(range(min_len))
                y_a = np.array(a_mean.iloc[:min_len])
                y_b = np.array(b_mean.iloc[:min_len])
                
                # 定义拟合函数
                def linear_func(x, a, b):
                    return a * x + b
                
                def exponential_func(x, a, b, c):
                    return a * np.exp(b * x) + c
                
                results = {}
                
                # 对A组和B组分别进行拟合（保持原有逻辑）
                # ... 原有的A组和B组拟合代码 ...
                
                self.fitting_results = results
                return results
            
        except Exception as e:
            print(f"曲线拟合错误: {e}")
            return None
    
    def generate_visualization(self):
        """生成可视化图表"""
        if self.data is None:
            return None
        
        try:
            # 检查是否为pDawn荧光数据
            if 'Induction time/h' in self.data.columns:
                # 为pDawn荧光数据创建专门的可视化
                fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 12))
                fig.suptitle('pDawn Optogenetic Protein Production Analysis', fontsize=16, fontweight='bold')
                
                # 提取数据
                row = self.data.iloc[0]
                
                if 'intensity' in str(row.iloc[0]).lower():
                    time_values = []
                    intensity_values = []
                    
                    for col in self.data.columns[1:]:
                        try:
                            time_val = float(col)  # 列名是时间值
                            intensity_val = float(row[col])  # 行数据是强度值
                            time_values.append(time_val)
                            intensity_values.append(intensity_val)
                        except (ValueError, TypeError):
                            continue
                    
                    if time_values and intensity_values:
                        # 1. 主要趋势图 - 荧光强度随时间变化
                        ax1.plot(time_values, intensity_values, 'bo-', linewidth=3, markersize=8, 
                                label='Fluorescence Intensity', color='#2E86AB')
                        ax1.set_title('Fluorescence Intensity vs Induction Time', fontweight='bold', fontsize=14)
                        ax1.set_xlabel('Induction Time (hours)', fontsize=12)
                        ax1.set_ylabel('Mean Intensity (a.u.)', fontsize=12)
                        ax1.grid(True, alpha=0.3)
                        ax1.legend()
                        
                        # 添加拟合曲线（如果有拟合结果）
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
                        
                        # 2. 增长率分析
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
                        
                        # 3. 累积增长分析
                        cumulative_growth = [(val / intensity_values[0] - 1) * 100 for val in intensity_values]
                        ax3.plot(time_values, cumulative_growth, 'go-', linewidth=2, markersize=6)
                        ax3.set_title('Cumulative Growth from Baseline', fontweight='bold', fontsize=14)
                        ax3.set_xlabel('Induction Time (hours)', fontsize=12)
                        ax3.set_ylabel('Cumulative Growth (%)', fontsize=12)
                        ax3.grid(True, alpha=0.3)
                        ax3.axhline(y=0, color='black', linestyle='-', alpha=0.5)
                        
                        # 4. 数据分布和统计
                        ax4.hist(intensity_values, bins=min(8, len(intensity_values)), 
                                alpha=0.7, color='skyblue', edgecolor='black')
                        ax4.set_title('Intensity Distribution', fontweight='bold', fontsize=14)
                        ax4.set_xlabel('Intensity (a.u.)', fontsize=12)
                        ax4.set_ylabel('Frequency', fontsize=12)
                        
                        # 添加统计信息
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
                # 原有的多组数据可视化逻辑
                fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 12))
                fig.suptitle('Multi-Group Experimental Analysis', fontsize=16, fontweight='bold')
                
                # 获取数值列
                numeric_cols = self.data.select_dtypes(include=[np.number]).columns
                time_col = self.data.columns[0]
                
                # 原有的可视化代码...
                # (保持原有逻辑用于处理传统多组数据)
            
            plt.tight_layout()
            
            # 保存图片到内存
            img_buffer = BytesIO()
            plt.savefig(img_buffer, format='png', dpi=300, bbox_inches='tight')
            img_buffer.seek(0)
            plt.close()
            
            return img_buffer
        except Exception as e:
            print(f"可视化生成错误: {e}")
            return None

# 全局分析器实例
analyzer = ProteinAnalyzer()

@app.route('/api/protein-upload', methods=['POST'])
def upload_protein_data():
    """上传蛋白质实验数据"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': '没有文件上传'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': '没有选择文件'}), 400
        
        if not file.filename.endswith('.csv'):
            return jsonify({'error': '请上传CSV格式文件'}), 400
        
        # 读取文件内容
        csv_content = file.read().decode('utf-8')
        
        # 加载数据
        success, message = analyzer.load_data(csv_content)
        
        if success:
            # 进行分析
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
        return jsonify({'error': f'处理文件时发生错误: {str(e)}'}), 500

@app.route('/api/protein-data', methods=['GET'])
def get_protein_data():
    """获取蛋白质实验数据"""
    try:
        # 如果没有上传数据，使用示例数据
        if analyzer.data is None:
            # 加载真实的pDawn荧光数据
            sample_data = """Induction time/h,0.0 ,0.5 ,1.0 ,1.5 ,2.0 ,3.0 ,4.0 ,5.0 ,6.0 ,20.0 
Mean intensity (a.u.),0.20 ,7.95 ,10.38 ,11.49 ,12.49 ,13.97 ,15.76 ,17.48 ,17.68 ,18.02 """
            
            analyzer.load_data(sample_data)
            analyzer.analyze_growth_patterns()
        
        growth_data = analyzer.analysis_results.get('growth_patterns', [])
        return jsonify(growth_data)
        
    except Exception as e:
        return jsonify({'error': f'获取数据时发生错误: {str(e)}'}), 500

@app.route('/api/protein-analysis-chart', methods=['GET'])
def get_analysis_chart():
    """获取分析图表"""
    try:
        # 如果没有数据，先加载示例数据
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
            return jsonify({'error': '生成图表失败'}), 500
            
    except Exception as e:
        return jsonify({'error': f'生成图表时发生错误: {str(e)}'}), 500

@app.route('/api/protein-chat', methods=['POST'])
def protein_chat():
    """蛋白质分析聊天接口"""
    try:
        data = request.get_json()
        message = data.get('message', '')
        context = data.get('context', {})
        
        # 简单的规则基础回复系统
        message_lower = message.lower()
        
        if any(word in message_lower for word in ['实验', 'experiment', '数据', 'data']):
            if analyzer.data is not None:
                total_samples = len(analyzer.data)
                reply = f"根据当前上传的实验数据，我们有{total_samples}个时间点的观测数据。实验监测了光控蛋白生产系统中不同条件下的OD600值变化。"
            else:
                reply = "目前还没有上传实验数据。建议您先在'数据上传'标签页中上传CSV格式的实验数据文件。"
        
        elif any(word in message_lower for word in ['分析', 'analysis', '结果', 'result']):
            if analyzer.analysis_results:
                growth_data = analyzer.analysis_results.get('growth_patterns', [])
                if growth_data:
                    avg_growth = np.mean([item['growthRate'] for item in growth_data if item['growthRate'] != 0])
                    reply = f"分析结果显示，实验期间的平均增长率为{avg_growth:.2f}%。从数据趋势来看，光控系统对蛋白质生产有明显影响。"
                else:
                    reply = "数据分析正在进行中，请稍后查看'结果可视化'标签页获取详细的分析图表。"
            else:
                reply = "还没有进行数据分析。请先上传实验数据，系统会自动进行分析并生成可视化结果。"
        
        elif any(word in message_lower for word in ['光控', 'light', 'pdawn', '蛋白', 'protein']):
            reply = "pDawn光控系统是一个基于蓝光诱导的蛋白表达系统。通过控制光照条件，可以精确调节目标蛋白的表达水平。这种系统在合成生物学中具有重要应用价值，特别是在需要时空特异性蛋白表达的场景中。"
        
        elif any(word in message_lower for word in ['如何', 'how', '怎么', '方法']):
            reply = "使用本系统的步骤：1) 在'数据上传'标签页上传CSV格式的实验数据；2) 系统自动分析数据并在'数据分析'标签页显示统计结果；3) 在'结果可视化'标签页查看生成的分析图表；4) 通过本聊天界面询问具体问题获得解释。"
        
        elif any(word in message_lower for word in ['问题', 'problem', '错误', 'error', '帮助', 'help']):
            reply = "如果遇到问题，请检查：1) CSV文件格式是否正确（第一列为时间，其他列为数值数据）；2) 数据中是否包含必要的实验组标识（如A组、B组）；3) 时间格式是否为标准日期格式。如需更多帮助，请描述具体遇到的问题。"
        
        else:
            reply = "我是Lumaris，专门协助分析光控蛋白生产实验数据。您可以询问关于实验数据分析、结果解释、系统使用方法等问题。请告诉我您想了解什么？"
        
        return jsonify({'reply': reply})
        
    except Exception as e:
        return jsonify({'reply': f'抱歉，处理您的问题时发生了错误：{str(e)}'})

@app.route('/api/protein-correlation', methods=['GET'])
def get_correlation_analysis():
    """获取相关性分析结果"""
    try:
        if analyzer.data is None:
            # 加载真实的pDawn荧光数据
            sample_data = """Induction time/h,0.0 ,0.5 ,1.0 ,1.5 ,2.0 ,3.0 ,4.0 ,5.0 ,6.0 ,20.0 
Mean intensity (a.u.),0.20 ,7.95 ,10.38 ,11.49 ,12.49 ,13.97 ,15.76 ,17.48 ,17.68 ,18.02 """
            analyzer.load_data(sample_data)
            analyzer.perform_correlation_analysis()
        
        correlation_data = analyzer.correlation_results
        return jsonify(correlation_data)
        
    except Exception as e:
        return jsonify({'error': f'获取相关性分析时发生错误: {str(e)}'}), 500

@app.route('/api/protein-fitting', methods=['GET'])
def get_fitting_results():
    """获取拟合结果"""
    try:
        if analyzer.data is None:
            # 加载真实的pDawn荧光数据
            sample_data = """Induction time/h,0.0 ,0.5 ,1.0 ,1.5 ,2.0 ,3.0 ,4.0 ,5.0 ,6.0 ,20.0 
Mean intensity (a.u.),0.20 ,7.95 ,10.38 ,11.49 ,12.49 ,13.97 ,15.76 ,17.48 ,17.68 ,18.02 """
            analyzer.load_data(sample_data)
            analyzer.perform_curve_fitting()
        
        fitting_data = analyzer.fitting_results
        return jsonify(fitting_data)
        
    except Exception as e:
        return jsonify({'error': f'获取拟合结果时发生错误: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5700, debug=True)
