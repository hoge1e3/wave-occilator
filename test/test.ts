import {createNote, bufferedWaveform, joinSource, Playback, Source} from '../src/index.js';


const audioCtx = new AudioContext();
let playback:Playback|undefined;
const wdat=[] as number[];/*0,1,2,3,4,5,6,7, -7,-6,-5,-4,-3,-2,-1,0, 
            3,5,6,7,6,5,3,0, -3,-5,-6,-7,-6,-5,-3,0].map(s=>s/8);*/
const s=(x:number)=>Math.sin(x*(Math.PI*2));
for (let i=0;i<1024*1;i++) {
    wdat.push(s(i/1024+1*s(i*3/1024)) );
}
const scc=bufferedWaveform(audioCtx, wdat, {lambda: 1024});
console.log(wdat, scc);
export async function stop() {
    playback?.stop();
}
export async function playSound() {
    const sources= [] as Source[];
    for (let i = 0; i < 12; i++) {
        const src=createNote(1, 440*Math.pow(2,i/12), 0.5, scc, {
            attack: 0, // time in seconds to reach max volume
            decay: 0.1, // time in seconds to reach sustain level
            sustain: 0.5, // volume level during sustain (0 to 1)
            release: 0.1, // time in seconds to fade out
        });
        sources.push(src);
    }
    playback=joinSource(...sources).play(audioCtx);
}