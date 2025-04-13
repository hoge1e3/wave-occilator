import { Source } from ".";

export type Pattern=string|RegExp;
export type LieteralSet={
    scales:Pattern[],
    longSyllable: Pattern, 
    halfSyllable: Pattern, 
    rest: Pattern,
    sharp: Pattern, flat: Pattern,
    rhysms?: Map<string, Source>;
}
export const standardLiteralSet:LieteralSet={
    scales: ["a","b","c","d","e","f","g"],
    rest: "r",
    longSyllable: "^", 
    sharp :/[^#+]/, flat: "-",
    halfSyllable: ".",    
};
export const japaneseLiteralSet:LieteralSet={
    scales: ["ラ","シ","ド","レ","ミ","ファ","ソ"],
    rest: "・",
    longSyllable: /[ー〜]/, 
    sharp: /[^#＃]/, flat: "♭",
    halfSyllable: /[．.]/,
};
const scaleOffset=[0, 2,3, 4, 5,6, 8, 10];

export interface NoteLength {
    n: number;   // numerator
//-----------------------------
    d: number;   // denominator
}
function nl(n:number, d:number) {return {n,d};}
function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
}
function lcm(a: number, b: number): number {
    return (a * b) / gcd(a, b);
}
function addNoteLength(a: NoteLength, b: NoteLength): NoteLength {
    const commonDenominator = lcm(a.d, b.d);
    const numeratorA = a.n * (commonDenominator / a.d);
    const numeratorB = b.n * (commonDenominator / b.d);
    const resultNumerator = numeratorA + numeratorB;
    const divisor = gcd(resultNumerator, commonDenominator);
    return {
        n: resultNumerator / divisor,
        d: commonDenominator / divisor,
    };
}

export interface Note {
    scale: number|null; //0-95 ,null=rest
    length: NoteLength;
}
export type Melody=Note[];
export type MMLState={
    length: NoteLength,
    octave: number,
}
export class Parser {
    constructor(public literals: LieteralSet) {

    }
    parse(mml:string)/*:Melody*/ {
        let i=0;
        let result=[] as Melody;
        const literals=this.literals;
        const state={
            length:nl(1,4),
            octave:4,
        };
        const scls=literals.scales;
        function reg(p:RegExp):RegExpExecArray|undefined {
            const looking=mml.substring(i);
            const m=p.exec(looking);
            if (m) {
                i+=m[0].length;
                return m;
            }
        }
        function str(p:string):RegExpExecArray|undefined {
            const looking=mml.substring(i);
            if (looking.startsWith(p)) {
                i+=p.length;
                const groups=[p];
                return Object.assign(groups,{groups, index:0, input:looking}) as any;
            }
        }
        function look(p:Pattern) {
            if (typeof p==="string") return str(p);
            return reg(p);
        }
        const parseLen=()=>{
            let length0=state.length;
            const lennum=look(/^[0-9]+/);
            if (lennum) {
                length0=nl(1, parseInt(lennum[0]));
            }
            let length=length0;
            while (true) {
                const longs=look(literals.longSyllable);
                if (!longs) break;
                length=addNoteLength(length, length0)
            }
            return length;
        }
        while(i<mml.length) {
            reg(/^\s*/);
            let pi=i;
            for (let j=0; j<scls.length;j++) {
                if (look(scls[j])) {
                    let sf=0;
                    while(true) {
                        if (look(literals.sharp)) {
                            sf++;
                        } else if (look(literals.flat)) {
                            sf--;
                        } else break;
                    }
                    let length=parseLen();
                    result.push({scale: scaleOffset[j] + state.octave*12, length});
                } else if (look(literals.rest)) {
                    let length=parseLen();
                    result.push({scale: null, length});    
                }
            }
            if (pi==i) i++;
        }
    }
}