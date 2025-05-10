import MutablePromise from "mutable-promise";
export type ADSR = {
    attack: number; // time in seconds to reach max volume
    decay: number; // time in seconds to reach sustain level
    sustain: number; // volume level during sustain (0 to 1)
    release: number; // time in seconds to fade out
};
export type OscillatorWaveType = 'sine' | 'square' | 'sawtooth' | 'triangle';
export type Waveform=OscillatorWaveType|BufferedWaveform;
export interface Source {
    duration: number;
    play(ctx:AudioContext, start?:number, dest?: AudioDestinationNode ):Playback;
}
function resolveAfter(p:MutablePromise<void>, afterInSec:number) {
    if (afterInSec<0) afterInSec=0;
    setTimeout(()=>p.resolve(), afterInSec*1000);
}
/*export type PlaybackEvent=Event;
export class PlaybackEventTarget extends EventTarget {
    state="playing" as "playing"|"stop"|"end";
    constructor(duration:number) {
        super();
        if (duration>0) {
            const timeout=setTimeout(()=>this.dispatchEnd(), duration*1000);
            this.addEventListener("stop",()=>clearTimeout(timeout));
        } else {
            this.dispatchEnd()
        }
    }
    dispatchEnd(){
        if (this.state!=="playing") return;
        this.state="end";
        this.dispatchEvent(new Event("end"));
    }
    dispatchStop(){
        if (this.state!=="playing") return;
        this.state="stop";
        this.dispatchEvent(new Event("stop"));
    }
}*/
export interface Playback {
    ctx:AudioContext;
    dest: AudioDestinationNode;
    stop():void;
    start:number;
    end:number; // TODO: end time may be decided later.
    promise: Promise<void>;
    /*addEventListener(type: "stop"|"end", handler:(e:PlaybackEvent)=>any):void;
    removeEventListener(type: "stop"|"end", handler:(e:PlaybackEvent)=>any):void;
    dispatchEvent(e:PlaybackEvent):void;*/
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
export function parallelSource(...sources:Source[]):Source {
    const duration=Math.max(...sources.map(s=>s.duration));
    return {
        duration,
        play(ctx:AudioContext, start:number=ctx.currentTime, dest=ctx.destination ) {
            const end=start+duration;
            const playbacks=sources.map((s)=>s.play(ctx,start,dest));
            let playc=0;;
            /*for (let p of playbacks) {
                p.addEventListener("stop", ()=>{
                    playc--;
                    if (playc==0) events.dispatchStop();
                });
                playc++;
            }*/
            //const events=new PlaybackEventTarget(end-ctx.currentTime);
            const promise=new MutablePromise<void>();
            function stopAll() {
                for (let p of playbacks) p.stop();
            }
            Promise.all(playbacks.map(p=>p.promise)).then(r=>promise.resolve(), stopAll);
            //resolveAfter(promise, end-ctx.currentTime);
            return {
                ctx ,dest, start, end,
                stop() {
                    for (let p of playbacks) p.stop();
                    return promise.reject("stopped");
                },
                promise,
                /*addEventListener: events.addEventListener.bind(events),
                removeEventListener: events.removeEventListener.bind(events),
                dispatchEvent: events.dispatchEvent.bind(events),*/
            }
        }
    };
}
export function joinPlaybackAndSource(playback:Playback, source:Source):Playback {
    const npb=source.play(playback.ctx, playback.end, playback.dest);
    playback.promise.catch(()=>npb.stop());
    npb.promise.catch(()=>playback.stop());
    return npb;
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
            /*const events=new PlaybackEventTarget(end-ctx.currentTime);
            for (let i=1; i<playbacks.length;i++) {
                playbacks[i-1].addEventListener("stop",()=>playbacks[i].stop());
            }*/
            function stopAll() {
                for (let p of playbacks) p.stop();
            }
            const promise=new MutablePromise<void>();
            Promise.all(playbacks.map(p=>p.promise)).then(r=>promise.resolve(), stopAll);
            //resolveAfter(promise, end-ctx.currentTime);

            return {
                ctx ,dest, start, end,
                stop(){
                    stopAll();
                    return promise.reject("stopped");
                },
                promise,
                /*addEventListener: events.addEventListener.bind(events),
                removeEventListener: events.removeEventListener.bind(events),
                dispatchEvent: events.dispatchEvent.bind(events),*/
            }
        }
    }
}
export function createMuteNote(duration: number):Source {
    return {
        duration,
        play(ctx, start=ctx.currentTime , dest=ctx.destination) {
            const end=start+duration;           
            //const events=new PlaybackEventTarget(end-ctx.currentTime);
            const promise=new MutablePromise<void>();
            resolveAfter(promise, end-ctx.currentTime);
            //Promise.all(playbacks.map(p=>p.promise)).then(r=>promise.resolve(), e=>promise.reject(e));
            return {
                ctx, dest, start, end,
                stop(){return promise.reject("stopped");/*events.dispatchStop();*/}, 
                promise,
                /*addEventListener: events.addEventListener.bind(events),
                removeEventListener: events.removeEventListener.bind(events),
                dispatchEvent: events.dispatchEvent.bind(events),*/
            };
        }
    }
}
export function createNote(duration:number, freq:number, vol:number, waveform:Waveform,  envelope:ADSR):Source {
    if (typeof waveform==="string") {
        return createOscillatorNote(duration, freq, vol, waveform, envelope);
    } else {
        return createBufferedWaveformNote(duration, freq, vol, waveform, envelope);
    }
}
export function createOscillatorNote(duration:number, freq:number, vol:number, waveform:OscillatorWaveType,  envelope:ADSR):Source {
    return {
        duration,
        play(ctx:AudioContext, start:number=ctx.currentTime, dest=ctx.destination ) {
            const oscillator = ctx.createOscillator();
            const gainNode = gainNodeOfEnvelope(ctx, start, duration, vol, envelope);
        
            oscillator.type = waveform; // type of wave
            oscillator.frequency.setValueAtTime(freq, start); // frequency in hertz
                
            oscillator.connect(gainNode);
            gainNode.connect(dest);
            const end=start + duration;
            //const events=new PlaybackEventTarget(end-ctx.currentTime);
            const promise=new MutablePromise<void>();
            resolveAfter(promise, end-ctx.currentTime);
            oscillator.start(start);
            oscillator.stop(end);
            return {
                gainNode, oscillator,
                ctx ,dest, start, end,
                stop() {
                    gainNode.disconnect();
                    return promise.reject("stopped");
                    //events.dispatchStop();
                },
                promise,
                /*addEventListener: events.addEventListener.bind(events),
                removeEventListener: events.removeEventListener.bind(events),
                dispatchEvent: events.dispatchEvent.bind(events),*/
            }
        }
    };
}


