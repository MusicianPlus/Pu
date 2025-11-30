import { getIn } from '../helpers.js';
import { initAudio, audioCtx } from '../../core/state.js';
import { updateViz } from '../../ui/visualization.js';

// Helper to manage connections
// If input changes, disconnect old, connect new.
function updateAudioConnection(n, inputNodeKey, internalNode) {
    const stream = getIn(n, inputNodeKey);
    if(stream && stream instanceof AudioNode) {
        if(n.data.lastStream !== stream) {
            if(n.data.lastStream) try{ n.data.lastStream.disconnect(internalNode); }catch(e){}
            stream.connect(internalNode);
            n.data.lastStream = stream;
        }
    } else if (n.data.lastStream) {
        try{ n.data.lastStream.disconnect(internalNode); }catch(e){}
        n.data.lastStream = null;
    }
}

export const SndNodes = {
        'snd_player': {
            cat: 'snd', name: { tr:'Ses Oynatıcı', en:'Audio Player' },
            desc: { tr:'Ses dosyası oynatıcı.', en:'Audio file player.' },
            ports: { out: ['Stream'] },
            params: { File:{type:'file', label:'Audio'}, Play:{v:0, min:0, max:1, step:1}, Speed:{v:1, min:0.1, max:2}, Volume:{v:1}, Seek:{v:0, min:0, max:1, label:'Seek (0-1)'} },
            init: (n) => {
                initAudio();
                n.val.Stream = audioCtx.createGain(); // Output is a GainNode (acting as master for this player)
                n.data.playing = false;
                n.data.lastSeekTime = 0; // To store where we left off
            },
            logic: (n, ctx) => {
                n.val.Stream.gain.value = getIn(n, 'Volume') || n.params.Volume.v;
                const speed = getIn(n, 'Speed') || n.params.Speed.v;
                let seek = getIn(n, 'Seek') || n.params.Seek.v;
                
                // If the buffer exists, max seek is its duration
                if (n.data.buffer) {
                    seek = seek * n.data.buffer.duration; // Normalize seek to actual time
                } else {
                    seek = 0; // No buffer, no seek
                }
    
                // Check if seek parameter has changed significantly
                const seekChanged = Math.abs(seek - n.data.lastSeekTime) > 0.1 || (seek === 0 && n.data.lastSeekTime !== 0);
                n.data.lastSeekTime = seek; // Update last seek for next frame comparison
    
                const shouldPlay = (getIn(n,'Play') || n.params.Play.v) > 0.5;
                
                if (shouldPlay && !n.data.playing && n.data.buffer) {
                    // Stop old if exists (safety)
                    if(n.data.source) try{n.data.source.stop()}catch(e){}
                    
                    const src = audioCtx.createBufferSource();
                    src.buffer = n.data.buffer; 
                    src.loop = true;
                    src.playbackRate.value = speed;
                    src.connect(n.val.Stream); // Connect to output gain
                    src.start(0, seek); // Start at seek position
                    
                    n.data.source = src; 
                    n.data.playing = true;
                }
                
                // If actively playing and seek changes, restart player
                if (shouldPlay && n.data.playing && n.data.buffer && seekChanged) {
                    if(n.data.source) try{n.data.source.stop()}catch(e){}
                    n.data.playing = false; // Force re-initialization next frame
                }
    
                if (!shouldPlay && n.data.playing) {
                    if(n.data.source) try{n.data.source.stop()}catch(e){}
                    n.data.playing = false;
                }
            }
        },
        'snd_mic': {
        cat: 'snd', name: { tr:'Mikrofon', en:'Microphone' },
        desc: { tr:'Mikrofon girişi.', en:'Microphone input.' },
        ports: { out:['Stream'] },
        params: { Active:{v:1, min:0, max:1, step:1} },
        init: (n) => {
            initAudio();
            n.val.Stream = audioCtx.createGain();
            if(navigator.mediaDevices) {
                navigator.mediaDevices.getUserMedia({audio:true}).then(s => {
                    const src = audioCtx.createMediaStreamSource(s);
                    src.connect(n.val.Stream);
                    n.data.mediaStream = s;
                });
            }
        },
        logic: (n) => {
            const active = n.params.Active.v > 0.5;
            n.val.Stream.gain.value = active ? 1 : 0;
        }
    },
    'snd_analyze': {
        cat: 'snd', name: { tr:'Analizör', en:'Analyzer Pro' },
        desc: { tr:'Gelişmiş ses analizi (FFT).', en:'Advanced spectral analysis.' },
        ports: { in:['Stream'], out:['Bass', 'Mid', 'High', 'Vol', 'Kick'] },
        params: { Smooth:{v:0.8, min:0, max:0.99}, Thresh:{v:0.7, min:0.1, max:1, label:'Kick Thresh'} },
        init: (n) => {
            initAudio();
            const anl = audioCtx.createAnalyser();
            anl.fftSize = 512; // Higher res
            n.data.analyser = anl;
            n.data.buffer = new Uint8Array(anl.frequencyBinCount);
            n.data.kickTimer = 0;
        },
        logic: (n, ctx) => {
            updateAudioConnection(n, 'Stream', n.data.analyser);
            
            const anl = n.data.analyser;
            anl.smoothingTimeConstant = n.params.Smooth.v;
            anl.getByteFrequencyData(n.data.buffer);
            const d = n.data.buffer;
            
            // Custom Bands
            // Bass: ~20-150Hz (Bins 0-10 approx)
            let b=0; for(let i=0; i<10; i++) b+=d[i]; n.val.Bass = (b/10)/255;
            
            // Mid: ~150-2000Hz (Bins 10-100 approx)
            let m=0; for(let i=10; i<100; i++) m+=d[i]; n.val.Mid = (m/90)/255;
            
            // High: ~2000Hz+ (Bins 100-255)
            let h=0; for(let i=100; i<255; i++) h+=d[i]; n.val.High = (h/155)/255;
            
            // Vol (Energy)
            let vol=0; for(let i=0; i<255; i++) vol+=d[i]; n.val.Vol = (vol/255)/255;

            // Kick Detection (Transient on Bass)
            const thresh = n.params.Thresh.v;
            // Simple logic: If bass > thresh and wasn't high recently
            if(n.val.Bass > thresh && ctx.time - n.data.kickTimer > 0.2) {
                n.val.Kick = 1;
                n.data.kickTimer = ctx.time;
            } else {
                n.val.Kick = 0; // Trigger style (1 frame)
                // To make it visible, maybe decay it?
                // For logic trigger, 1 frame is best. For viz, use smooth.
            }
            
            // Send raw buffer for spectrum visualization
            updateViz(n, d);
        }
    },
    'snd_output': {
        cat: 'snd', name: { tr:'Hoparlör', en:'Speakers' },
        desc: { tr:'Ses çıkışı.', en:'Audio Output.' },
        ports: { in:['Stream'] },
        params: { Volume:{v:1} },
        init: (n) => {
            initAudio();
            n.data.gain = audioCtx.createGain();
            n.data.gain.connect(audioCtx.destination);
        },
        logic: (n) => {
            updateAudioConnection(n, 'Stream', n.data.gain);
            n.data.gain.gain.value = getIn(n,'Volume') || n.params.Volume.v;
        }
    }
};
