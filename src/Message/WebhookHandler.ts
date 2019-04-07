import { injectable } from "inversify";
import { Psid } from "./types";
import { EventMessage, MessageHandler } from "./MessageHandler";

interface WebhookEvent {
    message: EventMessage;
    postback: any;
    referral: any;
    pass_thread_control: any;
    sender: {
        id: Psid;
    };
}

@injectable()
export class WebhookHandler {
    constructor(private readonly messageHandler: MessageHandler) {
        //
    }

    public async handle(event: WebhookEvent): Promise<void> {
        console.log("Handle webhook event", {
            psid: event.sender.id,
            text: event.message.text,
            quick_reply: event.message.quick_reply,
        });

        try {
            const psid = event.sender.id;

            if (event.message) {
                return this.messageHandler.handle(psid, event.message);
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

    private handlePostback(psid: string, postback: any) {
        console.warn("Postback is not implemented yet");
    }

    private handleReferral(psid: string, referral: any) {
        console.warn("Referral is not implemented yet");
    }

    private handlePassThreadControl(psid: string, pass_thread_control: any) {
        console.warn("Pass thread control is not implemented yet");
    }
}
