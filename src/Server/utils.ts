export const splitData = (data: Buffer, callback: (msg: string) => void) => {
    let startIndex = 0;

    while (startIndex < data.length) {
        let length = 0;
        for (let i = 0; i < 4; ++i) {
            length += data[startIndex + i] * Math.pow(256, i);
        }

        let sliced = data.slice(startIndex + 4, startIndex + 4 + length);
        callback(sliced.toString("utf8"));

        startIndex += 4 + length;
    }
};

export const prependLength = (message: string): Buffer => {
    const length = message.length;

    const lengthArray = new Uint8Array([
        (length & 0x000000ff),
        (length & 0x0000ff00) >> 8,
        (length & 0x00ff0000) >> 16,
        (length & 0xff000000) >> 24
    ]);

    const messageBuffer = Buffer.from(message, 'utf8');

    const output = new Uint8Array(lengthArray.byteLength + messageBuffer.byteLength);
    output.set(lengthArray, 0);
    output.set(messageBuffer, 4);

    return Buffer.from(output);
};
