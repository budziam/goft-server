import { injectable } from "inversify";
import { Psid } from "./types";
import { ClientManager } from "../Client/ClientManager";
import { Api } from "../Api";
import { Client, ClientState } from "../Client/Client";

interface MessageQuickReply {
    payload: string;
}

export interface EventMessage {
    text: string;
    quick_reply?: MessageQuickReply;
}

enum ActionPayload {
    BetGameEnd = 'bet-game-end',
    BulletColor = 'bullet-color',
}

@injectable()
export class MessageHandler {
    constructor(
        private readonly api: Api,
        private readonly clientManager: ClientManager,
    ) {
        //
    }

    public handle(psid: Psid, message: EventMessage): Promise<void> {
        if (message.text === "elo") {
            return this.api.sendMessage(psid, { text: "No siemka ziomek" });
        }

        const client = this.clientManager.get(psid);

        if (client.state === ClientState.New) {
            return this.handleNewClient(client);
        }

        if (client.state === ClientState.ChoosingGame) {
            return this.handleGameChosen(client, message);
        }

        if (client.state === ClientState.ActionDecision) {
            return this.handleActionChosen(client, message);
        }

        return this.unknownSituation(client);
    }

    private async handleNewClient(client: Client): Promise<void> {
        client.moveToState(ClientState.ChoosingGame);
        await this.api.sendMessage(client.psid, {
            text: "Choose the game you are interested in:",
            quick_replies: [
                {
                    content_type: "text",
                    title: "Game 1",
                    payload: "tour-1",
                },
                {
                    content_type: "text",
                    title: "Game 2",
                    payload: "tour-3",
                },
                {
                    content_type: "text",
                    title: "Game 3",
                    payload: "tour-3",
                },
            ]
        });
    }

    private async handleGameChosen(client: Client, message: EventMessage): Promise<void> {
        if (!message.quick_reply) {
            return this.unknownSituation(client);
        }

        const [, gameId] = message.quick_reply.payload.split("-");

        client.moveToState(ClientState.ActionDecision);

        await this.api.sendMessage(client.psid, { text: `You selected game #${gameId}` });
        await this.api.sendMessage(client.psid, {
            text: "What do you want to do?",
            quick_replies: [
                {
                    content_type: "text",
                    title: "Bet: game will end in X seconds",
                    payload: ActionPayload.BetGameEnd,
                },
                {
                    content_type: "text",
                    title: "Modify bullet color",
                    payload: ActionPayload.BulletColor,
                },
            ]
        });
    }

    private async handleActionChosen(client: Client, message: EventMessage): Promise<void> {
        if (!message.quick_reply) {
            return this.unknownSituation(client);
        }

        // TODO Remove it
        client.moveToState(ClientState.New);

        if (message.quick_reply.payload === ActionPayload.BetGameEnd) {
            // TODO Implement it
            return this.api.sendMessage(client.psid, { text: "You want to bet, huh? Sorry, not implemented yet." });
        }

        if (message.quick_reply.payload === ActionPayload.BulletColor) {
            // TODO Implement it
            return this.api.sendMessage(client.psid, { text: "You want to change color of a bullet, huh? Sorry, not implemented yet." });
        }
    }

    private async unknownSituation(client: Client): Promise<void> {
        client.moveToState(ClientState.New);
        return this.api.sendMessage(client.psid, { text: "I've got trouble with understanding you. Let's start from the beginning..." });
    }
}
