import { injectable } from "inversify";
import { Socket } from "net";
import { prependLength, splitData } from "./utils";
import { ServerManager } from "./ServerManager";
import { boundMethod } from "autobind-decorator";

export enum MessageType {
    Handshake = "handshake",
    SwitchLightOff = "switch_light_off",
    ChangeBulletColor = "change_bullet_color",
    SendMessage = "send_message",
    BetGameDuration = "bet_game_duration",
}

interface TcpMessage {
    type: MessageType;
    data?: any;
}

@injectable()
export class ConnectionHandler {
    private socket?: Socket;

    constructor(private readonly serverManager: ServerManager) {
        //
    }

    public start(socket: Socket): void {
        if (this.isLive()) {
            this.close();
        }

        socket.setNoDelay(true);
        this.socket = socket;

        this.socket
            // @ts-ignore
            .on("data", data => splitData(data, message => this.onMessage(JSON.parse(message))))
            .on("close", this.close)
            .on("error", error => {
                console.error(error);
                this.close();
            });

        this.send({ type: MessageType.Handshake });

        this.serverManager.startGame();
    }

    public send(message: TcpMessage): void {
        if (!this.isLive()) {
            console.warn("Game is not started. Cannot send message.");
            return;
        }

        this.socket.write(prependLength(JSON.stringify(message)));
    }

    private onMessage(message: TcpMessage) {
        console.log("Received message " + message);
    }

    @boundMethod
    public close() {
        this.serverManager.endGame();
        this.socket.end();
        this.socket = undefined;
    }

    public isLive(): boolean {
        return this.socket !== undefined;
    }
}
