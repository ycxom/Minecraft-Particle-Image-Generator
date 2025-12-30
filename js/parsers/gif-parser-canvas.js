// ==================== Canvas 降级 GIF 解析器 ====================
import { BaseImageParser } from './base-parser.js';

/**
 * 使用纯 Canvas API 的 GIF 解析器
 * 注意：只能获取第一帧，无法解析动画
 */
export class CanvasGIFParser extends BaseImageParser {
    // 使用与 GIFParser 相同的默认值
    static DEFAULT_DELAY_TICKS = 2;
    
    async parse(buffer) {
        const blob = new Blob([buffer], { type: 'image/gif' });
        const imageData = await this.createCanvasFromBlob(blob);
        
        console.warn('使用 Canvas 降级方案，只能获取 GIF 第一帧');
        
        // 返回包含延迟信息的帧对象，保持与 GIFParser 一致
        return [{
            imageData: imageData,
            delayMs: CanvasGIFParser.DEFAULT_DELAY_TICKS * 50,
            delayTicks: CanvasGIFParser.DEFAULT_DELAY_TICKS
        }];
    }
}
