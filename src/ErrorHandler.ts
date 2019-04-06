import { ValidationError } from "ajv";
import { boundClass } from "autobind-decorator";
import { Request, Response } from "express";
import { injectable } from "inversify";
import { EndpointNotFoundError } from "./Errors";

@boundClass
@injectable()
export class ErrorHandler {
    public handle(error: any): void {
        console.error(error);
    }

    public handleHttpError(e: any, req: Request, res: Response): Response | undefined {
        if (e instanceof EndpointNotFoundError) {
            return res.sendStatus(404);
        }

        if (e instanceof ValidationError) {
            res.status(422);

            return res.json({
                message: e.message,
                errors: e.errors,
            });
        }

        console.error(e);

        return res.sendStatus(500);
    }
}
