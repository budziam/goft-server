import "reflect-metadata";
import { createContainer } from "./src/inversify.config";
import { ServerHttp } from "./src/ServerHttp";

const container = createContainer();
const server = container.get<ServerHttp>(ServerHttp);

server.start();
