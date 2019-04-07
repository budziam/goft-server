import axios from "axios";
import { Api } from "../src/Api";

it.skip("transform image", async () => {
    // given
    const api = new Api(axios, "");

    // when
    const profile = await api.getProfile("");

    // then
    console.log(profile);
});
