import { AxiosInstance } from "axios";
import { injectable } from "inversify";
import { Psid } from "./Message/types";
import { ClientProfile } from "./Client/Client";
import * as sharp from "sharp";
import { Stream } from "stream";

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
    constructor(private readonly axios: AxiosInstance, private readonly accessToken: string) {
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
                const picResponse = await this.axios.get(response.data.profile_pic, {
                    responseType: "stream",
                });
                avatar = await this.transformImage(picResponse.data);
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

    private async transformImage(data: Stream): Promise<string> {
        const roundedCorners = Buffer.from(
            '<svg><rect x="0" y="0" width="64" height="64" rx="50" ry="50"/></svg>',
        );

        const roundedCornerResizer = sharp()
            .resize(64, 64)
            .composite([
                {
                    input: roundedCorners,
                    blend: "dest-in",
                },
            ])
            .png();

        const buffer = await data.pipe(roundedCornerResizer).toBuffer();

        return buffer.toString("base64");
    }
}
