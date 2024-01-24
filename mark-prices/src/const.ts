import web3 = require("@solana/web3.js");
import { Wallet } from "@project-serum/anchor";
import { AggregationParams, TRG_MPG } from "./types";

export const rpc =
    "https://your_rpc_url";

const keypair = web3.Keypair.generate();
export const wallet = new Wallet(keypair);

// TRG for each MPG
export const MPG_TRGs: TRG_MPG[] = [
    {
        trg: new web3.PublicKey("DCnbikggLtTfQWNVix2YbmdAPwmMLydnpMuLvaeg4ctn"),
        mpg: 'BLUECHIP'
    },
    {
        trg: new web3.PublicKey("CuEpREPNtCgTykHsnKXDqdxjqYgtbRRfDUKaL3iXTja5"),
        mpg: 'STAKECHIP'
    }
]

export const UNINITIALIZED = new web3.PublicKey("11111111111111111111111111111111");

export const SubtablesNo1Min = [
  "5_m",
  "15_m",
  "1_h",
  "4_h",
  "1_d",
];

export const subtables = [
    "1_m",
    "5_m",
    "15_m",
    "1_h",
    "4_h",
    "1_d",
];

export const aggregationMapping: Record<string, AggregationParams> = {
    "5_m": {
      sourceTick: "1_m",
      modulo: 5,
      validTimes: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
      type: 'm'
    },
    "15_m": {
      sourceTick: "5_m",
      modulo: 15,
      validTimes: [0, 15, 30, 45],
      type: 'm'
    },
    "1_h": {
      sourceTick: "15_m",
      modulo: 60,
      validTimes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
      type: 'h'
    },
    "4_h": {
      sourceTick: "1_h",
      modulo: 24,
      validTimes: [0, 4, 8, 12, 16, 20],
      type: 'h'
    },
    "1_d": {
      sourceTick: "4_h",
      modulo: 24,
      validTimes: [0],
      type: 'd'
    },
  };