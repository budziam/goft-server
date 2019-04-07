import { injectable } from "inversify";
import { Bet } from "./Bet";
import { ConnectionHandler, MessageType } from "../Server/ConnectionHandler";
import { coin, MessageSender } from "../Message/MessageSender";
import { Client } from "../Client/Client";

const SECONDS_TO_DOUBLE = 20;

@injectable()
export class GameManager {
    private bulletColor: string;
    public bets: Bet[] = [];
    private timeoutHandles: Set<number> = new Set();

    constructor(
        private readonly connectionHandler: ConnectionHandler,
        private readonly messageSender: MessageSender,
    ) {
        //
    }

    public modifyColor(color: string, client: Client): void {
        this.bulletColor = color;
        this.connectionHandler.send(
            {
                type: MessageType.ChangeBulletColor,
                data: { color },
            },
            client,
        );
        console.info(`Color of bullets has changed to [${this.bulletColor}]`);
    }

    public bet(bet: Bet): void {
        this.bets.push(bet);
        this.connectionHandler.send(
            {
                type: MessageType.BetGameDuration,
                data: {
                    money: bet.money,
                    duration: bet.duration,
                },
            },
            bet.client,
        );

        const handler = setTimeout(() => {
            this.timeoutHandles.delete(handler);
            this.betIsSuccess(bet).catch(console.error);
        }, bet.duration * 1000) as any;
        this.timeoutHandles.add(handler);

        console.info("New bet!", { bet });
    }

    public switchOffLights(client: Client): void {
        this.connectionHandler.send(
            {
                type: MessageType.SwitchLightOff,
            },
            client,
        );
        console.info("Switch off the lights!");
    }

    public sendMessage(text: string, client: Client) {
        this.connectionHandler.send(
            {
                type: MessageType.SendMessage,
                data: { text },
            },
            client,
        );
        console.info(`Someone send message [${text}]!`);
    }

    public clear(): void {
        for (const handle of this.timeoutHandles) {
            clearTimeout(handle);
        }
        this.bets = [];
        this.bulletColor = undefined;
        this.timeoutHandles.clear();
    }

    private async betIsSuccess(bet: Bet): Promise<void> {
        const money = Math.ceil((1 + bet.duration / SECONDS_TO_DOUBLE) * bet.money);
        bet.client.topUp(money);
        await this.messageSender.send(bet.client, {
            text: `You bet well ${coin(bet.money)} and you win ${coin(money)}!`,
        });
    }
}
