import { Psid } from "../Message/types";

export enum BetType {
    GameDuration = 1,
}

export class Bet {
    constructor(
        public readonly psid: Psid,
        public readonly type: BetType,
        public readonly money: number,
        public readonly duration: number,
    ) {
        //
    }
}
