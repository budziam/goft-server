import { injectable } from "inversify";
import { Psid } from "./types";
import { ClientManager } from "../Client/ClientManager";
import { Api } from "../Api";
import { Client, ClientState } from "../Client/Client";
import { GameManager } from "../Game/GameManager";

interface MessageQuickReply {
    payload: string;
}

export interface EventMessage {
    text: string;
    quick_reply?: MessageQuickReply;
}

enum ActionPayload {
    BetGameEnd = "bet-game-end",
    BulletColor = "bullet-color",
}

enum BulletColorPayload {
    Red = "#FF0000",
    Green = "#00FF00",
    Blue = "#0000FF",
}

@injectable()
export class MessageHandler {
    constructor(
        private readonly api: Api,
        private readonly clientManager: ClientManager,
        private readonly gameManager: GameManager,
    ) {
        //
    }

    public handle(psid: Psid, message: EventMessage): Promise<void> {
        if (message.text === "elo") {
            return this.api.sendMessage(psid, { text: "No siemka ziomek" });
        }

        const client = this.clientManager.get(psid);

        if (client.state === ClientState.New) {
            return this.displayPossibleActions(client);
        }

        if (client.state === ClientState.ActionDecision) {
            return this.handleActionChosen(client, message);
        }

        if (client.state === ClientState.ChooseBulletColor) {
            return this.handleBulletColorChosen(client, message);
        }

        return this.unknownSituation(client);
    }

    private async displayPossibleActions(client: Client): Promise<void> {
        client.moveToState(ClientState.ActionDecision);

        await this.api.sendMessage(client.psid, {
            text: "What do you want to do?",
            quick_replies: [
                {
                    content_type: "text",
                    title: "Bet game ends",
                    payload: ActionPayload.BetGameEnd,
                },
                {
                    content_type: "text",
                    title: "Modify bullet color",
                    payload: ActionPayload.BulletColor,
                },
            ],
        });
    }

    private async handleActionChosen(client: Client, message: EventMessage): Promise<void> {
        if (!message.quick_reply) {
            return this.unknownSituation(client);
        }

        if (message.quick_reply.payload === ActionPayload.BulletColor) {
            return this.displayPossibleBulletColors(client);
        }

        if (message.quick_reply.payload === ActionPayload.BetGameEnd) {
            // TODO Implement it
            client.moveToState(ClientState.New);
            return this.api.sendMessage(client.psid, {
                text: "You want to bet, huh? Sorry, not implemented yet.",
            });
        }

        return this.unknownSituation(client);
    }

    private async displayPossibleBulletColors(client: Client): Promise<void> {
        client.moveToState(ClientState.ChooseBulletColor);
        return this.api.sendMessage(client.psid, {
            text: "Select color of bullets",
            quick_replies: [
                {
                    content_type: "text",
                    title: "Red",
                    payload: BulletColorPayload.Red,
                    image_url: "https://gotf.sklep-sms.pl/images/red.png",
                },
                {
                    content_type: "text",
                    title: "Green",
                    payload: BulletColorPayload.Green,
                    image_url: "https://gotf.sklep-sms.pl/images/green.png",
                },
                {
                    content_type: "text",
                    title: "Blue",
                    payload: BulletColorPayload.Blue,
                    image_url: "https://gotf.sklep-sms.pl/images/blue.png",
                },
            ],
        });
    }

    private async handleBulletColorChosen(client: Client, message: EventMessage): Promise<void> {
        if (!message.quick_reply) {
            return this.unknownSituation(client);
        }

        client.moveToState(ClientState.New);
        this.gameManager.modifyColor(message.quick_reply.payload);
        return this.api.sendMessage(client.psid, { text: "The bullets look as you wish" });
    }

    private async unknownSituation(client: Client): Promise<void> {
        client.moveToState(ClientState.New);
        return this.api.sendMessage(client.psid, {
            text: "I've got trouble with understanding you. Let's start from the beginning...",
        });
    }
}
