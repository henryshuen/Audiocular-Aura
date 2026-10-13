// Test-only DOM surface: avoid importing global Node typings into the existing suite.
declare module 'jsdom' {
 export class JSDOM {
  constructor(html:string);
  readonly window:Window & typeof globalThis;
 }
}
