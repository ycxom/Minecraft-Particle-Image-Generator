// ==================== 数据包生成器 ====================
import { AppState } from './state.js';

export class DatapackGenerator {
    constructor(commandGenerator, particleGenerator) {
        this.commandGenerator = commandGenerator;
        this.particleGenerator = particleGenerator;
    }

    /**
     * 获取当前速度倍率设置
     * @returns {number} 速度倍率 (0.25x - 4x)
     */
    getSpeedMultiplier() {
        const speedSelect = document.getElementById('speed-multiplier');
        if (speedSelect) {
            return parseFloat(speedSelect.value) || 1.0;
        }
        
        // 向后兼容：如果没有速度倍率控件，尝试从旧的 frame-repeat 控件计算
        const frameRepeatEl = document.getElementById('frame-repeat');
        if (frameRepeatEl) {
            const frameRepeat = parseInt(frameRepeatEl.value) || 3;
            // 将旧的重复次数转换为速度倍率（粗略估算）
            // frameRepeat=1 -> 4x, frameRepeat=3 -> 1x, frameRepeat=6 -> 0.5x
            return Math.max(0.25, Math.min(4.0, 3.0 / frameRepeat));
        }
        
        return 1.0; // 默认原速
    }

    /**
     * 计算有效帧延迟（应用速度倍率后）
     * @param {number} originalTicks - 原始延迟（ticks）
     * @param {number} speedMultiplier - 速度倍率
     * @returns {number} 有效延迟（ticks，最小为1）
     */
    calculateEffectiveDelay(originalTicks, speedMultiplier) {
        const adjusted = Math.round(originalTicks / speedMultiplier);
        return Math.max(1, adjusted); // 最小 1 tick
    }

    async generate() {
        if (!AppState.frames.length) {
            alert("请先上传图片！");
            return;
        }
        
        const zip = new JSZip();
        const ns = document.getElementById('namespace').value || 'art';
        const ver = document.getElementById('version-select').value;
        const packName = `pixel_${ns}`;
        const root = zip.folder(packName);
        const format = (ver === 'new') ? 48 : 15;
        
        root.file("pack.mcmeta", JSON.stringify({
            pack: { pack_format: format, description: "3D Particle Art" }
        }));
        
        const funcFolder = root.folder("data").folder(ns).folder("function");

        if (!AppState.isAnim) {
            this.generateStatic(funcFolder);
        } else {
            this.generateAnimation(funcFolder, ns);
        }

        const blob = await zip.generateAsync({ type: "blob" });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${packName}.zip`;
        a.click();
        
        const info = AppState.isAnim ? `动画序列 (${AppState.frames.length} 帧)` : "静态画";
        alert(`✅ ${info} 数据包已生成！\n\n请查看页面右下角的说明书进行安装。`);
    }

    generateStatic(funcFolder) {
        if (!AppState.currentFrameGen) this.particleGenerator.update();
        // 静态图片使用默认延迟
        const lines = this.commandGenerator.generate(AppState.currentFrameGen, 2);
        funcFolder.file("draw.mcfunction", lines.join('\n'));
    }

    generateAnimation(funcFolder, ns) {
        const originalIndex = AppState.currentFrameIndex;
        const animMode = document.getElementById('anim-mode')?.value || 'datapack';
        
        if (animMode === 'commandblock') {
            this.generateCommandBlockAnimation(funcFolder, ns);
        } else {
            this.generateDatapackAnimation(funcFolder, ns);
        }

        AppState.currentFrameIndex = originalIndex;
    }

    generateDatapackAnimation(funcFolder, ns) {
        const ver = document.getElementById('version-select').value;
        const clearParticles = document.getElementById('clear-particles')?.checked || false;
        const speedMultiplier = this.getSpeedMultiplier();
        
        console.log(`生成数据包动画，速度倍率: ${speedMultiplier}x`);
        
        // 生成每一帧
        for (let i = 0; i < AppState.frames.length; i++) {
            AppState.currentFrameIndex = i;
            this.particleGenerator.update();
            
            // 获取当前帧的延迟信息
            const frame = AppState.frames[i];
            const originalDelay = frame.delayTicks || 2;
            const effectiveDelay = this.calculateEffectiveDelay(originalDelay, speedMultiplier);
            
            // 传递延迟信息给命令生成器
            const lines = this.commandGenerator.generate(AppState.currentFrameGen, effectiveDelay);
            
            // 如果是基岩版且需要清理，添加清理命令
            if (ver === 'bedrock' && clearParticles && i > 0) {
                const prevIndex = (i - 1 + AppState.frames.length) % AppState.frames.length;
                AppState.currentFrameIndex = prevIndex;
                this.particleGenerator.update();
                const clearLines = this.generateClearCommands(AppState.currentFrameGen);
                lines.unshift(...clearLines);
            }
            
            funcFolder.file(`frames/frame_${i}.mcfunction`, lines.join('\n'));
            
            // 生成粒子重复函数（用于延长显示时间）
            const enhanceParticles = document.getElementById('enhance-particles')?.checked || false;
            if (enhanceParticles && effectiveDelay > 2) {
                this.generateParticleRefreshFunctions(funcFolder, ns, i, lines, effectiveDelay);
            }
        }
        
        // 生成帧处理函数（每帧使用独立的延迟）
        for (let i = 0; i < AppState.frames.length; i++) {
            const nextFrame = (i + 1) % AppState.frames.length;
            const frame = AppState.frames[i];
            const originalDelay = frame.delayTicks || 2;
            const effectiveDelay = this.calculateEffectiveDelay(originalDelay, speedMultiplier);
            
            console.log(`帧 ${i}: 原始延迟 ${originalDelay} ticks -> 有效延迟 ${effectiveDelay} ticks`);
            
            const handlerCmds = [
                `function ${ns}:frames/frame_${i}`
            ];
            
            // 如果延迟较长且启用了粒子增强，启动粒子刷新
            const enhanceParticles = document.getElementById('enhance-particles')?.checked || false;
            if (enhanceParticles && effectiveDelay > 2) {
                handlerCmds.push(`function ${ns}:refresh/start_refresh_${i}`);
            }
            
            handlerCmds.push(
                `scoreboard players set #frame ${ns}_anim ${nextFrame}`,
                `schedule function ${ns}:loop ${effectiveDelay}t`
            );
            
