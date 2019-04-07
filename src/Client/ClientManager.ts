import { Psid } from "../Message/types";
import { Client } from "./Client";
import { injectable } from "inversify";

@injectable()
export class ClientManager {
    public readonly _clients: Map<Psid, Client> = new Map();

    public get clients(): Client[] {
        return [...this._clients.values()];
    }

    public get(psid: Psid): Client {
        if (!this._clients.has(psid)) {
            this._clients.set(psid, new Client(psid));
        }

        return this._clients.get(psid);
    }

    public remove(psid: Psid): void {
        this._clients.delete(psid);
    }

    public clear(): void {
        for (const client of this._clients.values()) {
            client.reset();
        }
    }
}
