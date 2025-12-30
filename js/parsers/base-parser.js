// ==================== 图片解析基类 ====================
export class BaseImageParser {
    async parse(buffer) {
        throw new Error('parse() must be implemented by subclass');
    }

    createImageData(data, width, height) {
        return new ImageData(new Uint8ClampedArray(data), width, height);
    }

    async createCanvasFromBlob(blob) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(blob);
            const img = new Image();
            
            img.onload = () => {
                try {
                    const cvs = document.createElement('canvas');
                    cvs.width = img.width;
                    cvs.height = img.height;
                    const ctx = cvs.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, img.width, img.height);
                    URL.revokeObjectURL(url);
                    resolve(imageData);
                } catch (e) {
                    URL.revokeObjectURL(url);
                    reject(e);
                }
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('图片加载失败'));
            };
            
            img.src = url;
        });
    }
}
