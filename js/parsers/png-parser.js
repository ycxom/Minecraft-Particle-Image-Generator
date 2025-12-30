// ==================== PNG/APNG 解析器 ====================
import { BaseImageParser } from './base-parser.js';

export class PNGParser extends BaseImageParser {
    async parse(buffer) {
        if (!window.UPNG) {
            throw new Error('UPNG 库未加载');
        }

        const img = UPNG.decode(buffer);
        const rgba = UPNG.toRGBA8(img);
        
        return rgba.map(frameData => 
            this.createImageData(frameData, img.width, img.height)
        );
    }
}
