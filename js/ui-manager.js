// ==================== UI 管理器 ====================
import { AppState } from './state.js';

export class UIManager {
    constructor(imageParser, particleGenerator) {
        this.imageParser = imageParser;
        this.particleGenerator = particleGenerator;
    }

    updateMode(isAnim) {
        const animUI = document.getElementById('anim-controls');
        const guideStatic = document.getElementById('guide-static');
        const guideAnim = document.getElementById('guide-anim');
        const btnCopy = document.getElementById('btn-copy');
        const btnOoc = document.getElementById('btn-ooc');

        if (isAnim) {
            animUI.style.display = 'block';
            guideStatic.style.display = 'none';
            guideAnim.style.display = 'block';
            btnCopy.disabled = true;
            btnCopy.title = "动画模式不支持复制";
            btnOoc.disabled = true;
            btnOoc.title = "动画模式不支持单指令";
        } else {
            animUI.style.display = 'none';
            guideStatic.style.display = 'block';
            guideAnim.style.display = 'none';
            btnCopy.disabled = false;
            btnCopy.title = "复制指令内容";
            btnOoc.disabled = false;
            btnOoc.title = "生成单指令";
        }
    }

    updateStats(text) {
        const statsEl = document.getElementById('stats');
        if (statsEl) statsEl.innerHTML = text;
    }

    setupEventListeners() {
        // 文件上传
        const fileInput = document.getElementById('file');
        const dropZone = document.getElementById('drop-zone');
        
        if (dropZone && fileInput) {
            dropZone.onclick = () => fileInput.click();
            fileInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                this.updateStats("正在解析...");
                
                try {
                    await this.imageParser.parseFile(file);
                    this.updateMode(AppState.isAnim);
                    const stats = this.particleGenerator.update();
                    this.updateStats(stats);
                } catch (err) {
                    console.error(err);
                    alert("解析失败，请使用标准格式图片。");
                    this.updateStats("请上传图片 (支持 GIF/APNG)");
                }
            };
        }

        // 参数同步
        this.syncInputs('width', 'width-num');
        this.syncInputs('rot-x', 'rot-x-num');
        this.syncInputs('rot-y', 'rot-y-num');
        this.syncInputs('rot-z', 'rot-z-num');
        this.syncInputs('off-x', 'off-x-num');
        this.syncInputs('off-y', 'off-y-num');
        this.syncInputs('off-z', 'off-z-num');
        
        const spacingEl = document.getElementById('spacing');
        if (spacingEl) {
            spacingEl.addEventListener('input', () => {
                if (AppState.isAnim) AppState.currentFrameIndex = 0;
                const stats = this.particleGenerator.update();
                this.updateStats(stats);
            });
        }
    }

    syncInputs(id1, id2) {
        const e1 = document.getElementById(id1);
        const e2 = document.getElementById(id2);
        
        if (!e1 || !e2) return;
        
        e1.addEventListener('input', () => {
            e2.value = e1.value;
            if (AppState.isAnim) AppState.currentFrameIndex = 0;
            const stats = this.particleGenerator.update();
            this.updateStats(stats);
        });
        
        e2.addEventListener('input', () => {
            e1.value = e2.value;
            if (AppState.isAnim) AppState.currentFrameIndex = 0;
            const stats = this.particleGenerator.update();
            this.updateStats(stats);
        });
    }
}
