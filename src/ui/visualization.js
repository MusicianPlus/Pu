
export function updateViz(node, val) {
    // 1. Float (Sig/Math)
    const bar = document.getElementById(`viz-${node.id}`);
    const txt = document.getElementById(`viz-txt-${node.id}`);
    
    if(bar && txt && typeof val === 'number') {
        bar.style.width = Math.min(100, Math.max(0, val*100)) + '%';
        txt.innerText = val.toFixed(2);
        return;
    }

    // 2. Geometry Info
    const vSpan = document.getElementById(`viz-geo-v-${node.id}`);
    const fSpan = document.getElementById(`viz-geo-f-${node.id}`);
    if(vSpan && val && val.isBufferGeometry) {
        // Optimization: Don't update DOM if count hasn't changed logic could be added
        vSpan.innerText = `V: ${val.attributes.position.count}`;
        fSpan.innerText = `F: ${val.index ? val.index.count/3 : val.attributes.position.count/3}`; // Approx
        return;
    }

    // 4. Audio Spectrum
    const sndCanvas = document.getElementById(`viz-snd-${node.id}`);
    if(sndCanvas && val && (val instanceof Uint8Array || val.buffer instanceof ArrayBuffer)) {
        const ctx = sndCanvas.getContext('2d');
        const w = sndCanvas.width;
        const h = sndCanvas.height;
        ctx.clearRect(0,0,w,h); // Make background transparent
        
        const bufferLength = val.length;
        const barWidth = (w / bufferLength) * 2.5;
        let x = 0;
        
        // Draw simplistic spectrum
        // Assuming val is frequency data (0-255)
        for(let i = 0; i < bufferLength; i++) {
            const barHeight = (val[i] / 255) * h;
            
            // Enhanced Color (Blue to Red spectrum)
            const r = val[i]; // Directly use intensity for Red
            const g = 255 - val[i]; // Inverse for Green
            const b = (i/bufferLength) * 255; // Blue based on frequency position
            
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, h-barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
        return;
    }

    // 5. Texture (Image)
    const img = document.getElementById(`viz-${node.id}`);
    if(img && val && val.isTexture) {
        if(val.image && (val.image.src || val.image.toDataURL)) {
             // Optim: Only update if src changed to avoid flicker? 
             // CanvasTexture image is a canvas
             if(val.image instanceof HTMLCanvasElement) {
                 // For dynamic canvas textures, we might need to update manually, but simple assignment works for src
                 // But updating src every frame is heavy. 
                 // Let's just update if it's a static image file URL for now.
             } else if (img.src !== val.image.src) {
                 img.src = val.image.src;
             }
        }
        return;
    }

    // 3. Array Plot (Canvas)
    const canvas = document.getElementById(`viz-${node.id}`);
    if(canvas && canvas instanceof HTMLCanvasElement && val && (val instanceof Float32Array || val instanceof Array)) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        ctx.fillStyle = '#000'; ctx.fillRect(0,0,w,h);
        
        ctx.fillStyle = '#eab308'; // Sig Color
        const step = Math.max(1, Math.floor(val.length / w));
        
        // Draw simplified plot
        for(let i=0; i<w; i++) {
            const idx = Math.floor(i / w * val.length);
            const v = val[idx]; // Assuming 1D array or take 1st component
            // Normalize assume -5 to 5 range for pos, 0-1 for others
            const y = h/2 - (v * h/4); 
            ctx.fillRect(i, y, 1, 2);
        }
    }
}
