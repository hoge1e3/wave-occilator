type ADSR = {
    attack: number; // time in seconds to reach max volume
    decay: number; // time in seconds to reach sustain level
    sustain: number; // volume level during sustain (0 to 1)
    release: number; // time in seconds to fade out
};
type Waveform = 'sine' | 'square' | 'sawtooth' | 'triangle';
const audioCtx = new AudioContext();
export function gainNodeOfEnvelope(time:number, duration:number, vol:number, envelope: ADSR) {
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
export function createNode(time:number, duration:number, freq:number, vol:number, waveform:Waveform,  envelope:ADSR) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = waveform; // type of wave
    oscillator.frequency.setValueAtTime(freq, time); // frequency in hertz

    // Apply ADSR envelope to the gain node
    const attackEnd = time + envelope.attack;
    const decayEnd = attackEnd + envelope.decay;
    gainNode.gain.setValueAtTime(0, time); // Start at 0 volume
    gainNode.gain.linearRampToValueAtTime(vol, attackEnd); // Attack phase
    gainNode.gain.linearRampToValueAtTime(vol * envelope.sustain, decayEnd); // Decay phase
    gainNode.gain.setValueAtTime(vol * envelope.sustain, decayEnd); // Sustain phase
    gainNode.gain.linearRampToValueAtTime(0, time + duration); // Release phase

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start(time);
    oscillator.stop(time + duration);
}