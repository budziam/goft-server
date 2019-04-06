import { injectable } from "inversify";
import { Bet } from "./Bet";
import { ConnectionHandler, MessageType } from "../Server/ConnectionHandler";

@injectable()
export class GameManager {
    private bulletColor: string;
    private bets: Bet[] = [];

    constructor(
        private readonly connectionHandler: ConnectionHandler,
    ) {
        //
    }

    public modifyColor(color: string): void {
        this.bulletColor = color;
        this.connectionHandler.send({
            type: MessageType.ChangeBulletColor,
            data: {color},
        });
        console.info(`Color of bullets has changed to [${this.bulletColor}]`);
    }

    public bet(bet: Bet): void {
        this.bets.push(bet);
        this.connectionHandler.send({
            type: MessageType.BetGameDuration,
            data: {
                money: bet.money,
                duration: bet.duration,
            },
        });
        console.info("New bet!", { bet });
    }

    public switchOffLights(): void {
        this.connectionHandler.send({
            type: MessageType.SwitchLightOff,
        });
        console.info("Switch off the lights!");
    }

    public sendMessage(text: string) {
        this.connectionHandler.send({
            type: MessageType.SendMessage,
            data: {text},
        });
        console.info(`Someone send message [${text}]!`);
    }

    public clear(): void {
        this.bets = [];
        this.bulletColor = undefined;
    }
}
