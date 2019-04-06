import { injectable } from "inversify";
import { GameManager } from "./Game/GameManager";
import { ClientManager } from "./Client/ClientManager";
import { Api } from "./Api";
import { Client } from "./Client/Client";

@injectable()
export class ServerManager {
    constructor(
        public readonly api: Api,
        public readonly clientManager: ClientManager,
        public readonly gameManager: GameManager,
    ) {
        //
    }

    // TODO Use it when new game starts.
    public endGame(): void {
        for (const client of this.clientManager.clients) {
            this.informClientAboutEnd(client).catch(console.error);
        }

        this.clientManager.clear();
        this.gameManager.clear();
    }

    private async informClientAboutEnd(client: Client): Promise<void> {
        await this.api.sendMessage(client.psid, { text: "Game has ended" });
        // TODO Implement
    }
}
