// ==================== 3D 渲染器 ====================
import { AppState } from './state.js';

export class Renderer3D {
    init() {
        const container = document.getElementById('canvas-container');
        AppState.scene = new THREE.Scene();
        AppState.scene.background = new THREE.Color(0x0a0a0a);
        
        AppState.scene.add(new THREE.GridHelper(20, 20, 0x333333, 0x1a1a1a));
        AppState.scene.add(new THREE.AxesHelper(3));

        AppState.camera = new THREE.PerspectiveCamera(
            50, 
            container.clientWidth / container.clientHeight, 
            0.1, 
            1000
        );
        AppState.camera.position.set(5, 5, 10);
        AppState.camera.lookAt(0, 0, 0);

        AppState.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        AppState.renderer.setSize(container.clientWidth, container.clientHeight);
        AppState.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(AppState.renderer.domElement);

        AppState.controls = new THREE.OrbitControls(AppState.camera, AppState.renderer.domElement);
        AppState.controls.enableDamping = true;

        this.setupResizeObserver(container);
    }

    startAnimation(updateCallback) {
        const animate = (time) => {
            requestAnimationFrame(animate);
            AppState.controls.update();

            if (AppState.isAnim && AppState.frames.length > 1) {
                const tickDelay = parseInt(document.getElementById('tick-delay')?.value || 2);
                const frameInterval = tickDelay * 50;
                
                if (time - AppState.lastTime > frameInterval) {
                    AppState.currentFrameIndex = (AppState.currentFrameIndex + 1) % AppState.frames.length;
                    if (updateCallback) updateCallback();
                    AppState.lastTime = time;
                }
            }
            
            AppState.renderer.render(AppState.scene, AppState.camera);
        };
        animate(0);
    }

    setupResizeObserver(container) {
        new ResizeObserver(() => {
            if (!container) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            AppState.camera.aspect = w / h;
            AppState.camera.updateProjectionMatrix();
            AppState.renderer.setSize(w, h);
        }).observe(container);
    }
}
