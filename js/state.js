// ==================== 全局状态管理 ====================
export const AppState = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    particleSystem: null,
    frames: [],           // 现在存储 { imageData, delayMs, delayTicks } 对象
    isAnim: false,
    currentFrameIndex: 0,
    lastTime: 0,
    currentFrameGen: null,
    
    // 新增：帧延迟相关属性
    frameDelays: [],      // 每帧延迟（ticks）- 冗余但便于访问
    totalDuration: 0,     // 总时长（ticks）
    avgDelayTicks: 0,     // 平均帧延迟（ticks）
    speedMultiplier: 1.0, // 播放速度倍率
    
    // 计算动画元数据的辅助方法
    calculateAnimationMetadata() {
        if (!this.frames || this.frames.length === 0) {
            this.frameDelays = [];
            this.totalDuration = 0;
            this.avgDelayTicks = 0;
            return;
        }
        
        // 提取延迟信息
        this.frameDelays = this.frames.map(frame => 
            frame.delayTicks || 2 // 默认值
        );
        
        // 计算总时长
        this.totalDuration = this.frameDelays.reduce((sum, delay) => sum + delay, 0);
        
        // 计算平均延迟
        this.avgDelayTicks = this.totalDuration / this.frames.length;
    },
    
    // 获取有效延迟（应用速度倍率）
    getEffectiveDelay(frameIndex) {
        if (!this.frames[frameIndex]) return 2;
        
        const originalDelay = this.frames[frameIndex].delayTicks || 2;
        const effectiveDelay = Math.round(originalDelay / this.speedMultiplier);
        return Math.max(1, effectiveDelay); // 最小 1 tick
    }
};
