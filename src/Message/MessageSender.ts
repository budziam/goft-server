import { injectable } from "inversify";
import { Client, ClientState } from "../Client/Client";
import { Api, MeMessage } from "../Api";
import {
    ActionPayload,
    BULLET_COLOR_PIRCE,
    SEND_MEME_PIRCE,
    SEND_MESSAGE_PIRCE,
    SPAWN_ENEMIES_PRICE,
    SWITCH_LIGHTS_OFF_PIRCE,
} from "./constants";

export const coin = (value: number): string => `${value}💰`;

@injectable()
export class MessageSender {
    constructor(private readonly api: Api) {
        //
    }

    public async send(client: Client, message: MeMessage): Promise<void> {
        return this.api.sendMessage(client.psid, message);
    }

    public async askForNextAction(client: Client): Promise<void> {
        client.moveToState(ClientState.ActionDecision);
        await this.send(client, {
            text: `You have ${coin(client.money)}. What do you want to do?`,
            quick_replies: this.getQuickReplies(),
        });
    }

    public async displayPossibleActions(client: Client): Promise<void> {
        client.moveToState(ClientState.ActionDecision);
        await this.send(client, {
            text: `Hint: you can always type \`cancel\` to start from the beginning.

Pricing
- ☠️ Spawn enemies ${coin(SPAWN_ENEMIES_PRICE)}
- 🔫 Bullets color ${coin(BULLET_COLOR_PIRCE)}
- 💡 Switch lights off ${coin(SWITCH_LIGHTS_OFF_PIRCE)}
- 📩 Send message ${coin(SEND_MESSAGE_PIRCE)}
- 💌 Send meme ${coin(SEND_MEME_PIRCE)}

You have ${coin(client.money)}. What do you want to do?`,
            quick_replies: this.getQuickReplies(),
        });
    }

    private getQuickReplies(): any[] {
        return [
            {
                content_type: "text",
                title: "☠ Spawn enemies",
                payload: ActionPayload.SpawnEnemies,
            },
            {
                content_type: "text",
                title: "💸 Bet game duration",
                payload: ActionPayload.BetGameDuration,
            },
            {
                content_type: "text",
                title: "🔫 Bullets color",
                payload: ActionPayload.BulletColor,
            },
            {
                content_type: "text",
                title: "💡 Switch lights off",
                payload: ActionPayload.SwitchLightsOff,
            },
            {
                content_type: "text",
                title: "📩 Send message",
                payload: ActionPayload.SendMessage,
            },
            {
                content_type: "text",
                title: "💌 Send meme",
                payload: ActionPayload.SendMeme,
            },
        ];
    }
}
