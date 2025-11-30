export function initRecorder() {
    const btn = document.createElement('button');
    btn.innerHTML = '<i class="fas fa-circle"></i>'; // Record icon
    btn.className = "text-dim hover:text-red-500 px-2";
    btn.title = "Start/Stop Recording (WebM)";

    // Find the container: #preview-header > .flex
    const header = document.getElementById('preview-header');
    const container = header.querySelector('.flex');
    if(container) {
        container.appendChild(btn);
    } else {
        header.appendChild(btn);
    }

    let recorder = null;
    let chunks = [];

    btn.onclick = () => {
        if(recorder) {
            // Stop
            recorder.stop();
            btn.innerHTML = '<i class="fas fa-circle"></i>';
            btn.style.color = '#999';
            btn.classList.remove('animate-pulse');
        } else {
            // Start
            const canvas = document.querySelector('#preview-content canvas');
            if(!canvas) return;

            const stream = canvas.captureStream(30); // 30 FPS
            const options = { mimeType: 'video/webm;codecs=vp9' };

            try {
                recorder = new MediaRecorder(stream, options);
            } catch (e) {
                console.error("VP9 not supported, trying default.");
                recorder = new MediaRecorder(stream);
            }

            recorder.ondataavailable = (e) => {
                if(e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `recording_${Date.now()}.webm`;
                a.click();

                chunks = [];
                recorder = null;
            };

            recorder.start();
            btn.innerHTML = '<i class="fas fa-square"></i>';
            btn.style.color = '#ef4444';
            btn.classList.add('animate-pulse');
        }
    };
}
