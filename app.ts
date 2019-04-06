import "reflect-metadata";
import { createContainer } from "./src/inversify.config";
import { ServerHttp } from "./src/Server/ServerHttp";
import { ServerTCP } from "./src/Server/ServerTCP";

const container = createContainer();
const server = container.get<ServerHttp>(ServerHttp);
const serverTCP = container.get<ServerTCP>(ServerTCP);

server.start();
serverTCP.start();
