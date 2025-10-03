# 链置换实验感应层仿真
# Strand Displacement Sensing Layer Simulation
#
# 正确的生物反应机制：
# 初始状态：所有变构转录因子(aTF)都与DNA模板结合，形成DNA-aTF复合物，抑制转录
# 1. 四环素(污染物)与DNA-aTF复合物结合，导致aTF从DNA上脱落
#    DNA-aTF复合物 + 四环素 → 游离DNA + 四环素-aTF复合物
# 2. 游离的DNA与T7 RNA聚合酶结合，启动转录过程
#    游离DNA + T7 RNAP → recycleR RNA (输出信号)
# 3. recycleR的产生表示成功检测到四环素污染物
# 
# 关键：DNA模板是游离粒子，不是固定位置！初始状态全部与aTF结合！

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from matplotlib.patches import Rectangle
import random
import math
import warnings
warnings.filterwarnings('ignore')

print("💻 Running in local environment")

# 设置matplotlib
plt.ion()  # 开启交互模式

# 科学期刊级别样式
plt.rcParams.update({
    'font.family': 'serif',
    'font.size': 11,
    'axes.linewidth': 1.0,
    'figure.figsize': (14, 8),
    'figure.dpi': 100,
    'savefig.dpi': 100
})

class OptimizedParticle:
    """优化的粒子类"""
    def __init__(self, x, y, particle_type, size=0.05, color='blue'):
        self.x = x
        self.y = y
        self.vx = random.uniform(-0.015, 0.015)  # 降低初始速度
        self.vy = random.uniform(-0.015, 0.015)
        self.type = particle_type
        self.size = size
        self.color = color
        self.original_color = color
        self.bound = False
        self.bound_partner = None
        self.diffusion_coeff = 0.01  # 降低扩散系数
        
        # 新增状态管理
        self.reaction_state = 'free'  # 'free', 'bound_aTF', 'bound_DNA', 'complex'
        self.bound_to_template = None  # 绑定的DNA模板ID
        self.complex_partners = []     # 复合物中的伙伴列表
        
    def update_position_vectorized(self, chamber_bounds, dt=0.1):
        """位置更新"""
        if not self.bound:
            # 布朗运动
            random_force_x = np.random.normal(0, math.sqrt(2 * self.diffusion_coeff * dt))
            random_force_y = np.random.normal(0, math.sqrt(2 * self.diffusion_coeff * dt))
            
            # 更新速度（降低力度）
            self.vx += random_force_x * 0.1
            self.vy += random_force_y * 0.1
            
            # 增加阻力
            self.vx *= 0.995
            self.vy *= 0.995
            
            # 速度限制（降低最大速度）
            max_speed = 0.025
            speed = math.sqrt(self.vx**2 + self.vy**2)
            if speed > max_speed:
                self.vx = (self.vx / speed) * max_speed
                self.vy = (self.vy / speed) * max_speed
            
            # 位置更新
            self.x += self.vx
            self.y += self.vy
            
            # 边界处理
            if self.x <= chamber_bounds[0] or self.x >= chamber_bounds[1]:
                self.vx *= -0.8
                self.x = np.clip(self.x, chamber_bounds[0] + self.size, chamber_bounds[1] - self.size)
            if self.y <= chamber_bounds[2] or self.y >= chamber_bounds[3]:
                self.vy *= -0.8
                self.y = np.clip(self.y, chamber_bounds[2] + self.size, chamber_bounds[3] - self.size)

