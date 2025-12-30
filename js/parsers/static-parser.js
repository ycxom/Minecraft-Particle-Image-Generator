// ==================== 静态图片解析器 ====================
import { BaseImageParser } from './base-parser.js';

export class StaticImageParser extends BaseImageParser {
    // 静态图片使用默认延迟（虽然不会用到）
    static DEFAULT_DELAY_TICKS = 2;
    
    async parse(file) {
        const bmp = await createImageBitmap(file);
        const cvs = document.createElement('canvas');
        cvs.width = bmp.width;
        cvs.height = bmp.height;
        const ctx = cvs.getContext('2d');
        ctx.drawImage(bmp, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, bmp.width, bmp.height);
        
        // 返回包含延迟信息的帧对象，保持一致性
        return [{
            imageData: imageData,
            delayMs: StaticImageParser.DEFAULT_DELAY_TICKS * 50,
            delayTicks: StaticImageParser.DEFAULT_DELAY_TICKS
        }];
    }
}
