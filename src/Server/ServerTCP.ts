import { injectable } from "inversify";
import { Server, Socket } from "net";
import * as net from "net";
import { ConnectionHandler } from "./ConnectionHandler";

@injectable()
export class ServerTCP {
    private server: Server;

    constructor(
        private readonly address = '0.0.0.0',
        private readonly port = 3000,
    ) {
        //
    }

    public start(): void {
        const server = net.createServer();

        server.on('connection', (socket: Socket) => new ConnectionHandler(socket).start());
        server.on('error', console.error);
        server.on('listening', () => {
            const address = server.address();
            // @ts-ignore
            console.log(`Server TCP listening on ${address.address}:${address.port}`);
        });

        server.listen(this.port, this.address);

        this.server = server;
    }
}
