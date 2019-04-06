import { injectable } from "inversify";
import { GameManager } from "../Game/GameManager";
import { ClientManager } from "../Client/ClientManager";
import { Api } from "../Api";
import { Client } from "../Client/Client";
import { boundMethod } from "autobind-decorator";

@injectable()
export class ServerManager {
    constructor(
        private readonly api: Api,
        private readonly clientManager: ClientManager,
        private readonly gameManager: GameManager,
    ) {
        //
    }

    @boundMethod
    public startGame(): void {
        for (const client of this.clientManager.clients) {
            this.informClientAboutStart(client).catch(console.error);
        }
    }

    @boundMethod
    public endGame(): void {
        for (const client of this.clientManager.clients) {
            this.informClientAboutEnd(client).catch(console.error);
        }

        this.clientManager.clear();
        this.gameManager.clear();
    }

    private async informClientAboutStart(client: Client): Promise<void> {
        await this.api.sendMessage(client.psid, { text: "New game has just started! Bet your MONEY!" });
    }

    private async informClientAboutEnd(client: Client): Promise<void> {
        await this.api.sendMessage(client.psid, { text: "Game has ended." });
        // TODO Check bets
    }
}
