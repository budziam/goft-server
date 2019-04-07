import { ConnectionHandler, MessageType } from "../../src/Server/ConnectionHandler";
import { splitData } from "../../src/Server/utils";

it.skip("Send special chars", () => {
    // given
    const text = '🤑s';
    const connectionHandler = new ConnectionHandler();
    // @ts-ignore
    connectionHandler.socket = {
        // @ts-ignore
        write(a) {
            splitData(a, b => console.log(b));
        }
    };

    // when
    connectionHandler.send({
        type: MessageType.SendMessage,
        data: {text}
    });

    // then

});
