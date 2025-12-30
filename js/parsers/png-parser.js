// ==================== PNG/APNG 解析器 ====================
import { BaseImageParser } from './base-parser.js';

export class PNGParser extends BaseImageParser {
    // 使用与 GIFParser 相同的默认值
    static DEFAULT_DELAY_TICKS = 2;
    
    async parse(buffer) {
        if (!window.UPNG) {
            throw new Error('UPNG 库未加载');
        }

        const img = UPNG.decode(buffer);
        const rgba = UPNG.toRGBA8(img);
        
        // 检查是否有延迟信息（APNG）
        const delays = img.delays || [];
        
        return rgba.map((frameData, index) => {
            const imageData = this.createImageData(frameData, img.width, img.height);
            
            // 获取帧延迟（APNG 延迟单位是毫秒）
            const delayMs = delays[index] || (PNGParser.DEFAULT_DELAY_TICKS * 50);
            const delayTicks = Math.max(1, Math.round(delayMs / 50));
            
            return {
                imageData: imageData,
                delayMs: delayMs,
                delayTicks: delayTicks
            };
        });
    }
}
