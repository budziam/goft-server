import { injectable } from "inversify";
import { Bet } from "./Bet";

@injectable()
export class GameManager {
    private bulletColor: string;
    private bets: Bet[] = [];

    public modifyColor(color: string) {
        this.bulletColor = color;
        // TODO Send info to the game
        console.info(`Color of bullets has changed to [${this.bulletColor}]`);
    }

    public bet(bet: Bet): void {
        this.bets.push(bet);
        console.info("New bet!", { bet });
        // TODO Send info to game
    }

    public clear(): void {
        this.bets = [];
        this.bulletColor = undefined;
    }

    public switchOffLights(): void {
        // TODO Send info to game
        console.info("Switch off the lights!");
    }

    public sendMessage(text: string) {
        // TODO Send info to game
        console.info(`Someone send message [${text}]!`);
    }
}
