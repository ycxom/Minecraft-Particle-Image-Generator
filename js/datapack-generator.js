// ==================== 数据包生成器 ====================
import { AppState } from './state.js';

export class DatapackGenerator {
    constructor(commandGenerator, particleGenerator) {
        this.commandGenerator = commandGenerator;
        this.particleGenerator = particleGenerator;
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
        const lines = this.commandGenerator.generate(AppState.currentFrameGen);
        funcFolder.file("draw.mcfunction", lines.join('\n'));
    }

    generateAnimation(funcFolder, ns) {
        const originalIndex = AppState.currentFrameIndex;
        const tickDelay = parseInt(document.getElementById('tick-delay').value) || 2;
        const animMode = document.getElementById('anim-mode')?.value || 'datapack';
        
        if (animMode === 'commandblock') {
            this.generateCommandBlockAnimation(funcFolder, ns, tickDelay);
        } else {
            this.generateDatapackAnimation(funcFolder, ns, tickDelay);
        }

        AppState.currentFrameIndex = originalIndex;
    }

    generateDatapackAnimation(funcFolder, ns, tickDelay) {
        const ver = document.getElementById('version-select').value;
        const clearParticles = document.getElementById('clear-particles')?.checked || false;
        const frameRepeat = parseInt(document.getElementById('frame-repeat')?.value || 1);
        
        // 生成每一帧
        for (let i = 0; i < AppState.frames.length; i++) {
            AppState.currentFrameIndex = i;
            this.particleGenerator.update();
            const lines = this.commandGenerator.generate(AppState.currentFrameGen);
            
            // 如果是基岩版且需要清理，添加清理命令
            if (ver === 'bedrock' && clearParticles && i > 0) {
                const prevIndex = (i - 1 + AppState.frames.length) % AppState.frames.length;
                AppState.currentFrameIndex = prevIndex;
                this.particleGenerator.update();
                const clearLines = this.generateClearCommands(AppState.currentFrameGen);
                lines.unshift(...clearLines);
            }
            
            funcFolder.file(`frames/frame_${i}.mcfunction`, lines.join('\n'));
        }
        
        // 生成循环控制器（支持帧重复）
        const loopCmds = [];
        
        if (frameRepeat > 1) {
            // 使用重复计数器
            for (let i = 0; i < AppState.frames.length; i++) {
                const nextFrame = (i + 1) % AppState.frames.length;
                loopCmds.push(
                    `# 帧 ${i}`,
                    `execute if score #frame ${ns}_anim matches ${i} run function ${ns}:frames/frame_${i}`,
                    `execute if score #frame ${ns}_anim matches ${i} run scoreboard players add #repeat ${ns}_anim 1`,
                    `execute if score #frame ${ns}_anim matches ${i} if score #repeat ${ns}_anim matches ${frameRepeat}.. run scoreboard players set #frame ${ns}_anim ${nextFrame}`,
                    `execute if score #frame ${ns}_anim matches ${i} if score #repeat ${ns}_anim matches ${frameRepeat}.. run scoreboard players set #repeat ${ns}_anim 0`,
                    `execute if score #frame ${ns}_anim matches ${i} run schedule function ${ns}:loop ${tickDelay}t`,
                    ``
                );
            }
        } else {
            // 不重复，直接切换
            for (let i = 0; i < AppState.frames.length; i++) {
                const nextFrame = (i + 1) % AppState.frames.length;
                loopCmds.push(
                    `execute if score #frame ${ns}_anim matches ${i} run function ${ns}:frames/frame_${i}`,
                    `execute if score #frame ${ns}_anim matches ${i} run scoreboard players set #frame ${ns}_anim ${nextFrame}`,
                    `execute if score #frame ${ns}_anim matches ${i} run schedule function ${ns}:loop ${tickDelay}t`
                );
            }
        }
        
        funcFolder.file("loop.mcfunction", loopCmds.join('\n'));
        
        // 播放函数
        const playCmds = [
            `scoreboard objectives add ${ns}_anim dummy`,
            `scoreboard players set #frame ${ns}_anim 0`,
            frameRepeat > 1 ? `scoreboard players set #repeat ${ns}_anim 0` : '',
            `function ${ns}:loop`
        ].filter(Boolean);
        funcFolder.file("play.mcfunction", playCmds.join('\n'));
        
        // 停止函数
        funcFolder.file("stop.mcfunction", `schedule clear ${ns}:loop`);
        
        // 重启函数
        funcFolder.file("restart.mcfunction", `function ${ns}:stop\nfunction ${ns}:play`);
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

    generateCommandBlockAnimation(funcFolder, ns, tickDelay) {
        const ver = document.getElementById('version-select').value;
        const clearParticles = document.getElementById('clear-particles')?.checked || false;
        const frameRepeat = parseInt(document.getElementById('frame-repeat')?.value || 1);
        
        // 生成每一帧的粒子命令
        const allFrameCommands = [];
        for (let i = 0; i < AppState.frames.length; i++) {
            AppState.currentFrameIndex = i;
            this.particleGenerator.update();
            const lines = this.commandGenerator.generate(AppState.currentFrameGen);
            
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
            `# 命令方块链动画设置`,
            `scoreboard objectives add ${ns}_anim dummy "动画控制"`,
            `scoreboard players set #frame ${ns}_anim 0`,
            `scoreboard players set #playing ${ns}_anim 0`,
            frameRepeat > 1 ? `scoreboard players set #repeat ${ns}_anim 0` : '',
            `tellraw @a {"text":"✅ 动画系统已初始化","color":"green"}`,
            frameRepeat > 1 ? `tellraw @a {"text":"💡 每帧重复 ${frameRepeat} 次","color":"yellow"}` : '',
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
        
        // 生成播放逻辑（支持帧重复）
        const tickPlayCmds = [];
        
        if (frameRepeat > 1) {
            // 显示当前帧
            for (let i = 0; i < AppState.frames.length; i++) {
                tickPlayCmds.push(`execute if score #frame ${ns}_anim matches ${i} run function ${ns}:frames/frame_${i}`);
            }
            
            // 增加重复计数
            tickPlayCmds.push(`scoreboard players add #repeat ${ns}_anim 1`);
            
            // 检查是否达到重复次数
            tickPlayCmds.push(`execute if score #repeat ${ns}_anim matches ${frameRepeat}.. run scoreboard players add #frame ${ns}_anim 1`);
            tickPlayCmds.push(`execute if score #repeat ${ns}_anim matches ${frameRepeat}.. run scoreboard players set #repeat ${ns}_anim 0`);
            
            // 循环到第一帧
            tickPlayCmds.push(`execute if score #frame ${ns}_anim matches ${AppState.frames.length} run scoreboard players set #frame ${ns}_anim 0`);
        } else {
            // 不重复，直接切换
            for (let i = 0; i < AppState.frames.length; i++) {
                tickPlayCmds.push(`execute if score #frame ${ns}_anim matches ${i} run function ${ns}:frames/frame_${i}`);
            }
            tickPlayCmds.push(`scoreboard players add #frame ${ns}_anim 1`);
            tickPlayCmds.push(`execute if score #frame ${ns}_anim matches ${AppState.frames.length} run scoreboard players set #frame ${ns}_anim 0`);
        }
        
        funcFolder.file("tick_play.mcfunction", tickPlayCmds.join('\n'));
        
        // 播放控制函数
        const playCmds = [
            `scoreboard players set #playing ${ns}_anim 1`,
            `scoreboard players set #frame ${ns}_anim 0`,
            frameRepeat > 1 ? `scoreboard players set #repeat ${ns}_anim 0` : '',
            `tellraw @a {"text":"▶️ 动画开始播放","color":"green"}`
        ].filter(Boolean);
        funcFolder.file("play.mcfunction", playCmds.join('\n'));
        
        const stopCmds = [
            `scoreboard players set #playing ${ns}_anim 0`,
            `tellraw @a {"text":"⏸️ 动画已暂停","color":"yellow"}`
        ];
        funcFolder.file("stop.mcfunction", stopCmds.join('\n'));
        
        const restartCmds = [
            `scoreboard players set #frame ${ns}_anim 0`,
            frameRepeat > 1 ? `scoreboard players set #repeat ${ns}_anim 0` : '',
            `scoreboard players set #playing ${ns}_anim 1`,
            `tellraw @a {"text":"🔄 动画重新开始","color":"green"}`
        ].filter(Boolean);
        funcFolder.file("restart.mcfunction", restartCmds.join('\n'));
        
        // 生成命令方块设置说明
        const readmeCmds = [
            `# ==========================================`,
            `# 命令方块链动画设置说明`,
            `# ==========================================`,
            ``,
            `# 1. 初始化（只需执行一次）`,
            `#    /function ${ns}:setup`,
            ``,
            `# 2. 放置一个循环命令方块，设置为"保持开启"`,
            `#    命令: function ${ns}:tick`,
            `#    延迟: ${tickDelay} tick`,
            ``,
            `# 3. 控制命令`,
            `#    播放: /function ${ns}:play`,
            `#    暂停: /function ${ns}:stop`,
            `#    重播: /function ${ns}:restart`,
            ``,
            `# 动画参数：`,
            `# - 总帧数: ${AppState.frames.length} 帧`,
            `# - 每帧重复: ${frameRepeat} 次`,
            `# - Tick 间隔: ${tickDelay} tick`,
            `# - 实际播放速度: ${tickDelay * frameRepeat} tick/帧`,
            ``,
            `# 注意事项：`,
            `# - 命令方块必须保持激活状态`,
            `# - 延迟设置决定播放速度（越小越快）`,
            `# - 建议在创造模式下设置`,
            frameRepeat > 1 ? `# - 帧重复功能：每帧显示 ${frameRepeat} 次，减慢播放速度` : '',
            ver === 'bedrock' && !clearParticles ? `# - 粒子过渡效果：不清除上一帧，自然消散` : '',
            ver === 'bedrock' && clearParticles ? `# - 清除模式：每帧清除上一帧的方块` : ''
        ].filter(Boolean);
        funcFolder.file("README.txt", readmeCmds.join('\n'));
    }
}
