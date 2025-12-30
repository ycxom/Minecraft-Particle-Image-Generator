// ==================== 导出处理器 ====================
import { AppState } from './state.js';

export class ExportHandlers {
    constructor(commandGenerator, particleGenerator) {
        this.commandGenerator = commandGenerator;
        this.particleGenerator = particleGenerator;
    }

    copyRawCommands() {
        if (AppState.isAnim) {
            alert("动画模式数据过多，请使用下载数据包功能！");
            return;
        }
        
        if (!AppState.currentFrameGen) this.particleGenerator.update();
        const lines = this.commandGenerator.generate(AppState.currentFrameGen);
        
        navigator.clipboard.writeText(lines.join('\n'))
            .then(() => alert(`✅ 已复制 ${lines.length} 行指令！`))
            .catch(err => alert(`复制失败: ${err.message}`));
    }

    generateOneCommand() {
        if (AppState.isAnim) {
            alert("动画模式无法生成单指令！");
            return;
        }
        
        if (!AppState.currentFrameGen) this.particleGenerator.update();
        const lines = this.commandGenerator.generate(AppState.currentFrameGen);
        
        if (lines.length > 400) {
            alert("粒子过多，无法生成单指令。\n建议减小图片宽度或使用数据包。");
            return;
        }
        
        const passengers = [];
        lines.forEach(cmd => {
            const safeCmd = cmd.replace(/"/g, '\\"');
            passengers.push(`{id:"command_block_minecart",Command:"${safeCmd}"}`);
        });
        passengers.push(`{id:"command_block_minecart",Command:"setblock ~ ~1 ~ command_block{auto:1,Command:\\"fill ~ ~ ~ ~ ~-2 ~ air\\"}"}`);
        passengers.push(`{id:"command_block_minecart",Command:"kill @e[type=command_block_minecart,distance=..1]"}`);
        
        const oneCmd = `summon falling_block ~ ~1 ~ {BlockState:{Name:"activator_rail"},Passengers:[${passengers.join(',')}]}`;
        
        navigator.clipboard.writeText(oneCmd)
            .then(() => alert("✅ 单指令已复制！"))
            .catch(err => alert(`复制失败: ${err.message}`));
    }

    setAngle(x, y, z) {
        ['x', 'y', 'z'].forEach((ax, i) => {
            const rangeEl = document.getElementById(`rot-${ax}`);
            const numEl = document.getElementById(`rot-${ax}-num`);
            if (rangeEl) rangeEl.value = arguments[i];
            if (numEl) numEl.value = arguments[i];
        });
        
        if (AppState.isAnim) AppState.currentFrameIndex = 0;
        this.particleGenerator.update();
    }
}
