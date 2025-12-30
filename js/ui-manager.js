// ==================== UI 管理器 ====================
import { AppState } from './state.js';

export class UIManager {
    constructor(imageParser, particleGenerator) {
        this.imageParser = imageParser;
        this.particleGenerator = particleGenerator;
    }

    updateMode(isAnim) {
        const animUI = document.getElementById('anim-controls');
        const guideStatic = document.getElementById('guide-static');
        const guideAnim = document.getElementById('guide-anim');
        const btnCopy = document.getElementById('btn-copy');
        const btnOoc = document.getElementById('btn-ooc');
        const frameInfo = document.getElementById('frame-info');

        if (isAnim) {
            animUI.style.display = 'block';
            guideStatic.style.display = 'none';
            guideAnim.style.display = 'block';
            btnCopy.disabled = true;
            btnCopy.title = "动画模式不支持复制";
            btnOoc.disabled = true;
            btnOoc.title = "动画模式不支持单指令";
            
            // 显示帧信息面板
            if (frameInfo) {
                frameInfo.style.display = 'block';
                this.updateFrameInfo();
            }
        } else {
            animUI.style.display = 'none';
            guideStatic.style.display = 'block';
            guideAnim.style.display = 'none';
            btnCopy.disabled = false;
            btnCopy.title = "复制指令内容";
            btnOoc.disabled = false;
            btnOoc.title = "生成单指令";
            
            // 隐藏帧信息面板
            if (frameInfo) {
                frameInfo.style.display = 'none';
            }
        }
    }

    /**
     * 更新帧信息显示
     */
    updateFrameInfo() {
        if (!AppState.isAnim || !AppState.frames.length) return;
        
        const totalFramesEl = document.getElementById('total-frames');
        const avgDelayEl = document.getElementById('avg-delay');
        const totalDurationEl = document.getElementById('total-duration');
        const variableNoticeEl = document.getElementById('variable-timing-notice');
        
        if (totalFramesEl) {
            totalFramesEl.textContent = AppState.frames.length;
        }
        
        if (avgDelayEl) {
            avgDelayEl.textContent = `${AppState.avgDelayTicks.toFixed(1)} ticks (${(AppState.avgDelayTicks * 50).toFixed(0)}ms)`;
        }
        
        if (totalDurationEl) {
            const speedMultiplier = this.getSpeedMultiplier();
            const effectiveDuration = AppState.totalDuration / speedMultiplier;
            const durationMs = effectiveDuration * 50;
            const durationSec = (durationMs / 1000).toFixed(1);
            totalDurationEl.textContent = `${effectiveDuration.toFixed(0)} ticks (${durationSec}s)`;
        }
        
        // 检查是否有可变延迟
        if (variableNoticeEl && AppState.frames.length > 1) {
            const delays = AppState.frames.map(f => f.delayTicks || 2);
            const minDelay = Math.min(...delays);
            const maxDelay = Math.max(...delays);
            const hasVariableDelay = (maxDelay - minDelay) > 1; // 差异超过1 tick
            
            variableNoticeEl.style.display = hasVariableDelay ? 'block' : 'none';
        }
    }

    /**
     * 获取当前速度倍率
     */
    getSpeedMultiplier() {
        const speedSelect = document.getElementById('speed-multiplier');
        return speedSelect ? parseFloat(speedSelect.value) || 1.0 : 1.0;
    }

    updateStats(text) {
        const statsEl = document.getElementById('stats');
        if (statsEl) statsEl.innerHTML = text;
    }

    setupEventListeners() {
        // 文件上传
        const fileInput = document.getElementById('file');
        const dropZone = document.getElementById('drop-zone');
        
        if (dropZone && fileInput) {
            dropZone.onclick = () => fileInput.click();
            fileInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                this.updateStats("正在解析...");
                
                try {
                    await this.imageParser.parseFile(file);
                    this.updateMode(AppState.isAnim);
                    
                    // 初始化速度倍率
                    AppState.speedMultiplier = this.getSpeedMultiplier();
                    
                    const stats = this.particleGenerator.update();
                    this.updateStats(stats);
                } catch (err) {
                    console.error(err);
                    alert("解析失败，请使用标准格式图片。");
                    this.updateStats("请上传图片 (支持 GIF/APNG)");
                }
            };
        }

        // 参数同步
        this.syncInputs('width', 'width-num');
        this.syncInputs('rot-x', 'rot-x-num');
        this.syncInputs('rot-y', 'rot-y-num');
        this.syncInputs('rot-z', 'rot-z-num');
        this.syncInputs('off-x', 'off-x-num');
        this.syncInputs('off-y', 'off-y-num');
        this.syncInputs('off-z', 'off-z-num');
        
        const spacingEl = document.getElementById('spacing');
        if (spacingEl) {
            spacingEl.addEventListener('input', () => {
                if (AppState.isAnim) AppState.currentFrameIndex = 0;
                const stats = this.particleGenerator.update();
                this.updateStats(stats);
            });
        }
        
        // 速度倍率变化监听
        const speedMultiplierEl = document.getElementById('speed-multiplier');
        if (speedMultiplierEl) {
            speedMultiplierEl.addEventListener('change', () => {
                // 更新 AppState 中的速度倍率
                AppState.speedMultiplier = this.getSpeedMultiplier();
                
                // 更新帧信息显示
                if (AppState.isAnim) {
                    this.updateFrameInfo();
                }
                
                console.log(`速度倍率已更改为: ${AppState.speedMultiplier}x`);
            });
        }
    }

    syncInputs(id1, id2) {
        const e1 = document.getElementById(id1);
        const e2 = document.getElementById(id2);
        
        if (!e1 || !e2) return;
        
        e1.addEventListener('input', () => {
            e2.value = e1.value;
            if (AppState.isAnim) AppState.currentFrameIndex = 0;
            const stats = this.particleGenerator.update();
            this.updateStats(stats);
        });
        
        e2.addEventListener('input', () => {
            e1.value = e2.value;
            if (AppState.isAnim) AppState.currentFrameIndex = 0;
            const stats = this.particleGenerator.update();
            this.updateStats(stats);
        });
    }
}
