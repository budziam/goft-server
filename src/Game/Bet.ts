import { Client } from "../Client/Client";

export enum BetType {
    GameDuration = 1,
}

export class Bet {
    constructor(
        public readonly client: Client,
        public readonly type: BetType,
        public readonly money: number,
        public readonly duration: number,
    ) {
        //
    }
}