class DNAaTFComplex:
    """DNA-aTF复合物类 - 初始状态的抑制复合物"""
    def __init__(self, x, y, complex_id):
        self.x = x
        self.y = y
        self.vx = random.uniform(-0.01, 0.01)  # 降低初始速度
        self.vy = random.uniform(-0.01, 0.01)
        self.complex_id = complex_id
        self.size = 0.03  # 调小尺寸
        self.active = True  # 复合物是否还存在
        self.color = 'purple'  # 紫色表示抑制状态
        self.diffusion_coeff = 0.008  # 降低扩散系数
        
    def update_position(self, chamber_bounds, dt=0.1):
        """更新复合物位置"""
        if self.active:
            # 布朗运动
            random_force_x = np.random.normal(0, math.sqrt(2 * self.diffusion_coeff * dt))
            random_force_y = np.random.normal(0, math.sqrt(2 * self.diffusion_coeff * dt))
            
            self.vx += random_force_x * 0.08  # 降低力度
            self.vy += random_force_y * 0.08
            self.vx *= 0.99  # 增加阻力
            self.vy *= 0.99
            
            # 速度限制（降低最大速度）
            max_speed = 0.015
            speed = math.sqrt(self.vx**2 + self.vy**2)
            if speed > max_speed:
                self.vx = (self.vx / speed) * max_speed
                self.vy = (self.vy / speed) * max_speed
            
            # 位置更新
            self.x += self.vx
            self.y += self.vy
            
            # 边界处理
            if self.x <= chamber_bounds[0] or self.x >= chamber_bounds[1]:
                self.vx *= -0.8
                self.x = np.clip(self.x, chamber_bounds[0] + self.size, chamber_bounds[1] - self.size)
            if self.y <= chamber_bounds[2] or self.y >= chamber_bounds[3]:
                self.vy *= -0.8
                self.y = np.clip(self.y, chamber_bounds[2] + self.size, chamber_bounds[3] - self.size)

class FreeDNA:
    """游离DNA类 - aTF脱落后的活性DNA"""
    def __init__(self, x, y, dna_id):
        self.x = x
        self.y = y
        self.vx = random.uniform(-0.015, 0.015)  # 降低初始速度
        self.vy = random.uniform(-0.015, 0.015)
        self.dna_id = dna_id
        self.size = 0.025
        self.color = 'lime'  # 亮绿色表示可转录
        self.diffusion_coeff = 0.012  # 降低扩散系数
        self.transcribing = False
        self.recycleR_count = 0
        self.last_transcription = 0
        
    def update_position(self, chamber_bounds, dt=0.1):
        """更新游离DNA位置"""
        # 布朗运动
        random_force_x = np.random.normal(0, math.sqrt(2 * self.diffusion_coeff * dt))
        random_force_y = np.random.normal(0, math.sqrt(2 * self.diffusion_coeff * dt))
        
        self.vx += random_force_x * 0.1  # 降低力度
        self.vy += random_force_y * 0.1
        self.vx *= 0.985  # 增加阻力
        self.vy *= 0.985
        
        # 速度限制（降低最大速度）
        max_speed = 0.02
        speed = math.sqrt(self.vx**2 + self.vy**2)
        if speed > max_speed:
            self.vx = (self.vx / speed) * max_speed
            self.vy = (self.vy / speed) * max_speed
        
        # 位置更新
        self.x += self.vx
        self.y += self.vy
        
        # 边界处理
        if self.x <= chamber_bounds[0] or self.x >= chamber_bounds[1]:
            self.vx *= -0.8
            self.x = np.clip(self.x, chamber_bounds[0] + self.size, chamber_bounds[1] - self.size)
        if self.y <= chamber_bounds[2] or self.y >= chamber_bounds[3]:
            self.vy *= -0.8
            self.y = np.clip(self.y, chamber_bounds[2] + self.size, chamber_bounds[3] - self.size)
    
    def transcribe_recycleR(self, frame_count):
        """转录产生recycleR"""
        if frame_count - self.last_transcription > 15:
            self.recycleR_count += 1
            self.last_transcription = frame_count
            return {
                'x': self.x + random.uniform(-0.05, 0.05),
                'y': self.y + random.uniform(-0.05, 0.05),
                'creation_time': frame_count,
                'dna_id': self.dna_id
            }
        return None

