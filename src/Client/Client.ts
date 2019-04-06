import { Psid } from "../Message/types";
import { NotEnoughMoneyError } from "../Errors/NotEnoughMoneyError";

export enum ClientState {
    New = 1,
    ActionDecision,
    ChooseBulletColor,
    ChooseGameDurationMoney,
    ChooseGameDuration,
}

export class Client {
    private readonly _psid: Psid;
    private _state: ClientState = ClientState.New;
    private _money: number = 100;

    public tmpMoney?: string;

    constructor(psid: Psid) {
        this._psid = psid;
    }

    public get state(): ClientState {
        return this._state;
    }

    public get psid(): Psid {
        return this._psid;
    }

    public get money(): number {
        return this._money;
    }

    public moveToState(newState: ClientState): void {
        this._state = newState;
    }

    public charge(money: number): void {
        if (this._money < money) {
            throw new NotEnoughMoneyError();
        }

        this._money -= money;
    }
}
