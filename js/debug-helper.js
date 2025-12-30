// ==================== 调试助手 ====================

export class DebugHelper {
    static checkLibraries() {
        const libs = {
            'JSZip': typeof JSZip !== 'undefined',
            'THREE': typeof THREE !== 'undefined',
            'OrbitControls': typeof THREE?.OrbitControls !== 'undefined',
            'pako': typeof pako !== 'undefined',
            'UPNG': typeof UPNG !== 'undefined',
            'omggif': typeof GifReader !== 'undefined'
        };

        console.group('📦 库加载状态');
        Object.entries(libs).forEach(([name, loaded]) => {
            console.log(`${loaded ? '✅' : '❌'} ${name}: ${loaded ? 'OK' : 'MISSING'}`);
        });
        console.groupEnd();

        const allLoaded = Object.values(libs).every(v => v);
        if (!allLoaded) {
            console.error('⚠️ 部分库未加载，请检查 CDN 链接或网络连接');
        }

        return libs;
    }

    static logGIFInfo(buffer) {
        console.group('🎞️ GIF 文件信息');
        console.log('文件大小:', buffer.byteLength, 'bytes');
        console.log('文件类型:', this.getFileType(buffer));
        console.groupEnd();
    }

    static getFileType(buffer) {
        const arr = new Uint8Array(buffer);
        const header = String.fromCharCode(...arr.slice(0, 6));
        
        if (header.startsWith('GIF87a')) return 'GIF87a';
        if (header.startsWith('GIF89a')) return 'GIF89a';
        if (arr[0] === 0x89 && arr[1] === 0x50) return 'PNG';
        if (arr[0] === 0xFF && arr[1] === 0xD8) return 'JPEG';
        
        return 'Unknown';
    }

    static enableVerboseLogging() {
        console.log('🔍 启用详细日志模式');
        window.DEBUG_MODE = true;
    }

    static disableVerboseLogging() {
        console.log('🔇 禁用详细日志模式');
        window.DEBUG_MODE = false;
    }
}

// 自动检查库加载状态
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        DebugHelper.checkLibraries();
    });
} else {
    DebugHelper.checkLibraries();
}

// 导出到全局供控制台使用
window.DebugHelper = DebugHelper;
