// ==================== GIF 解析器 ====================
import { BaseImageParser } from './base-parser.js';

export class GIFParser extends BaseImageParser {
    // 默认延迟：2 ticks (100ms)
    static DEFAULT_DELAY_TICKS = 2;
    
    // 最小延迟：1 tick (50ms)
    static MIN_DELAY_TICKS = 1;
    
    /**
     * 将 GIF 延迟单位（1/100秒）转换为毫秒和 Minecraft ticks
     * @param {number} gifDelay - GIF 延迟值（1/100秒）
     * @returns {Object} { delayMs, delayTicks }
     */
    convertGifDelay(gifDelay) {
        // GIF 延迟单位是 1/100 秒，转换为毫秒
        const delayMs = (gifDelay || 0) * 10;
        
        // 如果延迟为 0 或太小，使用默认值
        if (delayMs === 0 || delayMs < 50) {
            return {
                delayMs: GIFParser.DEFAULT_DELAY_TICKS * 50,
                delayTicks: GIFParser.DEFAULT_DELAY_TICKS
            };
        }
        
        // 转换为 Minecraft ticks (1 tick = 50ms)
        const delayTicks = Math.max(
            GIFParser.MIN_DELAY_TICKS,
            Math.round(delayMs / 50)
        );
        
        return { delayMs, delayTicks };
    }

    async parse(buffer) {
        console.log('开始解析 GIF，大小:', buffer.byteLength, 'bytes');
        
        // 尝试使用 omggif 库
        try {
            const frames = await this.parseWithOmggif(buffer);
            console.log('✅ omggif 解析成功，帧数:', frames.length);
            return frames;
        } catch (err) {
            console.warn('⚠️ omggif 库解析失败:', err.message);
            console.log('尝试使用降级方案...');
            return await this.parseFallback(buffer);
        }
    }

    async parseWithOmggif(buffer) {
        // 检查库是否加载
        if (!window.GifReader) {
            throw new Error('omggif 库未加载，请检查 CDN 链接');
        }

        console.log('使用 omggif 解析...');
        
        // 创建 GIF 读取器
        const arr = new Uint8Array(buffer);
        const reader = new window.GifReader(arr);
        
        const width = reader.width;
        const height = reader.height;
        const numFrames = reader.numFrames();
        
        console.log('GIF 信息:', {
            帧数: numFrames,
            宽度: width,
            高度: height,
            循环次数: reader.loopCount()
        });

        if (numFrames === 0) {
            throw new Error('GIF 解析失败：未能解析出任何帧');
        }

        // 创建临时 canvas 用于合成帧
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext('2d');
        
        const imageDataFrames = [];
        
        // 用于存储上一帧的数据（用于 disposal 处理）
        let previousImageData = null;
        
        for (let i = 0; i < numFrames; i++) {
            const frameInfo = reader.frameInfo(i);
            
            // 提取帧延迟信息
            const { delayMs, delayTicks } = this.convertGifDelay(frameInfo.delay);
            
            console.log(`帧 ${i}: 延迟 ${frameInfo.delay}/100s = ${delayMs}ms = ${delayTicks} ticks`);
            
            // 根据 disposal 方法处理
            if (i > 0 && previousImageData) {
                const prevFrameInfo = reader.frameInfo(i - 1);
                
                if (prevFrameInfo.disposal === 2) {
                    // 恢复到背景色（清空）
                    ctx.clearRect(0, 0, width, height);
                } else if (prevFrameInfo.disposal === 3) {
                    // 恢复到上一帧
                    ctx.putImageData(previousImageData, 0, 0);
                }
                // disposal === 0 或 1：不处理，保持当前状态
            }
            
            // 保存当前状态（用于 disposal === 3）
            if (frameInfo.disposal === 3) {
                previousImageData = ctx.getImageData(0, 0, width, height);
            }
            
            // 解码当前帧
            const framePixels = new Uint8ClampedArray(width * height * 4);
            reader.decodeAndBlitFrameRGBA(i, framePixels);
            
            // 创建 ImageData
            const frameImageData = new ImageData(framePixels, width, height);
            
            // 绘制到 canvas（考虑帧的位置）
            ctx.putImageData(
                frameImageData, 
                frameInfo.x || 0, 
                frameInfo.y || 0
            );
            
            // 获取完整帧
            const fullFrame = ctx.getImageData(0, 0, width, height);
            
            // 返回包含延迟信息的帧对象
            imageDataFrames.push({
                imageData: fullFrame,
                delayMs: delayMs,
                delayTicks: delayTicks
            });
        }
        
        return imageDataFrames;
    }

    async parseFallback(buffer) {
        console.log('使用 Canvas API 降级方案...');
        
        try {
            const blob = new Blob([buffer], { type: 'image/gif' });
            const imageData = await this.createCanvasFromBlob(blob);
            
            console.warn('⚠️ 降级方案只能获取 GIF 第一帧，动画效果将丢失');
            
            // 返回包含默认延迟信息的帧对象
            return [{
                imageData: imageData,
                delayMs: GIFParser.DEFAULT_DELAY_TICKS * 50,
                delayTicks: GIFParser.DEFAULT_DELAY_TICKS
            }];
        } catch (err) {
            console.error('❌ 降级方案也失败:', err);
            throw new Error(`GIF 解析完全失败: ${err.message}`);
        }
    }
}
