import { injectable } from "inversify";

@injectable()
export class GameManager {
    private bulletColor = "#0000FF";

    public modifyColor(color: string) {
        this.bulletColor = color;
        // TODO Send info to the game
        console.info(`Color of bullets has changed to [${this.bulletColor}]`);
    }
}
