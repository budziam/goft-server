import { Psid } from "../Message/types";

export enum ClientState {
    New = 1,
    ChoosingGame,
    ActionDecision,
}

export class Client {
    private readonly _psid: Psid;
    private _state: ClientState = ClientState.New;

    constructor(psid: Psid) {
        this._psid = psid;
    }

    public get state(): ClientState {
        return this._state;
    }

    public get psid(): Psid {
        return this._psid;
    }

    public moveToState(newState: ClientState): void {
        this._state = newState;
    }
}
