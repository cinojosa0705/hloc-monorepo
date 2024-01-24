export type SearchParamsObject = { [key: string]: string };

export interface Candle {
    h: number;
    l: number;
    o: number;
    c: number;
    timestamp: Date;
}

export type StringSetMap = Map<string, Set<string>>;

export type WebSocketParams = {
    mpg: string;
    asset: string;
    tick: string;
};