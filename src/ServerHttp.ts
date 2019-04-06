import { boundClass } from "autobind-decorator";
import * as bodyParser from "body-parser";
import * as express from "express";
import { Express, Request, Response } from "express";
import { NextFunction } from "express-serve-static-core";
import * as http from "http";
import { Server } from "http";
import { Container, injectable } from "inversify";
import { ErrorHandler } from "./ErrorHandler";
import { EndpointNotFoundError } from "./Errors";
import { WebhookCollection } from "./Controllers/WebhookCollection";

@injectable()
@boundClass
export class ServerHttp {
    private _app: Express;
    private server: Server;

    public constructor(
        private readonly container: Container,
        private readonly errorHandler: ErrorHandler,
        private readonly port: number = 80,
    ) {
        //
    }

    public get app(): Express {
        if (!this._app) {
            this._app = this.prepareApp();
        }

        return this._app;
    }

    public start(): void {
        this.server = this.startServer();
    }

    private prepareApp(): Express {
        const webhookCollection: WebhookCollection = this.container.get<WebhookCollection>(
            WebhookCollection,
        );

        const app = express();
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));

        app.get(
            "/webhook",
            async (req: Request, res: Response, next: NextFunction): Promise<void> => {
                try {
                    await webhookCollection.get(req, res);
                } catch (e) {
                    next(e);
                }
            },
        );

        app.post(
            "/webhook",
            async (req: Request, res: Response, next: NextFunction): Promise<void> => {
                try {
                    await webhookCollection.post(req, res);
                } catch (e) {
                    next(e);
                }
            },
        );

        app.use((req, res, next) => next(new EndpointNotFoundError()));
        app.use(this.handleError);

        return app;
    }

    private handleError(e: object, req: Request, res: Response, next: NextFunction): void {
        this.errorHandler.handleHttpError(e, req, res);
        next();
    }

    private startServer(): Server {
        const server = http.createServer(this.app).listen(this.port);

        server.on("listening", () => {
            const address = server.address();
            // @ts-ignore
            console.debug(`Listening on ${address.address}:${address.port}`);
        });

        server.on("error", this.errorHandler.handle);

        return server;
    }
}
