import { injectable } from "inversify";
import { Client, ClientState } from "../Client/Client";
import { Api, MeMessage } from "../Api";
import {
    ActionPayload,
    BULLET_COLOR_PIRCE,
    MESSAGE_PIRCE,
    SWITCH_LIGHTS_OFF_PIRCE,
} from "./constants";

export const coin = (value: number): string => `💰${value}`;

@injectable()
export class MessageSender {
    constructor(private readonly api: Api) {
        //
    }

    public async send(client: Client, message: MeMessage): Promise<void> {
        return this.api.sendMessage(client.psid, message);
    }

    public async displayPossibleActions(client: Client): Promise<void> {
        client.moveToState(ClientState.ActionDecision);
        await this.send(client, {
            text: `Hint: you can always type \`cancel\` to start from the beginning

Pricing
- 🔫 Bullets color ${coin(BULLET_COLOR_PIRCE)}
- 💡 Switch lights off ${coin(SWITCH_LIGHTS_OFF_PIRCE)}
- 📩 Send message ${coin(MESSAGE_PIRCE)}

You have ${coin(client.money)} What do you want to do?`,
            quick_replies: [
                {
                    content_type: "text",
                    title: ActionPayload.BetGameDuration,
                    payload: ActionPayload.BetGameDuration,
                },
                {
                    content_type: "text",
                    title: ActionPayload.BulletColor,
                    payload: ActionPayload.BulletColor,
                },
                {
                    content_type: "text",
                    title: ActionPayload.SwitchLightsOff,
                    payload: ActionPayload.SwitchLightsOff,
                },
                {
                    content_type: "text",
                    title: ActionPayload.SendMessage,
                    payload: ActionPayload.SendMessage,
                },
            ],
        });
    }
}
