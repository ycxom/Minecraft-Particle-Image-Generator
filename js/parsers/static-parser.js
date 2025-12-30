// ==================== 静态图片解析器 ====================
import { BaseImageParser } from './base-parser.js';

export class StaticImageParser extends BaseImageParser {
    async parse(file) {
        const bmp = await createImageBitmap(file);
        const cvs = document.createElement('canvas');
        cvs.width = bmp.width;
        cvs.height = bmp.height;
        const ctx = cvs.getContext('2d');
        ctx.drawImage(bmp, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, bmp.width, bmp.height);
        return [imageData];
    }
}
