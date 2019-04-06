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
}

enum BulletColorPayload {
    Red = "#FF0000",
    Green = "#00FF00",
    Blue = "#0000FF",
}

const ALL_IN = "all-in";

const SWITCH_LIGHTS_OFF_PIRCE = 30;
const BULLET_COLOR_PIRCE = 30;

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

        if (message.text === "elo") {
            return this.sendMessage(client, { text: "No siemka ziomek" });
        }

        if (message.text === "cancel") {
            this.sendMessage(client, { text: "Let's start from the beginning..." });
            return this.displayPossibleActions(client);
        }

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

        return this.unknownSituation(client);
    }

    private onActionChosen(client: Client, message: EventMessage): void {
        if (!message.quick_reply) {
            return this.unknownSituation(client);
        }

        if (message.quick_reply.payload === ActionPayload.BulletColor) {
            return this.displayPossibleBulletColors(client);
        }

        if (message.quick_reply.payload === ActionPayload.SwitchLightsOff) {
            return this.onSwitchLightsOffChosen(client);
        }

        if (message.quick_reply.payload === ActionPayload.BetGameDuration) {
            client.moveToState(ClientState.ChooseGameDurationMoney);
            return this.displayPossibleBetRates(client);
        }

        this.unknownSituation(client);
    }

    private onBulletColorChosen(client: Client, message: EventMessage): void {
        if (!message.quick_reply) {
            return this.unknownSituation(client);
        }

        client.moveToState(ClientState.New);

        try {
            this.charge(client, BULLET_COLOR_PIRCE);
            this.gameManager.modifyColor(message.quick_reply.payload);
            this.sendMessage(client, { text: "The bullets look as you wish :)" });
        } catch (e) {
            this.handleChargeException(client, e);
        }
    }

    private onSwitchLightsOffChosen(client: Client): void {
        client.moveToState(ClientState.New);

        try {
            this.charge(client, SWITCH_LIGHTS_OFF_PIRCE);
            this.gameManager.switchOffLights();
            this.sendMessage(client, { text: "The lights went off. Ups..." });
        } catch (e) {
            this.handleChargeException(client, e);
        }
    }

    private onGameDurationMoneyChosen(client: Client, message: EventMessage): void {
        if (!message.quick_reply) {
            return this.unknownSituation(client);
        }

        client.tmpMoney = message.quick_reply.payload;
        client.moveToState(ClientState.ChooseGameDuration);
        this.sendMessage(client, {
            text: "Tell me, in seconds, how long the game will last at least?",
        });
    }

    private onGameDurationChosen(client: Client, message: EventMessage): void {
        const tmpMoney = client.tmpMoney;
        client.tmpMoney = undefined;

        const seconds = Math.min(parseInt(message.text), 1000);

        if (isNaN(seconds)) {
            return this.unknownSituation(client);
        }

        client.moveToState(ClientState.New);
        const money = tmpMoney === ALL_IN ? client.money : parseInt(client.tmpMoney);

        try {
            this.charge(client, money);
            this.gameManager.bet(new Bet(client.psid, BetType.GameDuration, money, seconds));
            this.sendMessage(client, {
                text: `You bet ${money} Ƀ the game will last for at least ${seconds} seconds.`,
            });
        } catch (e) {
            this.handleChargeException(client, e);
        }
    }

    private displayPossibleActions(client: Client): void {
        client.moveToState(ClientState.ActionDecision);
        this.sendMessage(client, {
            text: "What do you want to do?",
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
            ],
        });
    }

    private displayPossibleBulletColors(client: Client): void {
        client.moveToState(ClientState.ChooseBulletColor);
        this.sendMessage(client, {
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

    private displayPossibleBetRates(client: Client): void {
        this.sendMessage(client, {
            text: "How much do you want to bet?",
            quick_replies: [
                {
                    content_type: "text",
                    title: "5 Ƀ",
                    payload: "50",
                },
                {
                    content_type: "text",
                    title: "10 Ƀ",
                    payload: "50",
                },
                {
                    content_type: "text",
                    title: "50 Ƀ",
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

    private unknownSituation(client: Client): void {
        client.moveToState(ClientState.New);
        this.sendMessage(client, {
            text: "I've got trouble with understanding you. Let's start from the beginning...",
        });
        this.displayPossibleActions(client);
    }

    private handleChargeException(client: Client, e: any): void {
        if (e instanceof NotEnoughMoneyError) {
            return this.sendMessage(client, {
                text: `Your credits ${client.money} Ƀ are not enough ¯\\_(ツ)_/¯`,
            });
        }

        throw e;
    }

    private charge(client: Client, money: number): void {
        client.charge(money);
        this.sendMessage(client, { text: `You were charged ${money} Ƀ` });
    }

    private sendMessage(client: Client, message: MeMessage): void {
        this.api.sendMessage(client.psid, message).catch(console.error);
    }
}
