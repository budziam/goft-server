import { injectable } from "inversify";
import { Socket } from "net";
import { prependLength, splitData } from "./utils";
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
    public onStart?: Function;
    public onClose?: Function;

    public start(socket: Socket): void {
        if (this.isLive()) {
            this.close();
        }

        socket.setNoDelay(true);
        this.socket = socket;

        this.socket
        // @ts-ignore
            .on("data", data => splitData(data, this.handleMessage))
            .on("close", this.close)
            .on("error", error => {
                console.error(error);
                this.close();
            });

        this.send({type: MessageType.Handshake});

        if (this.onStart) {
            this.onStart();
        }

        console.info("New connection from game!");
    }

    public send(message: TcpMessage): void {
        if (!this.isLive()) {
            console.warn("Game is not started. Cannot send message.");
            return;
        }

        this.socket.write(prependLength(JSON.stringify(message)));
    }

    @boundMethod
    private handleMessage(message: string): void {
        try {
            const data = JSON.parse(message);
            console.info("Received data", {data});
        } catch (e) {
            console.warn(`Invalid message [${message}]`);
        }
    }

    @boundMethod
    public close() {
        console.info("Close connection with game!");

        this.socket.end();
        this.socket = undefined;

        if (this.onClose) {
            this.onClose();
        }
    }

    public isLive(): boolean {
        return this.socket !== undefined;
    }
}
