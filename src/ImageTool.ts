import { injectable } from "inversify";
import { AxiosInstance } from "axios";
import * as sharp from "sharp";

@injectable()
export class ImageTool {
    constructor(private readonly axios: AxiosInstance) {
        //
    }

    public async avatar(url: string): Promise<string> {
        const picResponse = await this.axios.get(url, { responseType: "stream" });

        const roundedCorners = Buffer.from(
            '<svg><rect x="0" y="0" width="32" height="32" rx="50" ry="50"/></svg>',
        );

        const roundedCornerResizer = sharp()
            .resize(32, 32)
            .composite([
                {
                    input: roundedCorners,
                    blend: "dest-in",
                },
            ])
            .png();

        const buffer = await picResponse.data.pipe(roundedCornerResizer).toBuffer();

        return buffer.toString("base64");
    }

    public async meme(url: string): Promise<string> {
        const picResponse = await this.axios.get(url, { responseType: "stream" });
        const resizer = sharp().resize(64, 64);
        const buffer = await picResponse.data.pipe(resizer).toBuffer();
        return buffer.toString("base64");
    }
}
