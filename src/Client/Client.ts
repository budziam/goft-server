import { Psid } from "../Message/types";
import { NotEnoughMoneyError } from "../Errors/NotEnoughMoneyError";

// https://stackoverflow.com/questions/37518264/how-to-access-the-name-of-someone-with-messenger-chat-bot-facebook-messenger-s

export enum ClientState {
    New = 1,
    ActionDecision,
    ChooseBulletColor,
    ChooseGameDurationMoney,
    ChooseGameDuration,
    TypeMessage,
}

export const INITIAL_MONEY = 100;

export class Client {
    private readonly _psid: Psid;
    private _state: ClientState = ClientState.New;
    private _money: number = INITIAL_MONEY;

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

    public topUp(money: number): void {
        this._money += money;
    }
}
