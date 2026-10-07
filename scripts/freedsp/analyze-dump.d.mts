export interface HelperPacket {
  line: number;
  direction: string;
  bytes: number[];
  prefixU8: number;
  prefixU16: number;
  prefixU32: number;
  countU16: number;
  commandRaw: number;
  command: number;
  responseBit: boolean;
  moduleU32: number;
  words: number[];
  coefficient: { band: number; gainDb: number; gainMarker: number; words: number[] } | null;
}
export interface Analysis {
  packetCount: number;
  pairCount: number;
  commands: { command: number; pairCount: number; tx: { counts: number[]; offsetStats: { offset: number; unique: number[]; entropyBits: number }[] }; rx: { counts: number[] } }[];
  families: { family: string; count: number; txWordValues: number[][] }[];
  structuralChecks: Record<string, boolean | number>;
  pairs: { pair: number; command: number; family: string; differingOffsets: number[]; txWords: number[]; rxWords: number[]; txCount: number; rxCount: number; coefficientLogMatches: boolean | null; coefficientLog: HelperPacket['coefficient'] }[];
}
export function parseHelperDump(text: string): HelperPacket[];
export function analyzeHelperDump(text: string): Analysis;
