import "reflect-metadata";
import { Container } from "inversify";
import { ServerHttp } from "./ServerHttp";
import { ErrorHandler } from "./ErrorHandler";
import { WebhookCollection } from "./Controllers/WebhookCollection";

export const createContainer = (): Container => {
    const container = new Container({ autoBindInjectable: true });

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
        .bind(WebhookCollection)
        .toDynamicValue(() => new WebhookCollection("uper-secret"))
        .inSingletonScope();

    return container;
};
