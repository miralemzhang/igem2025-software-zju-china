#!/usr/bin/env python3
"""
科研文献级别的链置换感应层可视化图表生成程序
Scientific Visualization for Strand Displacement Sensing Layer

该程序生成符合科研文献发表标准的静态图表，包括：
1. 反应动力学曲线
2. 浓度分布热图
3. 系统性能分析
4. 生物学原理示意图
5. 参数敏感性分析
6. 时空演化图

作者：iGEM建模团队
日期：2024年
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, Circle, Rectangle, Arrow
import seaborn as sns
from scipy import integrate
from scipy.stats import gaussian_kde
import warnings
warnings.filterwarnings('ignore')

# 设置科研级绘图参数
try:
    plt.style.use('seaborn-v0_8-whitegrid')
except OSError:
    try:
        plt.style.use('seaborn-whitegrid')
    except OSError:
        plt.style.use('default')
plt.rcParams.update({
    'font.family': 'serif',
    'font.serif': ['Times New Roman'],
    'font.size': 10,
    'axes.linewidth': 1.2,
    'axes.labelsize': 11,
    'axes.titlesize': 12,
    'xtick.labelsize': 9,
    'ytick.labelsize': 9,
    'legend.fontsize': 9,
    'figure.figsize': (12, 8),
    'figure.dpi': 300,
    'savefig.dpi': 300,
    'savefig.bbox': 'tight',
    'text.usetex': False,  # 避免LaTeX依赖问题
    'mathtext.fontset': 'cm'
})

class StrandDisplacementVisualizer:
    """链置换感应层科学可视化类"""
    
    def __init__(self):
        """初始化参数"""
        # 物理参数
        self.D_DNA_aTF = 0.008      # μm²/s
        self.D_FreeDNA = 0.012      # μm²/s
        self.D_Tet = 0.012          # μm²/s
        self.D_RNAP = 0.008         # μm²/s
        
        # 反应参数
        self.k1 = 0.4               # aTF置换反应概率
        self.k2 = 0.6               # 转录反应概率
        self.r_contact_1 = 0.15     # μm
        self.r_contact_2 = 0.18     # μm
        
        # 系统参数
        self.chamber_size = (6, 4)  # μm
        self.N_DNA_aTF = 1000
        self.N_Tet = 1000
        self.N_RNAP = 150
        
        # 时间参数
        self.t_max = 50             # s
        self.dt = 0.1               # s
        
    def reaction_kinetics_analysis(self):
        """生成反应动力学分析图"""
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(12, 10))
        
        # 时间数组
        t = np.linspace(0, self.t_max, 500)
        
        # 模拟不同四环素浓度下的反应动力学
        Tet_concentrations = [0.1, 0.5, 1.0, 2.0, 5.0]  # μM
        colors = plt.cm.viridis(np.linspace(0, 1, len(Tet_concentrations)))
        
        for i, C_Tet in enumerate(Tet_concentrations):
            # 简化的反应动力学模型
            k_eff = self.k1 * C_Tet / (1 + C_Tet)
            
            # DNA-aTF复合物浓度
            DNA_aTF = np.exp(-k_eff * t)
            
            # 游离DNA浓度
            FreeDNA = (1 - np.exp(-k_eff * t)) * np.exp(-0.01 * t)
            
            # recycleR浓度
            try:
                # 尝试使用新版本的函数名
                recycleR = self.k2 * integrate.cumulative_trapezoid(FreeDNA, t, initial=0)
            except AttributeError:
                # 回退到旧版本的函数名
                recycleR = self.k2 * integrate.cumtrapz(FreeDNA, t, initial=0)
            
            ax1.plot(t, DNA_aTF, color=colors[i], linewidth=2, 
                    label=f'[Tet] = {C_Tet} μM')
            ax2.plot(t, FreeDNA, color=colors[i], linewidth=2)
            ax3.plot(t, recycleR, color=colors[i], linewidth=2)
        
        # 设置子图1: DNA-aTF复合物衰减
        ax1.set_xlabel('Time (s)')
        ax1.set_ylabel('[DNA-aTF] / [DNA-aTF]₀')
        ax1.set_title('A. aTF Displacement Kinetics')
        ax1.legend(frameon=True, fancybox=True, shadow=True)
        ax1.grid(True, alpha=0.3)
        ax1.set_xlim(0, 50)
        ax1.set_ylim(0, 1)
        
        # 设置子图2: 游离DNA产生
        ax2.set_xlabel('Time (s)')
        ax2.set_ylabel('[Free DNA] / [DNA-aTF]₀')
        ax2.set_title('B. Free DNA Liberation')
        ax2.grid(True, alpha=0.3)
        ax2.set_xlim(0, 50)
        
        # 设置子图3: recycleR积累
        ax3.set_xlabel('Time (s)')
        ax3.set_ylabel('[recycleR] (a.u.)')
        ax3.set_title('C. Signal Production (recycleR)')
        ax3.grid(True, alpha=0.3)
        ax3.set_xlim(0, 50)
        
        # 子图4: 剂量-响应关系
        dose_range = np.logspace(-2, 1, 50)
        response = []
        
        for dose in dose_range:
            # 稳态recycleR浓度
            k_eff = self.k1 * dose / (1 + dose)
            steady_state = k_eff * self.k2 / (0.01 + k_eff)
            response.append(steady_state)
        
        ax4.semilogx(dose_range, response, 'b-', linewidth=3)
        ax4.set_xlabel('Tetracycline Concentration (μM)')
        ax4.set_ylabel('Steady-state [recycleR] (a.u.)')
        ax4.set_title('D. Dose-Response Curve')
        ax4.grid(True, alpha=0.3)
        
        # 标注关键参数
        ax4.axvline(x=1, color='r', linestyle='--', alpha=0.7, label='IC₅₀')
        ax4.legend()
        
        plt.tight_layout()
        plt.savefig('reaction_kinetics_analysis.png', dpi=300, bbox_inches='tight')
        plt.show()
        
    def concentration_field_visualization(self):
        """生成浓度场分布可视化"""
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(14, 10))
        
        # 创建空间网格
        x = np.linspace(-3, 3, 100)
        y = np.linspace(-2, 2, 80)
        X, Y = np.meshgrid(x, y)
        
        # 模拟初始浓度分布
        # 四环素源 (左上角)
        Tet_source = np.exp(-((X + 2)**2 + (Y - 1)**2) / 0.5)
        
        # DNA-aTF源 (右上角)
        DNA_aTF_source = np.exp(-((X - 2)**2 + (Y - 1)**2) / 0.5)
        
        # t=0时刻
        im1 = ax1.contourf(X, Y, Tet_source, levels=20, cmap='Reds', alpha=0.8)
        ax1.contour(X, Y, DNA_aTF_source, levels=10, colors='blue', alpha=0.6, linewidths=1)
        ax1.set_title('t = 0 s: Initial Distribution')
        ax1.set_xlabel('x (μm)')
        ax1.set_ylabel('y (μm)')
        ax1.set_aspect('equal')
        cbar1 = plt.colorbar(im1, ax=ax1, shrink=0.8)
        cbar1.set_label('Tetracycline Concentration')
        
        # t=10s时刻 (扩散后)
        sigma_t = np.sqrt(2 * self.D_Tet * 10)
        Tet_diffused = np.exp(-((X + 2)**2 + (Y - 1)**2) / (0.5 + sigma_t**2))
        
        sigma_dna = np.sqrt(2 * self.D_DNA_aTF * 10)
        DNA_aTF_diffused = np.exp(-((X - 2)**2 + (Y - 1)**2) / (0.5 + sigma_dna**2))
        
        im2 = ax2.contourf(X, Y, Tet_diffused, levels=20, cmap='Reds', alpha=0.8)
        ax2.contour(X, Y, DNA_aTF_diffused, levels=10, colors='blue', alpha=0.6, linewidths=1)
        ax2.set_title('t = 10 s: After Diffusion')
        ax2.set_xlabel('x (μm)')
        ax2.set_ylabel('y (μm)')
        ax2.set_aspect('equal')
        plt.colorbar(im2, ax=ax2, shrink=0.8)
        
        # 反应区域可视化
        reaction_zone = Tet_diffused * DNA_aTF_diffused
        im3 = ax3.contourf(X, Y, reaction_zone, levels=20, cmap='plasma', alpha=0.8)
        ax3.set_title('Reaction Probability Density')
        ax3.set_xlabel('x (μm)')
        ax3.set_ylabel('y (μm)')
        ax3.set_aspect('equal')
        cbar3 = plt.colorbar(im3, ax=ax3, shrink=0.8)
        cbar3.set_label('P(reaction)')
        
        # 游离DNA和recycleR分布
        FreeDNA_field = reaction_zone * 0.7  # 考虑反应效率
        recycleR_field = FreeDNA_field * self.k2
        
        im4 = ax4.contourf(X, Y, recycleR_field, levels=20, cmap='YlOrRd', alpha=0.8)
        
        # 添加转录热点
        hotspots_x = [-0.5, 0.5, 1.0]
        hotspots_y = [0.3, -0.8, 0.6]
        ax4.scatter(hotspots_x, hotspots_y, s=100, c='lime', marker='*', 
                   edgecolors='black', linewidth=1, label='Transcription Hotspots')
        
        ax4.set_title('recycleR Signal Distribution')
        ax4.set_xlabel('x (μm)')
        ax4.set_ylabel('y (μm)')
        ax4.set_aspect('equal')
        ax4.legend()
        cbar4 = plt.colorbar(im4, ax=ax4, shrink=0.8)
        cbar4.set_label('[recycleR]')
        
        plt.tight_layout()
        plt.savefig('concentration_field_visualization.png', dpi=300, bbox_inches='tight')
        plt.show()
        
    def system_performance_analysis(self):
        """生成系统性能分析图"""
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(12, 10))
        
        # 1. 灵敏度分析
        Tet_conc = np.logspace(-2, 1, 50)
        sensitivity = []
        detection_limit = []
        
        for C in Tet_conc:
            # 计算灵敏度 S = d[recycleR]/d[Tet]
            h = 1e-6
            response_1 = self.k1 * C / (1 + C) * self.k2
            response_2 = self.k1 * (C + h) / (1 + C + h) * self.k2
            sens = (response_2 - response_1) / h
            sensitivity.append(sens)
            
            # 检出限 (3σ/S)
            noise_level = 0.01
            LOD = 3 * noise_level / sens if sens > 0 else np.inf
            detection_limit.append(LOD)
        
        ax1.loglog(Tet_conc, sensitivity, 'b-', linewidth=2, label='Sensitivity')
        ax1_twin = ax1.twinx()
        ax1_twin.loglog(Tet_conc, detection_limit, 'r--', linewidth=2, label='Detection Limit')
        
        ax1.set_xlabel('Tetracycline Concentration (μM)')
        ax1.set_ylabel('Sensitivity (a.u./μM)', color='b')
        ax1_twin.set_ylabel('Detection Limit (μM)', color='r')
        ax1.set_title('A. Sensitivity & Detection Limit')
        ax1.grid(True, alpha=0.3)
        
        # 2. 信噪比分析
        time_points = np.linspace(0, 50, 100)
        SNR_values = []
        
        for t in time_points:
            signal = self.k2 * (1 - np.exp(-0.5 * t))
            noise = np.sqrt(signal + 0.01)  # Poisson noise + thermal noise
            snr = signal / noise if noise > 0 else 0
            SNR_values.append(snr)
        
        ax2.plot(time_points, SNR_values, 'g-', linewidth=2)
        ax2.axhline(y=3, color='r', linestyle='--', alpha=0.7, label='SNR = 3 threshold')
        ax2.set_xlabel('Time (s)')
        ax2.set_ylabel('Signal-to-Noise Ratio')
        ax2.set_title('B. SNR Evolution')
        ax2.legend()
        ax2.grid(True, alpha=0.3)
        
        # 3. 响应时间分析
        k_values = np.linspace(0.1, 2.0, 20)
        response_times = []
        
        for k in k_values:
            tau = 1 / (k + 0.01)  # 响应时间常数
            response_times.append(tau)
        
        ax3.plot(k_values, response_times, 'o-', markersize=6, linewidth=2, color='purple')
        ax3.set_xlabel('Effective Rate Constant (s⁻¹)')
        ax3.set_ylabel('Response Time (s)')
        ax3.set_title('C. Response Time Characteristics')
        ax3.grid(True, alpha=0.3)
        
        # 4. 动态范围分析
        concentrations = np.logspace(-2, 1, 100)
        responses = []
        
        for C in concentrations:
            response = self.k1 * C / (1 + C) * self.k2
            responses.append(response)
        
        responses = np.array(responses)
        
        # 计算线性范围
        linear_start = 0.1 * np.max(responses)
        linear_end = 0.9 * np.max(responses)
        
        ax4.semilogx(concentrations, responses, 'b-', linewidth=2)
        ax4.axhline(y=linear_start, color='r', linestyle='--', alpha=0.7)
        ax4.axhline(y=linear_end, color='r', linestyle='--', alpha=0.7)
        ax4.fill_between(concentrations, linear_start, linear_end, alpha=0.2, color='gray', 
                        label='Linear Range')
        
        ax4.set_xlabel('Tetracycline Concentration (μM)')
        ax4.set_ylabel('Response Signal (a.u.)')
        ax4.set_title('D. Dynamic Range')
        ax4.legend()
        ax4.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('system_performance_analysis.png', dpi=300, bbox_inches='tight')
        plt.show()
        
    def biological_mechanism_diagram(self):
        """生成生物学机制原理图"""
        fig, ax = plt.subplots(1, 1, figsize=(14, 8))
        
        # 隐藏坐标轴
        ax.set_xlim(0, 10)
        ax.set_ylim(0, 6)
        ax.axis('off')
        
        # 绘制反应步骤
        
        # 步骤1: 初始状态
        # DNA-aTF复合物
        dna_box = FancyBboxPatch((0.5, 4), 1.5, 0.8, 
                                boxstyle="round,pad=0.02", 
                                facecolor='mediumpurple', 
                                edgecolor='darkblue', linewidth=2)
        ax.add_patch(dna_box)
        ax.text(1.25, 4.4, 'DNA-aTF\nComplex', ha='center', va='center', 
                fontsize=10, fontweight='bold', color='white')
        
        # 添加"抑制"标记
        ax.text(1.25, 3.5, 'Transcriptionally\nRepressed', ha='center', va='center', 
                fontsize=8, style='italic', color='red')
        
        # 四环素分子
        tet_circle = Circle((0.8, 2.5), 0.3, facecolor='red', edgecolor='darkred', linewidth=2)
        ax.add_patch(tet_circle)
        ax.text(0.8, 2.5, 'Tet', ha='center', va='center', 
                fontsize=10, fontweight='bold', color='white')
        
        # 箭头1
        arrow1 = patches.FancyArrowPatch((1.5, 3.5), (2.8, 3.5),
                                        arrowstyle='->', mutation_scale=20, 
                                        color='black', linewidth=2)
        ax.add_patch(arrow1)
        ax.text(2.15, 3.8, 'k₁', ha='center', va='center', fontsize=11, fontweight='bold')
        
        # 步骤2: aTF置换
        # 游离DNA
        free_dna_box = FancyBboxPatch((3.5, 4.5), 1.2, 0.6, 
                                     boxstyle="round,pad=0.02", 
                                     facecolor='lime', 
                                     edgecolor='darkgreen', linewidth=2)
        ax.add_patch(free_dna_box)
        ax.text(4.1, 4.8, 'Free DNA', ha='center', va='center', 
                fontsize=10, fontweight='bold', color='black')
        
        # Tet-aTF复合物
        tet_atf_box = FancyBboxPatch((3.5, 2.5), 1.2, 0.6, 
                                    boxstyle="round,pad=0.02", 
                                    facecolor='orange', 
                                    edgecolor='darkorange', linewidth=2)
        ax.add_patch(tet_atf_box)
        ax.text(4.1, 2.8, 'Tet-aTF', ha='center', va='center', 
                fontsize=10, fontweight='bold', color='black')
        
        # RNA聚合酶
        rnap_circle = Circle((4.1, 1.2), 0.4, facecolor='green', edgecolor='darkgreen', linewidth=2)
        ax.add_patch(rnap_circle)
        ax.text(4.1, 1.2, 'RNAP', ha='center', va='center', 
                fontsize=9, fontweight='bold', color='white')
        
        # 箭头2
        arrow2 = patches.FancyArrowPatch((4.8, 4.5), (6.2, 4.5),
                                        arrowstyle='->', mutation_scale=20, 
                                        color='black', linewidth=2)
        ax.add_patch(arrow2)
        ax.text(5.5, 4.8, 'k₂', ha='center', va='center', fontsize=11, fontweight='bold')
        
        # 步骤3: 转录产物
        # recycleR
        recycler_star = plt.Polygon([(7.5, 5.2), (7.3, 4.6), (6.7, 4.6), (7.1, 4.2), 
                                   (6.9, 3.6), (7.5, 3.9), (8.1, 3.6), (7.9, 4.2), 
                                   (8.3, 4.6), (7.7, 4.6)], 
                                  facecolor='gold', edgecolor='orange', linewidth=2)
        ax.add_patch(recycler_star)
        ax.text(7.5, 4.4, 'recycleR', ha='center', va='center', 
                fontsize=10, fontweight='bold', color='black')
        
        # 添加检测信号标记
        ax.text(7.5, 3.2, 'Detection\nSignal', ha='center', va='center', 
                fontsize=9, style='italic', color='blue', fontweight='bold')
        
        # 添加反应方程式
        ax.text(5, 1.5, 'Reaction 1: [DNA-aTF] + [Tet] → [Free DNA] + [Tet-aTF]', 
                ha='center', va='center', fontsize=11, 
                bbox=dict(boxstyle="round,pad=0.3", facecolor="lightblue", alpha=0.7))
        
        ax.text(5, 0.8, 'Reaction 2: [Free DNA] + [RNAP] → [Free DNA] + [RNAP] + [recycleR]', 
                ha='center', va='center', fontsize=11,
                bbox=dict(boxstyle="round,pad=0.3", facecolor="lightgreen", alpha=0.7))
        
        # 添加标题
        ax.text(5, 5.7, 'Strand Displacement Sensing Mechanism', 
                ha='center', va='center', fontsize=16, fontweight='bold')
        
        # 添加状态标注
        ax.text(1.25, 5.3, 'Initial State\n(Repressed)', ha='center', va='center', 
                fontsize=9, style='italic', bbox=dict(boxstyle="round,pad=0.2", 
                facecolor="white", alpha=0.8))
        
        ax.text(4.1, 5.5, 'Intermediate State\n(Activated)', ha='center', va='center', 
                fontsize=9, style='italic', bbox=dict(boxstyle="round,pad=0.2", 
                facecolor="white", alpha=0.8))
        
        ax.text(7.5, 5.8, 'Final State\n(Signal Output)', ha='center', va='center', 
                fontsize=9, style='italic', bbox=dict(boxstyle="round,pad=0.2", 
                facecolor="white", alpha=0.8))
        
        plt.tight_layout()
        plt.savefig('biological_mechanism_diagram.png', dpi=300, bbox_inches='tight')
        plt.show()
        
    def parameter_sensitivity_analysis(self):
        """参数敏感性分析"""
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(12, 10))
        
        # 1. 扩散系数敏感性
        D_range = np.linspace(0.005, 0.020, 20)
        mixing_time = []
        reaction_efficiency = []
        
        for D in D_range:
            # 混合时间 ∝ L²/D
            t_mix = 36 / D  # L² = 6² μm²
            mixing_time.append(t_mix)
            
            # 反应效率与扩散速度相关
            eff = 1 - np.exp(-D * 100)  # 简化模型
            reaction_efficiency.append(eff)
        
        ax1.plot(D_range, mixing_time, 'b-', linewidth=2, label='Mixing Time')
        ax1_twin = ax1.twinx()
        ax1_twin.plot(D_range, reaction_efficiency, 'r--', linewidth=2, label='Reaction Efficiency')
        
        ax1.set_xlabel('Diffusion Coefficient (μm²/s)')
        ax1.set_ylabel('Mixing Time (s)', color='b')
        ax1_twin.set_ylabel('Reaction Efficiency', color='r')
        ax1.set_title('A. Diffusion Coefficient Sensitivity')
        ax1.grid(True, alpha=0.3)
        
        # 2. 反应概率敏感性
        P_range = np.linspace(0.1, 1.0, 20)
        signal_strength = []
        response_time = []
        
        for P in P_range:
            signal = P * self.k2  # 简化的信号强度
            signal_strength.append(signal)
            
            t_resp = 1 / (P + 0.01)  # 响应时间
            response_time.append(t_resp)
        
        ax2.plot(P_range, signal_strength, 'g-', linewidth=2)
        ax2.set_xlabel('Reaction Probability')
        ax2.set_ylabel('Signal Strength (a.u.)')
        ax2.set_title('B. Reaction Probability Sensitivity')
        ax2.grid(True, alpha=0.3)
        
        # 3. 粒子数量效应
        N_range = np.logspace(2, 4, 20)
        noise_level = []
        detection_precision = []
        
        for N in N_range:
            # Poisson噪声 ∝ 1/√N
            noise = 1 / np.sqrt(N)
            noise_level.append(noise)
            
            # 检测精度 ∝ √N
            precision = np.sqrt(N) / 1000  # 归一化
            detection_precision.append(precision)
        
        ax3.loglog(N_range, noise_level, 'purple', linewidth=2, label='Noise Level')
        ax3.loglog(N_range, detection_precision, 'orange', linewidth=2, label='Detection Precision')
        ax3.set_xlabel('Number of Particles')
        ax3.set_ylabel('Relative Level')
        ax3.set_title('C. Particle Number Effects')
        ax3.legend()
        ax3.grid(True, alpha=0.3)
        
        # 4. 温度效应
        T_range = np.linspace(290, 320, 20)  # 17-47°C
        reaction_rate = []
        diffusion_rate = []
        
        for T in T_range:
            # Arrhenius方程
            k_T = np.exp(-5000/T + 17.1)  # 简化的温度依赖性
            reaction_rate.append(k_T)
            
            # 扩散系数 ∝ T (Einstein关系)
            D_T = T / 310 * self.D_Tet  # 归一化到310K
            diffusion_rate.append(D_T)
        
        ax4.plot(T_range, reaction_rate, 'red', linewidth=2, label='Reaction Rate')
        ax4_twin = ax4.twinx()
        ax4_twin.plot(T_range, diffusion_rate, 'blue', linewidth=2, label='Diffusion Rate')
        
        ax4.set_xlabel('Temperature (K)')
        ax4.set_ylabel('Relative Reaction Rate', color='red')
        ax4_twin.set_ylabel('Diffusion Coefficient (μm²/s)', color='blue')
        ax4.set_title('D. Temperature Effects')
        ax4.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('parameter_sensitivity_analysis.png', dpi=300, bbox_inches='tight')
        plt.show()
        
    def temporal_evolution_visualization(self):
        """时间演化可视化"""
        fig, ax = plt.subplots(1, 1, figsize=(12, 8))
        
        time_points = [0, 5, 10, 20, 30, 50]
        colors = plt.cm.viridis(np.linspace(0, 1, len(time_points)))
        
        x = np.linspace(-3, 3, 100)
        
        for i, t in enumerate(time_points):
            sigma_t = np.sqrt(2 * self.D_Tet * t + 0.5)
            
            C_tet = np.exp(-(x + 2)**2 / sigma_t**2)
            
            sigma_dna = np.sqrt(2 * self.D_DNA_aTF * t + 0.5)
            C_dna = np.exp(-(x - 2)**2 / sigma_dna**2)
            
            C_recycler = C_tet * C_dna * self.k1 * self.k2 * t / 10
            
            ax.plot(x, C_tet, color=colors[i], linestyle='-', linewidth=2, 
                   alpha=0.8, label=f't = {t}s (Tet)')
            ax.plot(x, C_dna, color=colors[i], linestyle='--', linewidth=2, 
                   alpha=0.8, label=f't = {t}s (DNA-aTF)')
            ax.plot(x, C_recycler, color=colors[i], linestyle='-.', linewidth=3, 
                   alpha=0.9, label=f't = {t}s (recycleR)')
        
        ax.axvline(x=-2, color='red', linestyle=':', alpha=0.5, linewidth=2)
        ax.text(-2, 0.9, 'Tet Source', rotation=90, ha='center', va='bottom', 
                color='red', fontweight='bold')
        
        ax.axvline(x=2, color='blue', linestyle=':', alpha=0.5, linewidth=2)
        ax.text(2, 0.9, 'DNA-aTF Source', rotation=90, ha='center', va='bottom', 
                color='blue', fontweight='bold')
        
        ax.axvspan(-1, 1, alpha=0.1, color='gray', label='Reaction Zone')
        
        ax.set_xlabel('Position x (μm)')
        ax.set_ylabel('Normalized Concentration')
        ax.set_title('Temporal Evolution of Concentration Profiles')
        ax.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
        ax.grid(True, alpha=0.3)
        ax.set_xlim(-3, 3)
        ax.set_ylim(0, 1)
        
        plt.tight_layout()
        plt.savefig('temporal_evolution_visualization.png', dpi=300, bbox_inches='tight')
        plt.show()

def main():
    """主函数：生成所有科研级图表"""
    print("🔬 开始生成科研文献级别的可视化图表...")
    print("=" * 60)
    
    visualizer = StrandDisplacementVisualizer()
    
    print("📊 1. 生成反应动力学分析图...")
    visualizer.reaction_kinetics_analysis()
    
    print("🗺️ 2. 生成浓度场分布可视化...")
    visualizer.concentration_field_visualization()
    
    print("📈 3. 生成系统性能分析图...")
    visualizer.system_performance_analysis()
    
    print("🧬 4. 生成生物学机制原理图...")
    visualizer.biological_mechanism_diagram()
    
    print("🎯 5. 生成参数敏感性分析...")
    visualizer.parameter_sensitivity_analysis()
    
    print("⏰ 6. 生成时间演化可视化...")
    visualizer.temporal_evolution_visualization()
    
    print("=" * 60)
    print("✅ 所有科研级图表生成完成！")
    print("📁 图表已保存为以下文件：")
    print("   - reaction_kinetics_analysis.png")
    print("   - concentration_field_visualization.png")
    print("   - system_performance_analysis.png")
    print("   - biological_mechanism_diagram.png")
    print("   - parameter_sensitivity_analysis.png")
    print("   - temporal_evolution_visualization.png")

if __name__ == "__main__":
    main()
