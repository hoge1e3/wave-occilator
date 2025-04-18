# @hoge1e3/oscillator

A JavaScript library for creating and manipulating audio oscillators using the Web Audio API, with support for standard waveforms and custom wave sampling.

## Installation

```bash
npm install @hoge1e3/oscillator
```

## Features

- Create standard waveform oscillators (sine, square, triangle, sawtooth)
- Support for custom/buffered waveforms
- Control frequency, volume, and ADSR envelope
- Join multiple sound sources together
- Create mute/silent notes

## Usage

### Basic Example

```javascript
import { createNote, joinSource } from '@hoge1e3/oscillator';

// Create an audio context
const audioCtx = new AudioContext();

// Create a note with sine waveform
const note = createNote(
  1,                // duration in seconds
  440,              // frequency in Hz (A4)
  0.5,              // volume (0-1)
  'sine',           // waveform type
  {                 // ADSR envelope
    attack: 0.1,    // attack time in seconds
    decay: 0.2,     // decay time in seconds
    sustain: 0.7,   // sustain level (0-1) 
    release: 0.2    // release time in seconds
  }
);

// Play the note
const playback = note.play(audioCtx);

// Stop playback after 2 seconds
setTimeout(() => {
  playback.stop();
}, 2000);
```

### Playing a Sequence of Notes

```javascript
import { createNote, joinSource } from '@hoge1e3/oscillator';

const audioCtx = new AudioContext();

// Create a C major scale
const notes = [];
for (let i = 0; i < 8; i++) {
  const note = createNote(
    0.5,                        // 0.5 second notes
    261.63 * Math.pow(2, i/12), // C4 to C5
    0.5,                        // volume
    'sawtooth',                 // waveform
    {
      attack: 0.05,
      decay: 0.1,
      sustain: 0.8,
      release: 0.1
    }
  );
  notes.push(note);
}

// Join all notes into a sequence
const sequence = joinSource(...notes);

// Play the sequence
const playback = sequence.play(audioCtx);
```

### Using Custom Waveforms

```javascript
import { createNote, bufferedWaveform } from '@hoge1e3/oscillator';

const audioCtx = new AudioContext();

// Create a custom waveform
const waveData = [];
const s = (x) => Math.sin(x * (Math.PI * 2));
for (let i = 0; i < 1024; i++) {
  // Custom formula to create a complex waveform
  waveData.push(s(i / 1024 + 1 * s(i * 3 / 1024)));
}

// Create a buffered waveform
const customWave = bufferedWaveform(audioCtx, waveData, { lambda: 1024 });

// Create and play a note with the custom waveform
const note = createNote(
  2,       // duration
  440,     // frequency
  0.7,     // volume
  customWave, // custom waveform
  {
    attack: 0.1,
    decay: 0.2,
    sustain: 0.6,
    release: 0.3
  }
);

// Play the note
const playback = note.play(audioCtx);
```

## API Reference

### Main Functions

#### `createNote(duration, freq, vol, waveform, envelope)`

Creates a note (sound source) with specified parameters.

- `duration`: Duration of the note in seconds
- `freq`: Frequency in Hz
- `vol`: Volume (0-1)
- `waveform`: Either a string ('sine', 'square', 'sawtooth', 'triangle') or a BufferedWaveform object
- `envelope`: ADSR envelope with `attack`, `decay`, `sustain`, and `release` properties

Returns a `Source` object with `duration` property and `play()` method.

#### `createOscillatorNote(duration, freq, vol, waveform, envelope)`

Creates a note using standard oscillator types ('sine', 'square', 'sawtooth', 'triangle').

Parameters are the same as `createNote()`.

#### `createBufferedWaveformNote(duration, freq, vol, waveform, envelope)`

Creates a note using a custom buffered waveform.

- `waveform`: Must be a BufferedWaveform object created with `bufferedWaveform()`

Other parameters are the same as `createNote()`.

#### `bufferedWaveform(ctx, array, freqParam)`

Creates a custom waveform from an array of samples.

- `ctx`: AudioContext instance
- `array`: Array of sample values
- `freqParam`: (Optional) Either `{ lambda: number }` or `{ sampleRate: number, baseFreq: number }`. 
   - It is recommended to specify `{ lambda: number }` for program-generated waveform data and `{ sampleRate: number, baseFreq: number }` for recorded data.
   - `lambda` is the length of the fundamental frequency in the waveform data. This value should be 1/n (n is a positive integer) of the total length of the waveform data.
   - The `sampleRate` and `baseFreq` specify the sampling frequency of the recorded data and the base frequency of the sounds in the data.
Returns a BufferedWaveform object that can be used with `createNote()`.

#### `joinSource(...sources)`

Combines multiple sound sources into a single sequence.

- `sources`: Array of Source objects

Returns a new Source object that plays the sources in sequence.

#### `createMuteNote(duration)`

Creates a silent note of specified duration.

- `duration`: Duration in seconds

### Playback Control

When you call `play()` on a Source object, it returns a Playback object with:

- `ctx`: AudioContext instance
- `dest`: AudioDestinationNode
- `start`: Start time
- `end`: End time
- `stop()`: Method to stop playback

## Waveform Types

- `'sine'`: Standard sine wave
- `'square'`: Square wave
- `'sawtooth'`: Sawtooth wave
- `'triangle'`: Triangle wave
- Custom waveforms created with `bufferedWaveform()`

## ADSR Envelope

The ADSR (Attack, Decay, Sustain, Release) envelope controls the volume shape of a note:

- `attack`: Time in seconds for the volume to reach its maximum
- `decay`: Time in seconds for the volume to fall to the sustain level
- `sustain`: Volume level during the sustain phase (0-1)
- `release`: Time in seconds for the volume to fade out

## Browser Support

This library works in all modern browsers that support the Web Audio API:

- Chrome 34+
- Firefox 25+
- Safari 7.1+
- Edge 12+

## License

ISC

## Links

- [GitHub Repository](https://github.com/hoge1e3/wave-occilator)
- [Issue Tracker](https://github.com/hoge1e3/wave-occilator/issues)