export function cafId(name: string): number;
export function encodeOfficialBuffer(fields: {prefix?: number; command: number; reply?: number; module?: number; words: number[]; count?: number}): Uint8Array;
export function asWebHidData(buffer: Uint8Array, expectedDataBytes?: number): {reportId: number; data: Uint8Array};
