// ==================== 主入口文件 ====================
import { Renderer3D } from './renderer.js';
import { ImageParser } from './parsers/image-parser.js';
import { ParticleGenerator } from './particle-generator.js';
import { UIManager } from './ui-manager.js';
import { CommandGenerator } from './command-generator.js';
import { DatapackGenerator } from './datapack-generator.js';
import { ExportHandlers } from './export-handlers.js';
import { DebugHelper } from './debug-helper.js';

// 初始化所有模块
const renderer = new Renderer3D();
const imageParser = new ImageParser();
const particleGenerator = new ParticleGenerator();
const commandGenerator = new CommandGenerator();
const datapackGenerator = new DatapackGenerator(commandGenerator, particleGenerator);
const exportHandlers = new ExportHandlers(commandGenerator, particleGenerator);
const uiManager = new UIManager(imageParser, particleGenerator);

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 应用初始化中...');
    
    // 检查库加载状态
    const libs = DebugHelper.checkLibraries();
    
    // 初始化渲染器
    renderer.init();
    renderer.startAnimation(() => {
        const stats = particleGenerator.update();
        uiManager.updateStats(stats);
    });
    
    // 初始化 UI
    uiManager.setupEventListeners();
    
    console.log('✅ 应用初始化完成');
});

// 导出全局函数供 HTML 调用
window.downloadPack = () => datapackGenerator.generate();
window.copyRawCommands = () => exportHandlers.copyRawCommands();
window.generateOneCommand = () => exportHandlers.generateOneCommand();
window.setAngle = (x, y, z) => exportHandlers.setAngle(x, y, z);
