import axios from "axios";
import { Api } from "../src/Api";
import { prependLength, splitData } from "../src/Server/utils";

it("transform image", async () => {
    // given
    const api = new Api(axios, "");

    // when
    const profile = await api.getProfile("");

    splitData(prependLength(JSON.stringify(profile)), text => console.log(JSON.parse(text)));

    // then
    console.log(profile);
});