export type BufferedWaveform={
    buf: AudioBuffer,
    baseFreq: number,
    loop: boolean,
};
type FreqParam=FromRecorded|FromGenerated;
type FromRecorded={ sampleRate: number, baseFreq: number};
type FromGenerated={ lambda: number };
export function bufferedWaveform(ctx:AudioContext, array:number[], freqParam:FreqParam={lambda:array.length}, loop=false):BufferedWaveform {
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
        buf, baseFreq, loop,
    };
}
export async function bufferedWaveformOfFile(ctx:AudioContext, arrayBuffer:ArrayBuffer, baseFreq=440, loop=false):Promise<BufferedWaveform> {
    const { sampleRate, data } = await parseAudioFile(ctx, arrayBuffer);
    return bufferedWaveform(ctx, Array.from(data), { baseFreq, sampleRate }, loop);
}
export function playbackRateOf(waveform:BufferedWaveform, freq: number) {
    return freq/waveform.baseFreq;
}
export function createBufferedWaveformNote(duration:number, freq:number, vol:number, waveform:BufferedWaveform,  envelope:ADSR) {
    return {
        duration,
        play(ctx:AudioContext, start:number=ctx.currentTime, dest=ctx.destination ) {
            const oscillator = ctx.createBufferSource();
            oscillator.buffer=waveform.buf;
            oscillator.playbackRate.setValueAtTime( playbackRateOf(waveform, freq) , start);
            oscillator.loop=waveform.loop;
            const gainNode = gainNodeOfEnvelope(ctx, start, duration, vol, envelope);

            oscillator.connect(gainNode);
            gainNode.connect(dest);
            const end=start + duration
            oscillator.start(start);
            oscillator.stop(end);
            //const events=new PlaybackEventTarget(end-ctx.currentTime);
            const promise=new MutablePromise<void>();
            resolveAfter(promise, end-ctx.currentTime);
            return {
                gainNode, oscillator,
                ctx ,dest, start, end,
                stop() {
                    gainNode.disconnect();
                    return promise.reject("stopped");
                },
                promise,
                /*addEventListener: events.addEventListener.bind(events),
                removeEventListener: events.removeEventListener.bind(events),
                dispatchEvent: events.dispatchEvent.bind(events),*/
            }
        }
    };
}
async function parseAudioFile(audioContext: AudioContext, arrayBuffer:ArrayBuffer):Promise<{ sampleRate: number, data: Float32Array }> {
  
    // ArrayBufferをAudioBufferにデコード
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
    const { sampleRate, numberOfChannels, length } = audioBuffer;
  
    // モノラルに変換
    let monoData = new Float32Array(length);
  
    for (let ch = 0; ch < numberOfChannels; ch++) {
      const channelData = audioBuffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        monoData[i] += channelData[i];
      }
    }
  
    // チャンネル数で割って平均化（ステレオをモノラルに）
    for (let i = 0; i < length; i++) {
      monoData[i] /= numberOfChannels;
    }
  
    return {
      sampleRate,
      data: monoData, // -1〜1のFloat32Array
    };
  }
  