import { Source } from ".";

export type LieteralSet={
    scales:string[],
    longSyllable: string, 
    rhysms?: Map<string, Source>;
}
export const standardLiteralSet:LieteralSet={
    scales: ["a","b","c","d","e","f","g"],
    longSyllable: "^", 
    
};
export const japaneseLiteralSet:LieteralSet={
    scales: ["ラ","シ","ド","レ","ミ","ファ","ソ"],
    longSyllable: "ー", 
};

export interface NoteLength {
    n: number;   
    d: number; //   n/d
}
export interface Note {
    scale: number; //0-95
    length: NoteLength;
}
export type Melody=Note[];
export class Parser {
    constructor(public literals: LieteralSet) {

    }
    parse(mml:string)/*:Melody*/ {
        
    }
}