import "reflect-metadata";
import axios from "axios";
// @ts-ignore
import * as env from "node-env-file";
import { Container } from "inversify";
import { ServerHttp } from "./Server/ServerHttp";
import { ErrorHandler } from "./ErrorHandler";
import { WebhookCollection } from "./Controllers/WebhookCollection";
import { Api } from "./Api";
import { WebhookHandler } from "./Message/WebhookHandler";
import { ImageTool } from "./ImageTool";

export const createContainer = (): Container => {
    env(`${__dirname}/../.env`);

    const container = new Container({
        autoBindInjectable: true,
        defaultScope: "Singleton",
    });

    container.bind(Container).toConstantValue(container);

    container
        .bind(ServerHttp)
        .toDynamicValue(
            () =>
                new ServerHttp(
                    container.get<Container>(Container),
                    container.get<ErrorHandler>(ErrorHandler),
                ),
        )
        .inSingletonScope();

    container
        .bind(Api)
        .toDynamicValue(
            () => new Api(axios, container.get<ImageTool>(ImageTool), process.env.FB_ACCESS_TOKEN),
        )
        .inSingletonScope();

    container
        .bind(ImageTool)
        .toDynamicValue(() => new ImageTool(axios))
        .inSingletonScope();

    container
        .bind(WebhookCollection)
        .toDynamicValue(
            () =>
                new WebhookCollection(
                    container.get(Api),
                    container.get(WebhookHandler),
                    process.env.FB_VERIFY_TOKEN,
                ),
        );

    return container;
};