            funcFolder.file(`handlers/handler_${i}.mcfunction`, handlerCmds.join('\n'));
        }
        
        // 生成循环控制器（调用对应帧的 handler）
        const loopCmds = [];
        for (let i = 0; i < AppState.frames.length; i++) {
            loopCmds.push(`execute if score #frame ${ns}_anim matches ${i} run function ${ns}:handlers/handler_${i}`);
        }
        funcFolder.file("loop.mcfunction", loopCmds.join('\n'));
        
        // 播放函数（简化，不再需要 repeat 计数）
        const playCmds = [
            `scoreboard objectives add ${ns}_anim dummy`,
            `scoreboard players set #frame ${ns}_anim 0`,
            `function ${ns}:loop`
        ];
        funcFolder.file("play.mcfunction", playCmds.join('\n'));
        
        // 命令方块兼容播放函数
        const playCmdCmds = [
            `scoreboard objectives add ${ns}_anim dummy`,
            `scoreboard players set #frame ${ns}_anim 0`,
            `scoreboard players set #playing ${ns}_anim 1`
        ];
        funcFolder.file("play_cmd.mcfunction", playCmdCmds.join('\n'));
        
        // 停止函数（清理所有 schedule）
        const stopCmds = [
            `schedule clear ${ns}:loop`,
            `scoreboard players set #playing ${ns}_anim 0`
        ];
        
        // 清理所有刷新函数
        for (let i = 0; i < AppState.frames.length; i++) {
            const frame = AppState.frames[i];
            const originalDelay = frame.delayTicks || 2;
            const effectiveDelay = this.calculateEffectiveDelay(originalDelay, speedMultiplier);
            if (effectiveDelay > 2) {
                stopCmds.push(`schedule clear ${ns}:refresh/refresh_${i}_1`);
                stopCmds.push(`schedule clear ${ns}:refresh/refresh_${i}_2`);
            }
        }
        
        funcFolder.file("stop.mcfunction", stopCmds.join('\n'));
        
        // 重启函数
        funcFolder.file("restart.mcfunction", `function ${ns}:stop\nfunction ${ns}:play`);
    }

    /**
     * 生成粒子刷新函数，用于延长粒子显示时间
     */
    generateParticleRefreshFunctions(funcFolder, ns, frameIndex, particleCommands, effectiveDelay) {
        // 计算刷新间隔
        const refreshInterval = Math.max(1, Math.floor(effectiveDelay / 3));
        
        // 生成启动刷新的函数
        const startRefreshCmds = [
            `schedule function ${ns}:refresh/refresh_${frameIndex}_1 ${refreshInterval}t`,
            `schedule function ${ns}:refresh/refresh_${frameIndex}_2 ${refreshInterval * 2}t`
        ];
        funcFolder.file(`refresh/start_refresh_${frameIndex}.mcfunction`, startRefreshCmds.join('\n'));
        
        // 生成刷新函数（重复显示粒子）
        funcFolder.file(`refresh/refresh_${frameIndex}_1.mcfunction`, particleCommands.join('\n'));
        funcFolder.file(`refresh/refresh_${frameIndex}_2.mcfunction`, particleCommands.join('\n'));
    }

    generateClearCommands(data) {
        const { positions } = data;
        const lines = [];
        const fmt = n => n.toFixed(3).replace(/\.?0+$/, "");

        for (let i = 0; i < positions.length; i += 3) {
            const x = fmt(positions[i]);
            const y = fmt(positions[i + 1]);
            const z = fmt(positions[i + 2]);
            lines.push(`setblock ~${x} ~${y} ~${z} air`);
        }
        return lines;
    }

    generateCommandBlockAnimation(funcFolder, ns) {
        const ver = document.getElementById('version-select').value;
        const clearParticles = document.getElementById('clear-particles')?.checked || false;
        const speedMultiplier = this.getSpeedMultiplier();
        
        console.log(`生成命令方块动画，速度倍率: ${speedMultiplier}x`);
        
        // 计算每帧的有效延迟
        const frameDelays = [];
        for (let i = 0; i < AppState.frames.length; i++) {
            const frame = AppState.frames[i];
            const originalDelay = frame.delayTicks || 2;
            const effectiveDelay = this.calculateEffectiveDelay(originalDelay, speedMultiplier);
            frameDelays.push(effectiveDelay);
        }
        
        // 生成每一帧的粒子命令
        const allFrameCommands = [];
        for (let i = 0; i < AppState.frames.length; i++) {
            AppState.currentFrameIndex = i;
            this.particleGenerator.update();
            
            // 获取当前帧的延迟信息
            const frame = AppState.frames[i];
            const originalDelay = frame.delayTicks || 2;
            const effectiveDelay = this.calculateEffectiveDelay(originalDelay, speedMultiplier);
            
            // 传递延迟信息给命令生成器
            const lines = this.commandGenerator.generate(AppState.currentFrameGen, effectiveDelay);
            
            // 如果是基岩版且需要清理，添加清理命令
            if (ver === 'bedrock' && clearParticles && i > 0) {
                const prevIndex = (i - 1 + AppState.frames.length) % AppState.frames.length;
                AppState.currentFrameIndex = prevIndex;
                this.particleGenerator.update();
                const clearLines = this.generateClearCommands(AppState.currentFrameGen);
                lines.unshift(...clearLines);
            }
            
            allFrameCommands.push(lines);
        }
        
        // 生成命令方块链设置函数
        const setupCmds = [
            `# 命令方块链动画设置（每帧独立延迟）`,
            `scoreboard objectives add ${ns}_anim dummy "动画控制"`,
            `scoreboard players set #frame ${ns}_anim 0`,
            `scoreboard players set #playing ${ns}_anim 0`,
            `scoreboard players set #timer ${ns}_anim 0`,
            `tellraw @a {"text":"✅ 动画系统已初始化","color":"green"}`,
            `tellraw @a {"text":"💡 使用原始 GIF 帧延迟，速度倍率: ${speedMultiplier}x","color":"yellow"}`,
            ver === 'bedrock' && !clearParticles ? `tellraw @a {"text":"💡 粒子过渡效果已启用","color":"yellow"}` : ''
        ].filter(Boolean);
        funcFolder.file("setup.mcfunction", setupCmds.join('\n'));
        
        // 生成每一帧的显示函数
        for (let i = 0; i < AppState.frames.length; i++) {
            funcFolder.file(`frames/frame_${i}.mcfunction`, allFrameCommands[i].join('\n'));
        }
        
        // 生成主循环函数（由命令方块调用）
        const tickCmds = [
            `# 检查是否正在播放`,
            `execute if score #playing ${ns}_anim matches 1 run function ${ns}:tick_play`
        ];
        funcFolder.file("tick.mcfunction", tickCmds.join('\n'));
        
        // 生成播放逻辑（使用每帧独立延迟）
        const tickPlayCmds = [];
        
        // 显示当前帧
        for (let i = 0; i < AppState.frames.length; i++) {
            tickPlayCmds.push(`execute if score #frame ${ns}_anim matches ${i} run function ${ns}:frames/frame_${i}`);
        }
        
        // 增加计时器
        tickPlayCmds.push(`scoreboard players add #timer ${ns}_anim 1`);
        
        // 检查每帧的延迟时间
        for (let i = 0; i < AppState.frames.length; i++) {
            const delay = frameDelays[i];
            const nextFrame = (i + 1) % AppState.frames.length;
            tickPlayCmds.push(`execute if score #frame ${ns}_anim matches ${i} if score #timer ${ns}_anim matches ${delay}.. run scoreboard players set #frame ${ns}_anim ${nextFrame}`);
            tickPlayCmds.push(`execute if score #frame ${ns}_anim matches ${i} if score #timer ${ns}_anim matches ${delay}.. run scoreboard players set #timer ${ns}_anim 0`);
        }
        
        funcFolder.file("tick_play.mcfunction", tickPlayCmds.join('\n'));
        
        // 播放控制函数
        const playCmds = [
            `scoreboard players set #playing ${ns}_anim 1`,
            `scoreboard players set #frame ${ns}_anim 0`,
            `scoreboard players set #timer ${ns}_anim 0`,
            `tellraw @a {"text":"▶️ 动画开始播放","color":"green"}`
        ];
        funcFolder.file("play.mcfunction", playCmds.join('\n'));
        
        const stopCmds = [
            `scoreboard players set #playing ${ns}_anim 0`,
            `tellraw @a {"text":"⏸️ 动画已暂停","color":"yellow"}`
        ];
        funcFolder.file("stop.mcfunction", stopCmds.join('\n'));
        
        const restartCmds = [
            `scoreboard players set #frame ${ns}_anim 0`,
            `scoreboard players set #timer ${ns}_anim 0`,
            `scoreboard players set #playing ${ns}_anim 1`,
            `tellraw @a {"text":"🔄 动画重新开始","color":"green"}`
        ];
        funcFolder.file("restart.mcfunction", restartCmds.join('\n'));
        
        // 生成命令方块设置说明
        const avgDelay = frameDelays.reduce((sum, delay) => sum + delay, 0) / frameDelays.length;
        const totalDuration = frameDelays.reduce((sum, delay) => sum + delay, 0);
        
        const readmeCmds = [
            `# ==========================================`,
            `# 命令方块链动画设置说明（每帧独立延迟）`,
            `# ==========================================`,
            ``,
            `# 1. 初始化（只需执行一次）`,
            `#    /function ${ns}:setup`,
            ``,
            `# 2. 放置一个循环命令方块，设置为"保持开启"`,
            `#    命令: function ${ns}:tick`,
            `#    延迟: 1 tick (固定)`,
            ``,
            `# 3. 控制命令`,
            `#    播放: /function ${ns}:play`,
            `#    暂停: /function ${ns}:stop`,
            `#    重播: /function ${ns}:restart`,
            ``,
            `# 动画参数：`,
            `# - 总帧数: ${AppState.frames.length} 帧`,
            `# - 速度倍率: ${speedMultiplier}x`,
            `# - 平均帧延迟: ${avgDelay.toFixed(1)} ticks`,
            `# - 总循环时长: ${totalDuration} ticks (${(totalDuration * 50 / 1000).toFixed(1)}秒)`,
            `# - 每帧延迟: ${frameDelays.map((d, i) => `帧${i}=${d}t`).join(', ')}`,
            ``,
            `# 注意事项：`,
            `# - 命令方块必须保持激活状态`,
            `# - 使用原始 GIF 帧延迟，每帧可能有不同的显示时间`,
            `# - 建议在创造模式下设置`,
            ver === 'bedrock' && !clearParticles ? `# - 粒子过渡效果：不清除上一帧，自然消散` : '',
            ver === 'bedrock' && clearParticles ? `# - 清除模式：每帧清除上一帧的方块` : ''
        ].filter(Boolean);
        funcFolder.file("README.txt", readmeCmds.join('\n'));
    }
}
