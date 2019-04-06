export const splitData = (data: string, callback: (msg: string) => void) => {
    let startIndex = 0;

    while (startIndex < data.length) {
        let length = 0;
        for (let i = 0; i < 4; ++i) {
            length += parseInt(data[startIndex + i]) * Math.pow(256, i);
        }

        let sliced = data.slice(startIndex + 4, startIndex + 4 + length);
        callback(sliced);

        startIndex += 4 + length;
    }
};

export const prependLength = (message: string): string => {
    const length = message.length;

    const lengthArray = [
        (length & 0x000000ff),
        (length & 0x0000ff00) >> 8,
        (length & 0x00ff0000) >> 16,
        (length & 0xff000000) >> 24
    ];

    return `${lengthArray.join("")}${message}`;
};
