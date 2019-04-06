import { injectable } from "inversify";
import { Socket } from "net";
import { prependLength, splitData } from "./utils";

interface TcpMessage {
    //
}

@injectable()
export class ConnectionHandler {
    constructor(
        private readonly socket: Socket,
    ) {
        socket.setNoDelay(true);
    }

    start() {
        this.socket
            // @ts-ignore
            .on('data', data => splitData(data, message => this.onMessage(JSON.parse(message))))
            .on('close', () => {
                // TODO Disconnect
            })
            .on('error', error => {
                // TODO Disconnect
                console.error(error);
                this.close();
            });
    }

    onMessage(message: TcpMessage) {
        console.log("Found message " + message);
    }

    send(message: TcpMessage) {
        this.socket.write(prependLength(JSON.stringify(message)));
    }

    close() {
        this.socket.end();
    }
}

module.exports = exports = ConnectionHandler;
