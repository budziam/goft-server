import { AxiosInstance } from "axios";
import { injectable } from "inversify";

interface MeMessage {
    text: string;
    quick_replies?: any[];
}

@injectable()
export class Api {
    constructor(private readonly axios: AxiosInstance, private readonly accessToken: string) {
        //
    }

    async sendMessage(psid: string, message: MeMessage): Promise<void> {
        const data = {
            recipient: {
                id: psid,
            },
            message,
        };

        await this.axios.post(
            `https://graph.facebook.com/v2.6/me/messages?access_token=${this.accessToken}`,
            data,
        );
    }
}
