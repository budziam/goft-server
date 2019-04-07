import { injectable } from "inversify";
import { Socket } from "net";
import { prependLength, splitData } from "./utils";
import { boundMethod } from "autobind-decorator";
import { Client, ClientProfile } from "../Client/Client";

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
    client?: ClientProfile;
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
            .on("data", data => splitData(data, this.handleMessage))
            .on("close", this.close)
            .on("error", error => {
                console.error(error);
                this.close();
            });

        this.send({ type: MessageType.Handshake });

        if (this.onStart !== undefined) {
            this.onStart();
        }

        console.info("New connection from game!");
    }

    public send(message: TcpMessage, client?: Client): void {
        const data: TcpMessage = { ...message };

        if (client) {
            data.client = { ...client.profile };
        }

        if (!this.isLive()) {
            console.warn("Game is not started. Cannot send message.");
            return;
        }

        this.socket.write(prependLength(JSON.stringify(data)));
    }

    @boundMethod
    private handleMessage(message: string): void {
        try {
            const data = JSON.parse(message);
            console.info("Received data", { data });
        } catch (e) {
            console.warn(`Invalid message [${message}]`);
        }
    }

    @boundMethod
    public close() {
        if (this.socket !== undefined) {
            console.info("Close connection with game!");

            this.socket.end();
            this.socket = undefined;

            if (this.onClose !== undefined) {
                this.onClose();
            }
        }
    }

    public isLive(): boolean {
        return this.socket !== undefined;
    }
}
