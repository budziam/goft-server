import { injectable } from "inversify";
import { GameManager } from "../Game/GameManager";
import { ClientManager } from "../Client/ClientManager";
import { Client } from "../Client/Client";
import { boundMethod } from "autobind-decorator";
import { MessageSender } from "../Message/MessageSender";

@injectable()
export class ServerManager {
    constructor(
        private readonly clientManager: ClientManager,
        private readonly gameManager: GameManager,
        private readonly messageSender: MessageSender,
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
        await this.messageSender.send(client, {
            text: "New game has just started! Bet your MONEY!",
        });
        await this.messageSender.displayPossibleActions(client);
    }

    private async informClientAboutEnd(client: Client): Promise<void> {
        await this.messageSender.send(client, { text: "Game has ended." });
        // TODO Check bets
    }
}
