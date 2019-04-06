import { injectable } from "inversify";
import { Psid } from "./types";
import { ClientManager } from "../Client/ClientManager";
import { Api, MeMessage } from "../Api";
import { Client, ClientState } from "../Client/Client";
import { GameManager } from "../Game/GameManager";
import { Bet, BetType } from "../Game/Bet";
import { NotEnoughMoneyError } from "../Errors/NotEnoughMoneyError";

interface MessageQuickReply {
    payload: string;
}

export interface EventMessage {
    text: string;
    quick_reply?: MessageQuickReply;
}

enum ActionPayload {
    BetGameDuration = "bet-game-duration",
    BulletColor = "bullet-color",
    SwitchLightsOff = "switch-lights-off",
    CheckCredits = "check-credits",
    SendMessage = "send-message",
}

enum BulletColorPayload {
    Red = "#FF0000",
    Green = "#00FF00",
    Blue = "#0000FF",
}

const ALL_IN = "all-in";

const SWITCH_LIGHTS_OFF_PIRCE = 30;
const BULLET_COLOR_PIRCE = 30;
const MESSAGE_PIRCE = 30;

const coin = (value: number): string => `${value} Ƀ`;
const trunc = (text: string, n = 32) => (text.length > n ? text.substr(0, n - 1) + "..." : text);

@injectable()
export class MessageHandler {
    constructor(
        private readonly api: Api,
        private readonly clientManager: ClientManager,
        private readonly gameManager: GameManager,
    ) {
        //
    }

    public async handle(psid: Psid, message: EventMessage): Promise<void> {
        const client = this.clientManager.get(psid);
        const text = message.text.toLowerCase();

        if (text === "elo") {
            return this.sendMessage(client, { text: "No siemka ziomek" });
        }

        if (text === "cancel") {
            await this.api.sendMessage(client.psid, { text: "Let's start from the beginning..." });
            return this.displayPossibleActions(client);
        }

        // TODO Game not available

        if (client.state === ClientState.New) {
            return this.displayPossibleActions(client);
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

        if (message.quick_reply.payload === ActionPayload.CheckCredits) {
            return this.onCheckCreditsChosen(client);
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
        if (!message.quick_reply) {
            return this.unknownSituation(client);
        }

        client.moveToState(ClientState.New);

        try {
            await this.charge(client, BULLET_COLOR_PIRCE);
        } catch (e) {
            return this.handleChargeException(client, e);
        }

        this.gameManager.modifyColor(message.quick_reply.payload);
        await this.sendMessage(client, { text: "The bullets look as you wish :)" });
        await this.displayPossibleActions(client);
    }

    private async onSwitchLightsOffChosen(client: Client): Promise<void> {
        client.moveToState(ClientState.New);

        try {
            await this.charge(client, SWITCH_LIGHTS_OFF_PIRCE);
        } catch (e) {
            return this.handleChargeException(client, e);
        }

        this.gameManager.switchOffLights();
        await this.sendMessage(client, { text: "The lights went off. Ups..." });
        await this.displayPossibleActions(client);
    }

    private async onSendMessageChosen(client: Client): Promise<void> {
        client.moveToState(ClientState.TypeMessage);
        await this.sendMessage(client, { text: "Type your message, no longer than 32 characters:" });
    }

    private async onMessageTyped(client: Client, message: EventMessage): Promise<void> {
        client.moveToState(ClientState.New);

        try {
            await this.charge(client, MESSAGE_PIRCE);
        } catch (e) {
            return this.handleChargeException(client, e);
        }

        this.gameManager.sendMessage(trunc(message.text));
        await this.sendMessage(client, { text: "Your messaged was delivered to the COCKpit!" });
        await this.displayPossibleActions(client);
    }

    private async onCheckCreditsChosen(client: Client): Promise<void> {
        client.moveToState(ClientState.New);
        await this.sendMessage(client, { text: `You have ${coin(client.money)}` });
        await this.displayPossibleActions(client);
    }

    private async onGameDurationMoneyChosen(client: Client, message: EventMessage): Promise<void> {
        if (!message.quick_reply) {
            return this.unknownSituation(client);
        }

        client.tmpMoney = message.quick_reply.payload;
        client.moveToState(ClientState.ChooseGameDuration);
        await this.sendMessage(client, {
            text: "Tell me, in seconds, how long the game will last at least?",
        });
    }

    private async onGameDurationChosen(client: Client, message: EventMessage): Promise<void> {
        const tmpMoney = client.tmpMoney;
        client.tmpMoney = undefined;

        const duration = Math.min(parseInt(message.text), 1000);

        if (isNaN(duration) || duration < 1) {
            return this.unknownSituation(client);
        }

        client.moveToState(ClientState.New);
        const money = tmpMoney === ALL_IN ? client.money : parseInt(tmpMoney);

        try {
            await this.charge(client, money);
        } catch (e) {
            return this.handleChargeException(client, e);
        }

        this.gameManager.bet(new Bet(client.psid, BetType.GameDuration, money, duration));
        await this.sendMessage(client, {
            text: `You bet ${coin(money)} the game will last for at least ${duration} seconds. Wish you luck!`,
        });
        await this.displayPossibleActions(client);
    }

    private async displayPossibleActions(client: Client): Promise<void> {
        client.moveToState(ClientState.ActionDecision);
        await this.sendMessage(client, {
            text: `Hint: you can always type \`cancel\` to start from the beginning

Pricing:
- Modify bullet color ${coin(BULLET_COLOR_PIRCE)}
- Switch lights off ${coin(SWITCH_LIGHTS_OFF_PIRCE)}
- Send message ${coin(MESSAGE_PIRCE)}

What do you want to do?`,
            quick_replies: [
                {
                    content_type: "text",
                    title: "Bet game duration",
                    payload: ActionPayload.BetGameDuration,
                },
                {
                    content_type: "text",
                    title: "Modify bullet color",
                    payload: ActionPayload.BulletColor,
                },
                {
                    content_type: "text",
                    title: "Switch lights off",
                    payload: ActionPayload.SwitchLightsOff,
                },
                {
                    content_type: "text",
                    title: "Send message",
                    payload: ActionPayload.SendMessage,
                },
                {
                    content_type: "text",
                    title: "Check credits",
                    payload: ActionPayload.CheckCredits,
                },
            ],
        });
    }

    private async displayPossibleBulletColors(client: Client): Promise<void> {
        client.moveToState(ClientState.ChooseBulletColor);
        await this.sendMessage(client, {
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
        await this.sendMessage(client, {
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
        await this.sendMessage(client, {
            text: "I've got trouble with understanding you. Let's start from the beginning...",
        });
        await this.displayPossibleActions(client);
    }

    private async handleChargeException(client: Client, e: any): Promise<void> {
        if (e instanceof NotEnoughMoneyError) {
            await this.sendMessage(client, {
                text: `Your credits ${coin(client.money)} are not enough ¯\\_(ツ)_/¯`,
            });
            return this.displayPossibleActions(client);
        }

        throw e;
    }

    private async charge(client: Client, money: number): Promise<void> {
        client.charge(money);
        await this.sendMessage(client, { text: `You were charged ${coin(money)}` });
    }

    private async sendMessage(client: Client, message: MeMessage): Promise<void> {
        await this.api.sendMessage(client.psid, message);
    }
}
