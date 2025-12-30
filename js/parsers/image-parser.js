// ==================== 图片解析器工厂 ====================
import { GIFParser } from './gif-parser.js';
import { PNGParser } from './png-parser.js';
import { StaticImageParser } from './static-parser.js';
import { AppState } from '../state.js';

export class ImageParser {
    constructor() {
        this.gifParser = new GIFParser();
        this.pngParser = new PNGParser();
        this.staticParser = new StaticImageParser();
    }

    async parseFile(file) {
        AppState.frames = [];
        AppState.currentFrameIndex = 0;
        
        const buffer = await file.arrayBuffer();
        const type = file.type;

        try {
            let frames;
            
            if (type === 'image/gif') {
                frames = await this.gifParser.parse(buffer);
            } else if (type === 'image/png' || type === 'image/apng') {
                frames = await this.pngParser.parse(buffer);
            } else {
                frames = await this.staticParser.parse(file);
            }
            
            AppState.frames = frames;
            AppState.isAnim = frames.length > 1;
            
            return {
                success: true,
                frameCount: frames.length,
                isAnimation: AppState.isAnim
            };
        } catch (err) {
            console.error('图片解析失败:', err);
            throw new Error(`解析失败: ${err.message}`);
        }
    }
}
