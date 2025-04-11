type ADSR = {
    attack: number; // time in seconds to reach max volume
    decay: number; // time in seconds to reach sustain level
    sustain: number; // volume level during sustain (0 to 1)
    release: number; // time in seconds to fade out
};
type Waveform = 'sine' | 'square' | 'sawtooth' | 'triangle';
export interface Source {
    duration: number;
    play(ctx:AudioContext, start?:number, dest?: AudioDestinationNode ):Playback;
}
export function gainNodeOfEnvelope(audioCtx: AudioContext, time:number, duration:number, vol:number, envelope: ADSR) {
    const gainNode = audioCtx.createGain();
    const attackEnd = time + envelope.attack;
    const decayEnd = attackEnd + envelope.decay;
    gainNode.gain.setValueAtTime(0, time); // Start at 0 volume
    gainNode.gain.linearRampToValueAtTime(vol, attackEnd); // Attack phase
    gainNode.gain.linearRampToValueAtTime(vol * envelope.sustain, decayEnd); // Decay phase
    gainNode.gain.setValueAtTime(vol * envelope.sustain, decayEnd); // Sustain phase
    gainNode.gain.linearRampToValueAtTime(0, time + duration); // Release phase
    return gainNode;
}
export function joinSource(...sources:Source[]):Source {
    const duration=sources.reduce((prev, cur)=>prev+cur.duration ,0);
    return {
        duration,
        play(ctx:AudioContext, start:number=ctx.currentTime, dest=ctx.destination ) {
            const end=start+duration;
            const playbacks=sources.reduce((pbs, src)=>[
                ...pbs, 
                src.play(ctx, pbs[pbs.length-1]?.end||start, dest)
            ],  [] as Playback[]);
            return {
                ctx ,dest, start, end,
                stop() {
                    for (let p of playbacks) p.stop();
                },
                join(src:Source):Playback {
                    return src.play(ctx,end,dest);
                }
            }
        }
    }
}
export interface Playback {
    ctx:AudioContext;
    dest: AudioDestinationNode;
    stop():void;
    start:number;
    end:number; // end time may be decided later.
    //join(src:Source):Playback;
}
export function createNote(duration:number, freq:number, vol:number, waveform:Waveform,  envelope:ADSR):Source {
    return {
        duration,
        play(ctx:AudioContext, start:number=ctx.currentTime, dest=ctx.destination ) {
            const oscillator = ctx.createOscillator();
            const gainNode = gainNodeOfEnvelope(ctx, start, duration, vol, envelope);
        
            oscillator.type = waveform; // type of wave
            oscillator.frequency.setValueAtTime(freq, start); // frequency in hertz
        
            // Apply ADSR envelope to the gain node
            /*const attackEnd = start + envelope.attack;
            const decayEnd = attackEnd + envelope.decay;
            gainNode.gain.setValueAtTime(0, start); // Start at 0 volume
            gainNode.gain.linearRampToValueAtTime(vol, attackEnd); // Attack phase
            gainNode.gain.linearRampToValueAtTime(vol * envelope.sustain, decayEnd); // Decay phase
            gainNode.gain.setValueAtTime(vol * envelope.sustain, decayEnd); // Sustain phase
            gainNode.gain.linearRampToValueAtTime(0, start + duration); // Release phase*/
        
            oscillator.connect(gainNode);
            gainNode.connect(dest);
            const end=start + duration
            oscillator.start(start);
            oscillator.stop(end);
            //const endp=Promise.resolve(end);
            return {
                gainNode, oscillator,
                ctx ,dest, start, end,
                stop() {
                    //console.log("Discon");
                    gainNode.disconnect()
                },
                /*join(src:Source):Playback {
                    return src.play(ctx,end,dest);
                }*/
            }
        }
    };
}


type WaveBufferNode={
    buf: AudioBuffer,
    baseFreq: number,
};
type FreqParam=FromRecorded|FromGenerated;
type FromRecorded={ sampleRate: number, baseFreq: number};
type FromGenerated={ lambda: number };
export function waveBufferNode(ctx:AudioContext, array:number[], freqParam:FreqParam={lambda:array.length}):WaveBufferNode {
    // From sampled(Recorded) data
    //  given: sampleRate, baseFreq 
    //  calculate: lambda = sampleRate / baseFreq
    //  re-calculate: baseFreq = ctx.sampleRate / lambda 
    //                        (= orig_baseFreq * ctx.sampleRate / sampleRate )
    // From generated data
    //  given: lambda
    //        (sampleRate=ctx.sampleRate)
    //  calculate: baseFreq = sampleRate / lambda

    const baseFreq= "baseFreq" in freqParam ? freqParam.baseFreq*ctx.sampleRate/freqParam.sampleRate : ctx.sampleRate/freqParam.lambda;
    const buf=ctx.createBuffer(1, array.length, ctx.sampleRate);
    const dstArray=buf.getChannelData(0);
    let avr=0;
    for (let e of array) {
        avr+=e;
    }
    avr/=array.length;
    for (let i=0;i<dstArray.length;i++) {
        dstArray[i]=array[i]-avr;
    }
    return {
        buf, baseFreq, 
    };
}
export function playbackRateOf(waveform:WaveBufferNode, freq: number) {
    return freq/waveform.baseFreq;
}
export function createWaveNote(duration:number, freq:number, vol:number, waveform:WaveBufferNode,  envelope:ADSR) {
    return {
        duration,
        play(ctx:AudioContext, start:number=ctx.currentTime, dest=ctx.destination ) {
            const oscillator = ctx.createBufferSource();
            oscillator.buffer=waveform.buf;
            oscillator.playbackRate.setValueAtTime( playbackRateOf(waveform, freq) , start);
            oscillator.loop=true;
            const gainNode = gainNodeOfEnvelope(ctx, start, duration, vol, envelope);

            oscillator.connect(gainNode);
            gainNode.connect(dest);
            const end=start + duration
            oscillator.start(start);
            oscillator.stop(end);
            return {
                gainNode, oscillator,
                ctx ,dest, start, end,
                stop() {
                    gainNode.disconnect()
                },
            }
        }
    };
}
