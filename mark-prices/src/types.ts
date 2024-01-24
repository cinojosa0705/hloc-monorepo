import { PublicKey } from "@solana/web3.js";

export interface AggregationParams {
    sourceTick: string;
    modulo: number;
    validTimes: number[];
    type: 'm' | 'h' | 'd'
}

export interface PriceRaw {
    price: number;
    timestamp: Date;
}

export interface Candle {
    h: number;
    l: number;
    o: number;
    c: number;
    timestamp: Date;
}

export interface AggregationParams {
    validTimes: number[];
    type: 'm' | 'h' | 'd';
}

export interface TRG_MPG {
    trg: PublicKey,
    mpg: string
}