class OptimizedSimulation:
    """优化的仿真类"""
    def __init__(self):
        self.chamber_bounds = [-3, 3, -2, 2]
        
        # 粒子数量
        self.n_pollutants = 1000
        self.n_polymerases = 150
        print(f"💻 Local mode: {self.n_pollutants} tetracycline, {self.n_polymerases} RNA polymerases")
        
        # 初始化组件
        self.pollutants = []
        self.dna_atf_complexes = []  # DNA-aTF复合物（初始抑制状态）
        self.free_dnas = []          # 游离DNA（可转录状态）
        self.tetracycline_atf_complexes = []  # 四环素-aTF复合物
        self.rna_polymerases = []
        
        # 创建初始DNA-aTF复合物（全部处于抑制状态）
        # 数量与污染物对应
        self.n_dna_complexes = self.n_pollutants
        print(f"🧬 Creating {self.n_dna_complexes} DNA-aTF complexes (initial repressed state)")
        
        # DNA-aTF复合物 - 右上角高浓度分布（与污染物对称）
        n_complex_concentrated = int(self.n_dna_complexes * 0.8)
        
        # 集中分布区域（右上角）
        x_complex_conc = np.random.uniform(1.0, 2.9, n_complex_concentrated)
        y_complex_conc = np.random.uniform(0.5, 1.9, n_complex_concentrated)
        
        # 分散分布区域
        x_complex_disp = np.random.uniform(-2.8, 2.8, self.n_dna_complexes - n_complex_concentrated)
        y_complex_disp = np.random.uniform(-1.8, 1.8, self.n_dna_complexes - n_complex_concentrated)
        
        # 创建集中分布的DNA-aTF复合物
        for i in range(n_complex_concentrated):
            complex_obj = DNAaTFComplex(x_complex_conc[i], y_complex_conc[i], i)
            self.dna_atf_complexes.append(complex_obj)
        
        # 创建分散分布的DNA-aTF复合物
        for i in range(self.n_dna_complexes - n_complex_concentrated):
            complex_obj = DNAaTFComplex(x_complex_disp[i], y_complex_disp[i], n_complex_concentrated + i)
            self.dna_atf_complexes.append(complex_obj)
        
        # 创建粒子
        self.create_optimized_particles()
        
        # 仿真参数
        self.frame_count = 0
        self.binding_events = []
        
        # 新增反应产物和统计
        self.recycleR_products = []  # recycleR RNA产物列表
        self.reaction_stats = {
            'atf_displacements': 0,         # aTF脱落事件
            'dna_liberation': 0,            # DNA释放事件
            'transcriptions': 0,            # 转录事件
            'recycleR_productions': 0,      # recycleR产生
            'tetracycline_atf_complexes': 0 # 四环素-aTF复合物数
        }
        
        # Colab优化的浓度场
        grid_size = 20  # 减少网格大小确保稳定
        self.grid_x = np.linspace(self.chamber_bounds[0], self.chamber_bounds[1], grid_size)
        self.grid_y = np.linspace(self.chamber_bounds[2], self.chamber_bounds[3], grid_size)
        
        # 浓度场缓存
        self.conc_cache_pollutant = None
        self.conc_cache_aTF = None
        self.cache_update_interval = 2  # 减少更新频率
    
    def create_optimized_particles(self):
        """创建优化的粒子群"""
        # 污染物 - 左上角高浓度分布
        n_concentrated = int(self.n_pollutants * 0.8)
        
        # 集中分布区域
        x_conc = np.random.uniform(-2.9, -1.0, n_concentrated)
        y_conc = np.random.uniform(0.5, 1.9, n_concentrated)
        
        # 分散分布区域
        x_disp = np.random.uniform(-2.8, 2.8, self.n_pollutants - n_concentrated)
        y_disp = np.random.uniform(-1.8, 1.8, self.n_pollutants - n_concentrated)
        
        # 创建污染物
        for i in range(n_concentrated):
            particle = OptimizedParticle(x_conc[i], y_conc[i], 'pollutant', 0.015, 'red')
            particle.diffusion_coeff = 0.012  # 降低扩散系数
            particle.reaction_state = 'free'  # 确保初始状态为自由
            self.pollutants.append(particle)
        
        for i in range(self.n_pollutants - n_concentrated):
            particle = OptimizedParticle(x_disp[i], y_disp[i], 'pollutant', 0.015, 'red')
            particle.diffusion_coeff = 0.012  # 降低扩散系数
            particle.reaction_state = 'free'  # 确保初始状态为自由
            self.pollutants.append(particle)
        
        # 注意：aTF已经在DNA-aTF复合物中，不需要单独创建
        
        # RNA聚合酶 - 随机分布
        x_poly = np.random.uniform(-2.8, 2.8, self.n_polymerases)
        y_poly = np.random.uniform(-1.8, 1.8, self.n_polymerases)
        
        for i in range(self.n_polymerases):
            particle = OptimizedParticle(x_poly[i], y_poly[i], 'T7_RNAP', 0.035, 'green')
            particle.diffusion_coeff = 0.008  # 降低扩散系数
            particle.reaction_state = 'free'  # 确保初始状态
            self.rna_polymerases.append(particle)
    
    def fast_concentration_field(self, particles, sigma=0.15):
        """GPU优化的浓度场计算"""
        X, Y = np.meshgrid(self.grid_x, self.grid_y)
        concentration = np.zeros_like(X)
        
        # 处理不同类型的粒子
        if len(particles) == 0:
            return X, Y, concentration
        
        # 检查粒子类型并过滤
        active_particles = []
        for p in particles:
            if hasattr(p, 'bound'):  # 污染物粒子
                if not p.bound:
                    active_particles.append(p)
            elif hasattr(p, 'active'):  # DNA-aTF复合物
                if p.active:
                    active_particles.append(p)
            else:  # 其他粒子类型
                active_particles.append(p)
        
        if len(active_particles) == 0:
            return X, Y, concentration
        
        # 向量化计算
        positions = np.array([[p.x, p.y] for p in active_particles])
        
        # 使用broadcasting加速计算
        for i, x_val in enumerate(self.grid_x):
            for j, y_val in enumerate(self.grid_y):
                distances_sq = np.sum((positions - np.array([x_val, y_val]))**2, axis=1)
                concentration[j, i] = np.sum(np.exp(-distances_sq / (2 * sigma**2)))
        
        return X, Y, concentration
    
    def update_concentration_cache(self):
        """更新浓度场缓存"""
        # 四环素浓度场
        free_pollutants = [p for p in self.pollutants if p.reaction_state == 'free']
        X, Y, new_conc_pol = self.fast_concentration_field(free_pollutants)
        
        # DNA-aTF复合物浓度场
        active_complexes = [c for c in self.dna_atf_complexes if c.active]
        _, _, new_conc_complex = self.fast_concentration_field(active_complexes)
        
        # 平滑更新
        alpha = 0.5
        if self.conc_cache_pollutant is None:
            self.conc_cache_pollutant = new_conc_pol
            self.conc_cache_aTF = new_conc_complex
        else:
            self.conc_cache_pollutant = alpha * new_conc_pol + (1 - alpha) * self.conc_cache_pollutant
            self.conc_cache_aTF = alpha * new_conc_complex + (1 - alpha) * self.conc_cache_aTF
        
        return X, Y, self.conc_cache_pollutant, self.conc_cache_aTF
    
    def biological_reaction_check(self):
        """生物反应检测 - 实现正确的aTF脱落机制"""
        if self.frame_count % 2 != 0:  # 减少检测频率
            return
        
        # 第一步：四环素与DNA-aTF复合物结合，导致aTF脱落
        self.check_atf_displacement()
        
        # 第二步：RNA聚合酶与游离DNA的转录反应
        self.check_transcription_reaction()
    
    def check_atf_displacement(self):
        """检查四环素与DNA-aTF复合物的反应，导致aTF脱落"""
        free_pollutants = [p for p in self.pollutants if p.reaction_state == 'free']
        active_complexes = [c for c in self.dna_atf_complexes if c.active]
        
        if not free_pollutants or not active_complexes:
            return
            
        # 采样检测
        sample_pol = min(50, len(free_pollutants))
        sample_complex = min(30, len(active_complexes))
        
        sampled_pol = random.sample(free_pollutants, sample_pol)
        sampled_complexes = random.sample(active_complexes, sample_complex)
        
        for pollutant in sampled_pol:
            for complex_obj in sampled_complexes:
                distance = math.sqrt((pollutant.x - complex_obj.x)**2 + (pollutant.y - complex_obj.y)**2)
                if distance < 0.15 and random.random() < 0.4:
                    # aTF脱落反应：DNA-aTF复合物 + 四环素 → 游离DNA + 四环素-aTF复合物
                    
                    # 1. 创建游离DNA
                    free_dna = FreeDNA(complex_obj.x, complex_obj.y, complex_obj.complex_id)
                    self.free_dnas.append(free_dna)
                    
                    # 2. 创建四环素-aTF复合物
                    tet_atf_complex = {
                        'x': pollutant.x,
                        'y': pollutant.y,
                        'vx': pollutant.vx,
                        'vy': pollutant.vy,
                        'formation_time': self.frame_count,
                        'pollutant_id': pollutant,
                        'complex_id': complex_obj.complex_id
                    }
                    self.tetracycline_atf_complexes.append(tet_atf_complex)
                    
                    # 3. 移除原来的污染物粒子和DNA-aTF复合物
                    pollutant.reaction_state = 'complexed'
                    pollutant.color = 'orange'  # 四环素-aTF复合物颜色
                    pollutant.x = complex_obj.x + 0.08  # 稍微移动位置
                    pollutant.y = complex_obj.y
                    
                    complex_obj.active = False  # 复合物失活
                    
                    # 4. 更新统计
                    self.reaction_stats['atf_displacements'] += 1
                    self.reaction_stats['dna_liberation'] += 1
                    self.reaction_stats['tetracycline_atf_complexes'] += 1
                    
                    break
    
    def check_transcription_reaction(self):
        """检查RNA聚合酶与游离DNA的转录反应"""
        free_polymerases = [p for p in self.rna_polymerases if not p.bound]
        active_free_dnas = [d for d in self.free_dnas if not d.transcribing]
        
        if not free_polymerases or not active_free_dnas:
            return
            
        # 采样检测
        sample_pol = min(25, len(free_polymerases))
        sample_dna = min(20, len(active_free_dnas))
        
        sampled_pol = random.sample(free_polymerases, sample_pol)
        sampled_dnas = random.sample(active_free_dnas, sample_dna)
        
        for polymerase in sampled_pol:
            for free_dna in sampled_dnas:
                distance = math.sqrt((polymerase.x - free_dna.x)**2 + (polymerase.y - free_dna.y)**2)
                if distance < 0.18 and random.random() < 0.6:
                    # RNA聚合酶转录产生recycleR
                    recycleR = free_dna.transcribe_recycleR(self.frame_count)
                    if recycleR:
                        self.recycleR_products.append(recycleR)
                        self.reaction_stats['transcriptions'] += 1
                        self.reaction_stats['recycleR_productions'] += 1
                        
                        # 聚合酶短暂结合然后释放
                        polymerase.color = 'lime'  # 转录时变亮绿色
                        free_dna.transcribing = True
                        
                        # 下一帧恢复状态
                        break
    
    def update(self):
        """主更新循环"""
        self.frame_count += 1
        
        # 粒子位置更新
        for particle in self.pollutants:
            if particle.reaction_state == 'free':  # 只有自由的四环素才移动
                particle.update_position_vectorized(self.chamber_bounds)
        
        # 更新DNA-aTF复合物
        for complex_obj in self.dna_atf_complexes:
            if complex_obj.active:
                complex_obj.update_position(self.chamber_bounds)
        
        # 更新游离DNA
        for free_dna in self.free_dnas:
            free_dna.update_position(self.chamber_bounds)
            # 重置转录状态
            if free_dna.transcribing:
                free_dna.transcribing = False
        
        # 更新RNA聚合酶
        for particle in self.rna_polymerases:
            particle.update_position_vectorized(self.chamber_bounds)
        
        # 生物反应检测
        self.biological_reaction_check()
        
        # 更新四环素-aTF复合物位置
        for tet_atf in self.tetracycline_atf_complexes:
            if 'pollutant_id' in tet_atf:
                pollutant = tet_atf['pollutant_id']
                # 四环素-aTF复合物随污染物移动（缓慢扩散）
                tet_atf['x'] = pollutant.x
                tet_atf['y'] = pollutant.y
        
        # 恢复RNA聚合酶颜色
        for polymerase in self.rna_polymerases:
            if polymerase.color == 'lime':
                polymerase.color = 'green'  # 恢复原色
        
        # 清理过期的recycleR产物 (模拟RNA降解)
        if self.frame_count % 100 == 0:  # 每100帧清理一次
            self.recycleR_products = [rna for rna in self.recycleR_products 
                                    if self.frame_count - rna['creation_time'] < 500]
        
        # 浓度场更新
        if self.frame_count % self.cache_update_interval == 0:
            self.update_concentration_cache()

