
type WaveNode={
    array:number[],
    sampleRate:number,
    lambda:number,
};
export function waveNode(ctx:AudioContext, array:number[], 
    lambda: number, sampleRate: number, baseFreq:number):WaveNode {
    // lambda, sampleRate=ctx.sampleRate
    //   baseFreq = sampleRate / lambda
    // sampleRate, baseFreq
    //   lambda = sampleRate / baseFreq;
    //const baseFreq=this.baseFreq;
    const sampleRate=ctx.sampleRate;
    const lambda=sampleRate/baseFreq;
    const buf=ctx.createBuffer(1, array.length, sampleRate);
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
        array, sampleRate, lambda
    };
}
export function playbackRateOf(waveform:WaveNode, freq: number) {
    /*
 freq=880  
 lambda=1024
    */
    return freq/waveform.baseFreq;

    target=oscillator.playbackRate;
        for (const e of freqTimes) {
            e.value /= baseFreq;//再生速度= 周波数/baseFreq
        }
}
export function waveformNode(time:number, duration:number, freq:number, vol:number, waveform:WaveNode,  envelope:ADSR) {

    setFrequency(oscillator, ..._freqTimes) {
    // _freqTimes = [周波数, 時刻, 周波数, 時刻, ....]
    const freqTimes=[];
    for (let i=0;i<_freqTimes.length;i+=2) {
        freqTimes.push({value:_freqTimes[i], time: _freqTimes[i+1]});
    }
    let target;
    if (oscillator.frequency) {// 本物のoccilatorの場合
        target=oscillator.frequency;
    } else {// Bufferの場合
        const baseFreq=this.baseFreq; // Buffer生音の周波数(init.jsも参照)
        target=oscillator.playbackRate;
        for (const e of freqTimes) {
            e.value /= baseFreq;//再生速度= 周波数/baseFreq
        }
    }
    if (freqTimes.length===1 && freqTimes[0].time==null) {
        target.value=freqTimes[0].value;
    } else {
        target.setValueAtTime(freqTimes[0].value, freqTimes[0].time);
        for (let i=1; i<freqTimes.length ;i++) {
            target.linearRampToValueAtTime(freqTimes[i].value, freqTimes[i].time);
        }
    }
}
