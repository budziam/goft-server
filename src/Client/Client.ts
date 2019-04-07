import { Psid } from "../Message/types";
import { NotEnoughMoneyError } from "../Errors/NotEnoughMoneyError";
import { boundMethod } from "autobind-decorator";

export enum ClientState {
    ActionDecision = 1,
    ChooseBulletColor,
    ChooseGameDurationMoney,
    ChooseGameDuration,
    TypeMessage,
}

export interface ClientProfile {
    firstName: string;
    lastName: string;
    avatar: string;
}

export const INITIAL_MONEY = 100;

export class Client {
    private readonly _psid: Psid;
    private _state: ClientState = ClientState.ActionDecision;
    private _money: number = INITIAL_MONEY;
    private _profile?: ClientProfile;

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

    public get profile(): ClientProfile {
        return this._profile;
    }

    @boundMethod
    public setProfile(profile: ClientProfile): void {
        this._profile = profile;
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
