import { injectable } from "inversify";
import { Psid } from "./types";
import { ClientManager } from "../Client/ClientManager";
import { Client, ClientState } from "../Client/Client";
import { GameManager } from "../Game/GameManager";
import { Bet, BetType } from "../Game/Bet";
import { NotEnoughMoneyError } from "../Errors/NotEnoughMoneyError";
import { ConnectionHandler } from "../Server/ConnectionHandler";
import {
    ActionPayload,
    BULLET_COLOR_PIRCE,
    MESSAGE_PIRCE,
    SWITCH_LIGHTS_OFF_PIRCE,
} from "./constants";
import { coin, MessageSender } from "./MessageSender";
import { Api } from "../Api";

interface MessageQuickReply {
    payload: string;
}

export interface EventMessage {
    text: string;
    quick_reply?: MessageQuickReply;
}

enum BulletColorPayload {
    Red = "#FF0000",
    Green = "#00FF00",
    Blue = "#0000FF",
}

const ALL_IN = "all-in";

const trunc = (text: string, n = 27) => (text.length > n ? text.substr(0, n - 1) + "..." : text);

@injectable()
export class MessageHandler {
    constructor(
        private readonly api: Api,
        private readonly clientManager: ClientManager,
        private readonly connectionHandler: ConnectionHandler,
        private readonly gameManager: GameManager,
        private readonly messageSender: MessageSender,
    ) {
        //
    }

    public async handle(psid: Psid, message: EventMessage): Promise<void> {
        const client = this.clientManager.get(psid);
        message.text = message.text.trim();
        const text = message.text.toLowerCase();

        // TODO Handle messages properly even if not clicked by button
        // TODO Change handling elo
        // TODO Bullets

        if (!client.profile) {
            this.api
                .getProfile(client.psid)
                .then(client.setProfile)
                .catch(console.error);
        }

        if (text === "elo") {
            return this.messageSender.send(client, { text: "No siemka ziomek" });
        }

        if (!this.connectionHandler.isLive()) {
            return this.messageSender.send(client, {
                text: "Game has not started yet. Please wait.",
            });
        }

        if (text === "cancel") {
            await this.messageSender.send(client, { text: "Let's start from the beginning..." });
            return this.messageSender.displayPossibleActions(client);
        }

        if (client.state === ClientState.New) {
            return this.messageSender.displayPossibleActions(client);
        }

        if (client.state === ClientState.ActionDecision) {
            return this.onActionChosen(client, message);
        }

        if (client.state === ClientState.ChooseBulletColor) {
            return this.onBulletColorChosen(client, message);
        }

        if (client.state === ClientState.ChooseGameDurationMoney) {
            return this.onGameDurationMoneyChosen(client, message);
        }

        if (client.state === ClientState.ChooseGameDuration) {
            return this.onGameDurationChosen(client, message);
        }

        if (client.state === ClientState.TypeMessage) {
            return this.onMessageTyped(client, message);
        }

        return this.unknownSituation(client);
    }

    private async onActionChosen(client: Client, message: EventMessage): Promise<void> {
        if (!message.quick_reply) {
            return this.unknownSituation(client);
        }

        if (message.quick_reply.payload === ActionPayload.BulletColor) {
            return this.displayPossibleBulletColors(client);
        }

        if (message.quick_reply.payload === ActionPayload.SwitchLightsOff) {
            return this.onSwitchLightsOffChosen(client);
        }

        if (message.quick_reply.payload === ActionPayload.SendMessage) {
            return this.onSendMessageChosen(client);
        }

        if (message.quick_reply.payload === ActionPayload.BetGameDuration) {
            client.moveToState(ClientState.ChooseGameDurationMoney);
            return this.displayPossibleBetRates(client);
        }

        return this.unknownSituation(client);
    }