def create_animation():
    """创建动画"""
    sim = OptimizedSimulation()
    
    # 创建图形 - 使用不同比例的子图
    fig = plt.figure(figsize=(16, 7))
    gs = fig.add_gridspec(1, 2, width_ratios=[1, 1.25], wspace=0.2)  # 左图3:右图2的比例
    ax1 = fig.add_subplot(gs[0])  # 左图：分子动力学（较大）
    ax2 = fig.add_subplot(gs[1])  # 右图：浓度场和统计（较小）
    
    # 颜色条初始化
    cbar_created = False
    
    def animate(frame):
        nonlocal cbar_created
        
        # 清除坐标轴
        ax1.clear()
        ax2.clear()
        
        bounds = sim.chamber_bounds
        
        # === 左图：分子动力学 ===
        ax1.set_xlim(bounds[0], bounds[1])
        ax1.set_ylim(bounds[2], bounds[3])
        
        # 舱室边界
        chamber_rect = Rectangle((bounds[0], bounds[2]), 
                               bounds[1] - bounds[0], bounds[3] - bounds[2],
                               linewidth=1.5, edgecolor='black', 
                               facecolor='lightgray', alpha=0.1)
        ax1.add_patch(chamber_rect)
        
        # 污染物源区域（左上角）
        ax1.add_patch(Rectangle((-2.9, 1.5), 0.7, 0.4, 
                               facecolor='lightcoral', alpha=0.4))
        ax1.text(-2.55, 1.7, 'Tetracycline\nSource', ha='center', va='center', fontsize=6, fontweight='bold')
        
        # DNA-aTF复合物源区域（右上角）
        ax1.add_patch(Rectangle((2.2, 1.5), 0.7, 0.4, 
                               facecolor='mediumpurple', alpha=0.4))
        ax1.text(2.55, 1.7, 'DNA-aTF\nSource', ha='center', va='center', fontsize=6, fontweight='bold')
        
        # 显示DNA-aTF复合物（初始抑制状态）
        active_complexes = [c for c in sim.dna_atf_complexes if c.active]
        if active_complexes:
            # 限制显示数量以提高性能
            max_display_complex = 500
            if len(active_complexes) > max_display_complex:
                display_complexes = random.sample(active_complexes, max_display_complex)
            else:
                display_complexes = active_complexes
                
            ax1.scatter([c.x for c in display_complexes], [c.y for c in display_complexes],
                       s=12, c='purple', alpha=0.7, marker='s', 
                       label=f'DNA-aTF Complex ({len(active_complexes)})')
        
        # 显示游离DNA（可转录状态）
        if sim.free_dnas:
            ax1.scatter([d.x for d in sim.free_dnas], [d.y for d in sim.free_dnas],
                       s=10, c='lime', alpha=0.9, marker='s', 
                       label=f'Free DNA ({len(sim.free_dnas)})')
        
        # 显示自由四环素
        free_pollutants = [p for p in sim.pollutants if p.reaction_state == 'free']
        complexed_pollutants = [p for p in sim.pollutants if p.reaction_state == 'complexed']
        
        # 限制显示数量
        max_display = 800
        if len(free_pollutants) > max_display:
            display_pollutants = random.sample(free_pollutants, max_display)
        else:
            display_pollutants = free_pollutants
        
        if display_pollutants:
            ax1.scatter([p.x for p in display_pollutants], [p.y for p in display_pollutants],
                       s=6, c='red', alpha=0.6, label=f'Free Tetracycline ({len(free_pollutants)})')
        
        # 显示四环素-aTF复合物
        if complexed_pollutants:
            ax1.scatter([p.x for p in complexed_pollutants], [p.y for p in complexed_pollutants],
                       s=8, c='orange', alpha=0.8, marker='D', 
                       label=f'Tet-aTF Complex ({len(complexed_pollutants)})')
        
        # RNA聚合酶
        if sim.rna_polymerases:
            colors = [p.color for p in sim.rna_polymerases]
            ax1.scatter([p.x for p in sim.rna_polymerases], [p.y for p in sim.rna_polymerases],
                       s=12, c=colors, marker='D', alpha=0.8, label=f'RNA Polymerase ({len(sim.rna_polymerases)})')
        
        # recycleR RNA产物
        if sim.recycleR_products:
            # 显示最近的recycleR产物
            recent_recycleR = [rna for rna in sim.recycleR_products 
                             if frame - rna['creation_time'] < 50]  # 只显示最近50帧的
            if recent_recycleR:
                ax1.scatter([rna['x'] for rna in recent_recycleR], 
                           [rna['y'] for rna in recent_recycleR],
                           s=10, c='yellow', marker='*', alpha=0.9, 
                           label=f'recycleR ({len(recent_recycleR)})')
        
        # 样式设置
        ax1.set_xlabel('Position X (μm)', fontweight='bold')
        ax1.set_ylabel('Position Y (μm)', fontweight='bold')
        ax1.set_title('Molecular Dynamics', fontweight='bold')
        ax1.grid(True, alpha=0.3)
        ax1.set_aspect('equal')
        ax1.legend(loc='lower right', fontsize=6, framealpha=0.9)
        
        # === 右图：浓度场 ===
        ax2.set_xlim(bounds[0], bounds[1])
        ax2.set_ylim(bounds[2], bounds[3])
        
        # 浓度场显示
        if sim.conc_cache_pollutant is not None:
            try:
                X, Y, conc_pol, conc_aTF = sim.update_concentration_cache()
                
                # 四环素浓度场（红色填充）
                if np.max(conc_pol) > 0:
                    contour_pol = ax2.contourf(X, Y, conc_pol, levels=8, cmap='Reds', alpha=0.7)
                    ax2.contour(X, Y, conc_pol, levels=4, colors='darkred', alpha=0.6, linewidths=0.8)
                
                # DNA-aTF复合物浓度场（蓝色填充）
                if np.max(conc_aTF) > 0:
                    contour_aTF = ax2.contourf(X, Y, conc_aTF, levels=8, cmap='Blues', alpha=0.6)
                    ax2.contour(X, Y, conc_aTF, levels=4, colors='darkblue', alpha=0.6, linewidths=0.8)
                
                # 添加颜色条（如果还没有创建）
                if not cbar_created and (np.max(conc_pol) > 0 or np.max(conc_aTF) > 0):
                    try:
                        if np.max(conc_pol) > 0:
                            cbar1 = plt.colorbar(contour_pol, ax=ax2, shrink=0.6, pad=0.02)
                            cbar1.set_label('Tetracycline\nConcentration', fontsize=8)
                        cbar_created = True
                    except:
                        pass  # 忽略颜色条错误
                        
            except Exception as e:
                # 浓度场计算失败时显示粒子分布
                free_pol = [p for p in sim.pollutants if p.reaction_state == 'free']
                if free_pol:
                    ax2.scatter([p.x for p in free_pol[:200]], [p.y for p in free_pol[:200]],
                               s=3, c='red', alpha=0.5)
        
        # 显示游离DNA位置（产生recycleR的地方）
        if sim.free_dnas:
            for free_dna in sim.free_dnas:
                ax2.scatter(free_dna.x, free_dna.y, s=30, c='lime', marker='s', zorder=5)
                # 显示该DNA产生的recycleR数量
                if free_dna.recycleR_count > 0:
                    ax2.text(free_dna.x, free_dna.y+0.08, f'R:{free_dna.recycleR_count}', 
                            ha='center', va='center', fontsize=5, color='yellow', fontweight='bold')
        
        # 不显示DNA-aTF复合物分布（右图专注于浓度场和统计）
        
        ax2.set_xlabel('Position X (μm)', fontweight='bold')
        ax2.set_ylabel('Position Y (μm)', fontweight='bold')
        ax2.set_title('Concentration Field', fontweight='bold')
        ax2.grid(True, alpha=0.3)
        ax2.set_aspect('equal')
        
        # 添加浓度场图例
        legend_elements = []
        
        # 四环素浓度场图例
        if sim.conc_cache_pollutant is not None and np.max(sim.conc_cache_pollutant) > 0:
            from matplotlib.patches import Patch
            legend_elements.append(Patch(facecolor='red', alpha=0.7, label='Tetracycline Concentration'))
        
        # DNA-aTF复合物浓度场图例
        if sim.conc_cache_aTF is not None and np.max(sim.conc_cache_aTF) > 0:
            from matplotlib.patches import Patch
            legend_elements.append(Patch(facecolor='blue', alpha=0.6, label='DNA-aTF Complex Concentration'))
        
        # 游离DNA图例
        if sim.free_dnas:
            legend_elements.append(plt.Line2D([0], [0], marker='s', color='w', 
                                            markerfacecolor='lime', markersize=8, 
                                            label='Active DNA (recycleR production)'))
        

        if legend_elements:
            ax2.legend(handles=legend_elements, loc='lower left', fontsize=7, framealpha=0.9)
        

        active_complexes = len([c for c in sim.dna_atf_complexes if c.active])
        free_dnas = len(sim.free_dnas)
        total_recycleR = sum(d.recycleR_count for d in sim.free_dnas)
        free_tetracycline = len([p for p in sim.pollutants if p.reaction_state == 'free'])
        complexed_tetracycline = len([p for p in sim.pollutants if p.reaction_state == 'complexed'])
        
        stats = f"""Time: {frame*0.1:.1f}s
DNA-aTF Complex: {active_complexes} (Repressed)
Free DNA: {free_dnas} (Transcriptionally Active)
aTF Displacement: {sim.reaction_stats['atf_displacements']}
Transcription Events: {sim.reaction_stats['transcriptions']}
recycleR Production: {sim.reaction_stats['recycleR_productions']}
Tet-aTF Complex: {complexed_tetracycline}
Free Tetracycline: {free_tetracycline}"""
        
        ax2.text(0.98, 0.02, stats, transform=ax2.transAxes,
                verticalalignment='bottom', horizontalalignment='right', fontsize=7,
                bbox=dict(boxstyle="round,pad=0.3", facecolor="white", alpha=0.9))
        
        # 更新仿真
        sim.update()
        
        # 进度输出
        if frame % 20 == 0:
            print(f"📊 Frame {frame}: {len(sim.binding_events)} reactions")
    
    # 创建动画
    interval = 80  # 适中的速度
    frames = 500   # 较多帧数
    print("🎬 Creating animation...")
    
    ani = animation.FuncAnimation(fig, animate, frames=frames, interval=interval, blit=False, repeat=True)
    
    plt.tight_layout()
    plt.show()
    
    return ani



def main():
    """Main function"""
    print("=" * 70)
    print("🧬 Strand Displacement Sensing Layer Simulation")
    print("=" * 70)
    print("🔧 Correct Biological Reaction Mechanism Implemented:")
    print("   Initial State: DNA-aTF complexes (all transcriptionally repressed)")
    print("   1. Tetracycline + DNA-aTF → Free DNA + Tet-aTF complex (aTF displacement)")
    print("   2. RNA Polymerase + Free DNA → recycleR product (transcription initiation)")
    print("   3. recycleR signal indicates successful tetracycline detection")
    print("=" * 70)
    
    print("\n🚀 Starting simulation...")
    
    try:
        # 创建动画
        animation_obj = create_animation()
        
        print("\n🎉 Simulation started successfully!")
        input("\n⏸️  Press Enter to exit...")
            
    except KeyboardInterrupt:
        print("\n⏹️  Simulation stopped")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("🔧 Troubleshooting suggestions:")
        print("  1. Check matplotlib installation")
        print("  2. Try running: pip install --upgrade matplotlib")
        
        input("Press Enter to exit...")

if __name__ == "__main__":
    main() 