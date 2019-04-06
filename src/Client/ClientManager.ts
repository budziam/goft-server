import { Psid } from "../Message/types";
import { Client } from "./Client";
import { injectable } from "inversify";

@injectable()
export class ClientManager {
    private readonly clients: Map<Psid, Client> = new Map();

    public get(psid: Psid): Client {
        if (!this.clients.has(psid)) {
            this.clients.set(psid, new Client(psid));
        }

        return this.clients.get(psid);
    }
}
