import {createNode} from '../src/index.js';

export function playSound() {
    for (let i = 0; i < 12; i++) {
        createNode(i, 1, 440*Math.pow(2,i/12), 0.5, 'square', {
            attack: 0, // time in seconds to reach max volume
            decay: 0.1, // time in seconds to reach sustain level
            sustain: 0.5, // volume level during sustain (0 to 1)
            release: 0.1, // time in seconds to fade out
        });
    }
}