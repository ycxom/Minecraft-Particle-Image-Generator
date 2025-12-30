// ==================== 命令生成器 ====================
export class CommandGenerator {
    generate(data) {
        const ver = document.getElementById('version-select').value;
        const { positions, colors } = data;
        const lines = [];
        const fmt = n => n.toFixed(3).replace(/\.?0+$/, "");

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
                lines.push(`particle dust{color:[${safeR},${g},${b}],scale:1} ~${x} ~${y} ~${z} 0 0 0 0 1`);
            } else {
                lines.push(`particle dust ${safeR} ${g} ${b} 1 ~${x} ~${y} ~${z} 0 0 0 0 1`);
            }
        }
        return lines;
    }
}
