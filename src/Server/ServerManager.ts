import { injectable } from "inversify";
import { GameManager } from "../Game/GameManager";
import { ClientManager } from "../Client/ClientManager";
import { Client, INITIAL_MONEY } from "../Client/Client";
import { boundMethod } from "autobind-decorator";
import { coin, MessageSender } from "../Message/MessageSender";

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
        let text = "Game has ended. ";
        const result = client.money - INITIAL_MONEY;

        if (result < 0) {
            text += `You lost ${coin(Math.abs(result))} ¯\\_(ツ)_/¯`;
        } else if (result > 0) {
            text += `You won ${coin(result)} 🔥🔥🔥 FUCKING AWESOME 🔥🔥🔥`;
        }

        await this.messageSender.send(client, { text });
    }
}
