import { AxiosInstance } from "axios";
import { injectable } from "inversify";
import { Psid } from "./Message/types";
import { ClientProfile } from "./Client/Client";
import { ImageTool } from "./ImageTool";

export interface MeMessage {
    text: string;
    quick_replies?: QuickReply[];
}

interface QuickReply {
    content_type: string;
    title: string;
    payload: string;
    image_url?: string;
}

@injectable()
export class Api {
    constructor(
        private readonly axios: AxiosInstance,
        private readonly imageTool: ImageTool,
        private readonly accessToken: string,
    ) {
        //
    }

    public async sendMessage(psid: string, message: MeMessage): Promise<void> {
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

    public async getProfile(psid: Psid): Promise<ClientProfile> {
        const fields = ["first_name", "last_name", "profile_pic"];
        const response = await this.axios.get(
            `https://graph.facebook.com/v3.2/${psid}?fields=${fields.join(",")}&access_token=${
                this.accessToken
            }`,
        );

        let avatar = "";
        if (response.data.profile_pic) {
            try {
                avatar = await this.imageTool.avatar(response.data.profile_pic);
            } catch (e) {
                console.error(e);
            }
        }

        return {
            firstName: response.data.first_name,
            lastName: response.data.last_name,
            avatar,
        };
    }
}
