import { Psid } from "../Message/types";

export enum BetType {
    GameEnd = 1,
}

export class Bet {
    constructor(
        public readonly psid: Psid,
        public readonly type: BetType,
        public readonly seconds: number,
    ) {
        //
    }
}
