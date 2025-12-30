// ==================== 粒子生成器 ====================
import { AppState } from './state.js';

export class ParticleGenerator {
    update() {
        if (!AppState.frames || AppState.frames.length === 0) return;

        const frameData = AppState.frames[AppState.currentFrameIndex];
        const params = this.getParameters(frameData);
        const scaledData = this.scaleImage(frameData, params.targetW, params.targetH);
        const particleData = this.generateParticleData(scaledData, params);
        
        AppState.currentFrameGen = particleData;
        this.renderParticles(particleData, params.spacing);
        
        return this.getStatsText(params, particleData.count);
    }

    getParameters(frameData) {
        const targetW = parseInt(document.getElementById('width').value);
        const spacing = parseFloat(document.getElementById('spacing').value);
        const rotX = this.degToRad(parseFloat(document.getElementById('rot-x').value));
        const rotY = this.degToRad(parseFloat(document.getElementById('rot-y').value));
        const rotZ = this.degToRad(parseFloat(document.getElementById('rot-z').value));
        const offX = parseFloat(document.getElementById('off-x').value) || 0;
        const offY = parseFloat(document.getElementById('off-y').value) || 0;
        const offZ = parseFloat(document.getElementById('off-z').value) || 0;
        
        const ratio = frameData.height / frameData.width;
        const targetH = Math.round(targetW * ratio);

        return { targetW, targetH, spacing, rotX, rotY, rotZ, offX, offY, offZ };
    }

    scaleImage(frameData, targetW, targetH) {
        const cvs = document.getElementById('helper-canvas');
        const ctx = cvs.getContext('2d');
        cvs.width = targetW;
        cvs.height = targetH;
        
        const tempCvs = document.createElement('canvas');
        tempCvs.width = frameData.width;
        tempCvs.height = frameData.height;
        tempCvs.getContext('2d').putImageData(frameData, 0, 0);
        
        ctx.clearRect(0, 0, targetW, targetH);
        ctx.drawImage(tempCvs, 0, 0, targetW, targetH);
        
        return ctx.getImageData(0, 0, targetW, targetH).data;
    }

    generateParticleData(scaledData, params) {
        const positions = [];
        const colors = [];
        const euler = new THREE.Euler(params.rotX, params.rotY, params.rotZ, 'XYZ');
        let count = 0;

        for (let y = 0; y < params.targetH; y++) {
            for (let x = 0; x < params.targetW; x++) {
                const i = (y * params.targetW + x) * 4;
                if (scaledData[i + 3] < 20) continue;

                let lx = (x - params.targetW / 2) * params.spacing;
                let ly = (params.targetH - y) * params.spacing;
                let lz = 0;

                const vec = new THREE.Vector3(lx, ly, lz);
                vec.applyEuler(euler);

                positions.push(vec.x + params.offX, vec.y + params.offY, vec.z + params.offZ);
                colors.push(scaledData[i] / 255, scaledData[i + 1] / 255, scaledData[i + 2] / 255);
                count++;
            }
        }

        return { positions, colors, count };
    }

    renderParticles(particleData, spacing) {
        if (AppState.particleSystem) {
            AppState.scene.remove(AppState.particleSystem);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(particleData.positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(particleData.colors, 3));
        
        const mat = new THREE.PointsMaterial({ 
            size: spacing * 0.9, 
            vertexColors: true, 
            sizeAttenuation: true 
        });
        
        AppState.particleSystem = new THREE.Points(geometry, mat);
        AppState.scene.add(AppState.particleSystem);
    }

    getStatsText(params, count) {
        const typeStr = AppState.isAnim ? `动画 (${AppState.frames.length} 帧)` : "静态图";
        const frameInfo = AppState.isAnim ? `<br>当前帧: ${AppState.currentFrameIndex + 1}/${AppState.frames.length}` : '';
        const countColor = count > 5000 ? '#f55' : '#5f5';
        return `${typeStr}${frameInfo}<br>尺寸: ${params.targetW}x${params.targetH}<br>粒子数: <span style="color:${countColor}">${count}</span>`;
    }

    degToRad(deg) {
        return deg * (Math.PI / 180);
    }
}