    private async onBulletColorChosen(client: Client, message: EventMessage): Promise<void> {
        const text = message.quick_reply ? message.quick_reply.payload : message.text;

        if (!/^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.exec(message.text)) {
            return this.unknownSituation(client);
        }

        const color = text.replace(/^#?/, "#");

        client.moveToState(ClientState.New);

        try {
            await this.charge(client, BULLET_COLOR_PIRCE);
        } catch (e) {
            return this.handleChargeException(client, e);
        }

        this.gameManager.modifyColor(color, client);
        await this.messageSender.send(client, { text: "The bullets look as you wish :)" });
        await this.messageSender.displayPossibleActions(client);
    }

    private async onSwitchLightsOffChosen(client: Client): Promise<void> {
        client.moveToState(ClientState.New);

        try {
            await this.charge(client, SWITCH_LIGHTS_OFF_PIRCE);
        } catch (e) {
            return this.handleChargeException(client, e);
        }

        this.gameManager.switchOffLights(client);
        await this.messageSender.send(client, { text: "The lights went off. Ups..." });
        await this.messageSender.displayPossibleActions(client);
    }

    private async onSendMessageChosen(client: Client): Promise<void> {
        client.moveToState(ClientState.TypeMessage);
        await this.messageSender.send(client, {
            text: "Type your message, no longer than 29 characters:",
        });
    }

    private async onMessageTyped(client: Client, message: EventMessage): Promise<void> {
        client.moveToState(ClientState.New);

        try {
            await this.charge(client, MESSAGE_PIRCE);
        } catch (e) {
            return this.handleChargeException(client, e);
        }

        this.gameManager.sendMessage(trunc(message.text), client);
        await this.messageSender.send(client, {
            text: "Your messaged was delivered to the COCKpit!",
        });
        await this.messageSender.displayPossibleActions(client);
    }

    private async onGameDurationMoneyChosen(client: Client, message: EventMessage): Promise<void> {
        const money = message.quick_reply ? message.quick_reply.payload : message.text;

        if (money !== ALL_IN && isNaN(parseInt(money))) {
            return this.unknownSituation(client);
        }

        client.tmpMoney = money;
        client.moveToState(ClientState.ChooseGameDuration);
        await this.messageSender.send(client, {
            text: "Tell me, in seconds, how long the game will last at least?",
            quick_replies: [
                {
                    content_type: "text",
                    title: "5",
                    payload: "5",
                },
                {
                    content_type: "text",
                    title: "10",
                    payload: "10",
                },
                {
                    content_type: "text",
                    title: "20",
                    payload: "20",
                },
                {
                    content_type: "text",
                    title: "40",
                    payload: "40",
                },
                {
                    content_type: "text",
                    title: "60",
                    payload: "60",
                },
            ],
        });
    }

    private async onGameDurationChosen(client: Client, message: EventMessage): Promise<void> {
        const tmpMoney = client.tmpMoney;
        client.tmpMoney = undefined;

        const text = message.quick_reply ? message.quick_reply.payload : message.text;
        const parsedDuration = parseInt(text);

        if (isNaN(parsedDuration) || parsedDuration < 1) {
            return this.unknownSituation(client);
        }

        client.moveToState(ClientState.New);

        const duration = Math.min(parsedDuration, 1000);
        const money = tmpMoney === ALL_IN ? client.money : parseInt(tmpMoney);

        try {
            await this.charge(client, money);
        } catch (e) {
            return this.handleChargeException(client, e);
        }

        this.gameManager.bet(new Bet(client, BetType.GameDuration, money, duration));
        await this.messageSender.send(client, {
            text: `You bet ${coin(
                money,
            )} the game will last for at least ${duration} seconds. Wish you luck!`,
        });
        await this.messageSender.displayPossibleActions(client);
    }

    private async displayPossibleBulletColors(client: Client): Promise<void> {
        client.moveToState(ClientState.ChooseBulletColor);
        await this.messageSender.send(client, {
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

    private async displayPossibleBetRates(client: Client): Promise<void> {
        await this.messageSender.send(client, {
            text: "How much do you want to bet?",
            quick_replies: [
                {
                    content_type: "text",
                    title: coin(5),
                    payload: "5",
                },
                {
                    content_type: "text",
                    title: coin(10),
                    payload: "10",
                },
                {
                    content_type: "text",
                    title: coin(50),
                    payload: "50",
                },
                {
                    content_type: "text",
                    title: "All-in!",
                    payload: ALL_IN,
                },
            ],
        });
    }

    private async unknownSituation(client: Client): Promise<void> {
        client.moveToState(ClientState.New);
        await this.messageSender.send(client, {
            text: "I've got trouble with understanding you. Let's start from the beginning...",
        });
        await this.messageSender.displayPossibleActions(client);
    }

    private async handleChargeException(client: Client, e: any): Promise<void> {
        if (e instanceof NotEnoughMoneyError) {
            await this.messageSender.send(client, {
                text: `Your credits ${coin(client.money)} are not enough ¯\\_(ツ)_/¯`,
            });
            return this.messageSender.displayPossibleActions(client);
        }

        throw e;
    }

    private async charge(client: Client, money: number): Promise<void> {
        client.charge(money);
        await this.messageSender.send(client, { text: `You were charged ${coin(money)}` });
    }
}
