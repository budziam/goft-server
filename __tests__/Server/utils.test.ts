import { prependLength, splitData } from "../../src/Server/utils";

it("prepending lenght", () => {
    const data1 = {
        abc: "yup yup yup",
    };
    const data2 = {
        a: {
            b: {
                c: [1, 0, "sds"]
            }
        },
    };

    const message1 = prependLength(JSON.stringify(data1));
    const message2 = prependLength(JSON.stringify(data2));
    const buffer = Buffer.concat([message1, message2]);

    const chunks: any[] = [];
    splitData(buffer, chunk => chunks.push(JSON.parse(chunk)));

    expect(chunks[0]).toEqual(data1);
    expect(chunks[1]).toEqual(data2);
});
