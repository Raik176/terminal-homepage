import { delay } from "../utils.js";

export const meta = {
    description: "tells a random joke using JokeAPI",
};

export const handler = async (terminal, args, signal) => {
    const joke = await fetch("https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,racist,sexist,explicit", { signal });
    const res = await joke.json();

    if (res.error) {
        throw new Error("Could not fetch a joke.");
    }

    if (res.type === "twopart") {
        terminal.println(res.setup);
        terminal.println("...");
        await delay(1000, signal);
        terminal.println(res["delivery"]);
    } else if (res.type === "single") {
        terminal.println(res.joke);
    } else {
        throw new Error("Unknown error during joke handling.");
    }
};