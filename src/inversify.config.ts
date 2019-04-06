import "reflect-metadata";
import { Container } from "inversify";

export const createContainer = (): Container => {
    const container = new Container({ autoBindInjectable: true });
    container.bind(Container).toConstantValue(container);
    return container;
};
