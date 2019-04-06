import { injectable } from "inversify";
import { Api } from "../Api";
import { Psid } from "./types";

interface WebhookEvent {
    message: EventMessage;
    postback: any;
    referral: any;
    pass_thread_control: any;
    sender: {
        id: Psid;
    };
}

interface EventMessage {
    text: string;
}

@injectable()
export class WebookHandler {
    constructor(
        private readonly api: Api,
    ) {
        //
    }

    public async handle(event: WebhookEvent): Promise<void> {
        console.log("Handle webhook event", event);

        try {
            const psid = event.sender.id;

            if (event.message) {
                return this.handleMessage(psid, event.message);
            }

            if (event.postback) {
                return this.handlePostback(psid, event.postback);
            }

            if (event.referral) {
                return this.handleReferral(psid, event.referral);
            }

            if (event.pass_thread_control) {
                return this.handlePassThreadControl(psid, event.pass_thread_control);
            }

            console.error("Unknown message", event);
        } catch (e) {
            console.error(e);
        }
    }

    private async handleMessage(psid: Psid, message: EventMessage) {
        if (message.text === "elo") {
            return this.api.sendMessage(psid, {text: "No siemka ziomek"});
        }

        return this.api.sendMessage(psid, {text: "Nie wiem o co Ci chodzi"});
    }

    private handlePostback(psid: string, postback: any) {
        console.error("Not implemented yet");
    }

    private handleReferral(psid: string, referral: any) {
        console.error("Not implemented yet");
    }

    private handlePassThreadControl(psid: string, pass_thread_control: any) {
        console.error("Not implemented yet");
    }
}
