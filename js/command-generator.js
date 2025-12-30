// ==================== 命令生成器 ====================
export class CommandGenerator {
    /**
     * 生成粒子命令
     * @param {Object} data - 粒子数据 { positions, colors, count }
     * @param {number} lifetimeTicks - 粒子存在时间（ticks），用于计算粒子参数
     */
    generate(data, lifetimeTicks = null) {
        const ver = document.getElementById('version-select').value;
        const enhanceParticles = document.getElementById('enhance-particles')?.checked || false;
        const { positions, colors } = data;
        const lines = [];
        const fmt = n => n.toFixed(3).replace(/\.?0+$/, "");

        // 计算粒子参数以延长存在时间
        const particleParams = enhanceParticles ? 
            this.calculateEnhancedParticleParams(lifetimeTicks) : 
            this.calculateBasicParticleParams();

        for (let i = 0; i < positions.length; i += 3) {
            const x = fmt(positions[i]);
            const y = fmt(positions[i + 1]);
            const z = fmt(positions[i + 2]);
            const r = colors[i].toFixed(3);
            const g = colors[i + 1].toFixed(3);
            const b = colors[i + 2].toFixed(3);
            const safeR = (parseFloat(r) === 0 && parseFloat(g) === 0 && parseFloat(b) === 0) ? "0.001" : r;

            if (ver === 'bedrock') {
                lines.push(`setblock ~${x} ~${y} ~${z} concrete ["color":"white"]`);
            } else if (ver === 'new') {
                // 1.20.5+ 新版本语法，支持更多参数
                const forceParam = enhanceParticles ? ' force' : '';
                lines.push(`particle dust{color:[${safeR},${g},${b}],scale:${particleParams.scale}} ~${x} ~${y} ~${z} ${particleParams.deltaX} ${particleParams.deltaY} ${particleParams.deltaZ} ${particleParams.speed} ${particleParams.count}${forceParam}`);
            } else {
                // 1.13-1.20.4 旧版本语法
                const forceParam = enhanceParticles ? ' force' : '';
                lines.push(`particle dust ${safeR} ${g} ${b} ${particleParams.scale} ~${x} ~${y} ~${z} ${particleParams.deltaX} ${particleParams.deltaY} ${particleParams.deltaZ} ${particleParams.speed} ${particleParams.count}${forceParam}`);
            }
        }
        
        return lines;
    }

    /**
     * 计算基础粒子参数（兼容模式）
     */
    calculateBasicParticleParams() {
        return {
            count: 1,
            speed: 0,
            deltaX: 0,
            deltaY: 0,
            deltaZ: 0,
            scale: 1
        };
    }

    /**
     * 计算增强粒子参数以控制存在时间和可见性
     * @param {number} lifetimeTicks - 期望的粒子存在时间（ticks）
     * @returns {Object} 粒子参数
     */
    calculateEnhancedParticleParams(lifetimeTicks) {
        // 默认增强参数
        let params = {
            count: 3,        // 增加粒子数量提高可见性
            speed: 0,        // 速度为0，粒子不移动
            deltaX: 0.02,    // 小范围随机分布
            deltaY: 0.02,
            deltaZ: 0.02,
            scale: 1.2       // 稍微增大粒子尺寸
        };

        if (lifetimeTicks && lifetimeTicks > 2) {
            // 根据帧延迟调整参数
            if (lifetimeTicks >= 10) {
                // 长延迟帧：减少粒子数量，增大尺寸
                params.count = 2;
                params.scale = 1.5;
                params.deltaX = 0.01;
                params.deltaY = 0.01;
                params.deltaZ = 0.01;
            } else if (lifetimeTicks >= 5) {
                // 中等延迟帧：标准参数
                params.count = 3;
                params.scale = 1.2;
            } else {
                // 短延迟帧：增加粒子数量和密度
                params.count = 5;
                params.scale = 1.0;
                params.deltaX = 0.03;
                params.deltaY = 0.03;
                params.deltaZ = 0.03;
            }
        }

        return params;
    }

    /**
     * 生成重复粒子命令（用于延长显示时间）
     * @param {Object} data - 粒子数据
     * @param {number} repeatCount - 重复次数
     * @param {number} intervalTicks - 重复间隔（ticks）
     */
    generateRepeatedParticles(data, repeatCount = 3, intervalTicks = 1) {
        const baseCommands = this.generate(data);
        const allCommands = [];

        for (let repeat = 0; repeat < repeatCount; repeat++) {
            if (repeat === 0) {
                // 第一次立即执行
                allCommands.push(...baseCommands);
            } else {
                // 后续重复执行
                const delay = repeat * intervalTicks;
                baseCommands.forEach(cmd => {
                    allCommands.push(`schedule function ${this.getTempFunctionName(repeat)} ${delay}t`);
                });
            }
        }

        return allCommands;
    }

    /**
     * 生成临时函数名
     */
    getTempFunctionName(index) {
        const ns = document.getElementById('namespace')?.value || 'art';
        return `${ns}:temp_particle_${index}`;
    }
}
