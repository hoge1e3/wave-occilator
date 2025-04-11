import {createNote, joinSource, Playback, Source} from '../src/index.js';


const audioCtx = new AudioContext();
let playback:Playback|undefined;
export async function stop() {
    playback?.stop();
}
export async function playSound() {
    const sources= [] as Source[];
    for (let i = 0; i < 12; i++) {
        const src=createNote(1, 440*Math.pow(2,i/12), 0.5, 'square', {
            attack: 0, // time in seconds to reach max volume
            decay: 0.1, // time in seconds to reach sustain level
            sustain: 0.5, // volume level during sustain (0 to 1)
            release: 0.1, // time in seconds to fade out
        });
        sources.push(src);
    }
    playback=joinSource(...sources).play(audioCtx);
}