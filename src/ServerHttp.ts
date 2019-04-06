import { injectable } from "inversify";
import bodyParser = require("body-parser");
import express = require("express");
import { Express } from "express";

@injectable()
export class ServerHttp {
    private app: Express;

    constructor(
        private readonly port = 1337,
    ) {
        //
    }

    public start(): void {
        if (this.app !== undefined) {
            console.warn("HTTP server is already listening");
            return;
        }

        const app = express()
            .use(bodyParser.json());

        app.listen(this.port, () => console.info('HTTP server is listening'));

        this.app = app;
    }
}
