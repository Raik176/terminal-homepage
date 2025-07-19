import { delay } from "../utils";
import { Terminal } from "../components/Terminal";
import { DeriveArgs } from "./index";

interface BaseJokeResponse {
	error: boolean;
}

interface SingleJoke extends BaseJokeResponse {
	type: "single";
	joke: string;
}

interface TwoPartJoke extends BaseJokeResponse {
	type: "twopart";
	setup: string;
	delivery: string;
}

type JokeApiResponse = SingleJoke | TwoPartJoke;

export const meta = {
	description: "tells a random joke using JokeAPI",
	arguments: [],
} as const;

export const handler = async (
	terminal: Terminal,
	args: DeriveArgs<typeof meta.arguments>,
	signal: AbortSignal
) => {
	const joke = await fetch(
		"https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,racist,sexist,explicit",
		{ signal }
	);

	const res: JokeApiResponse = await joke.json();

	if (res.error) {
		throw new Error("Could not fetch a joke.");
	}

	if (res.type === "twopart") {
		terminal.println(res.setup);
		terminal.println("...");
		await delay(1000, signal);
		terminal.println(res.delivery);
	} else if (res.type === "single") {
		terminal.println(res.joke);
	} else {
		throw new Error(`Unknown joke type received: ${(res as any).type}`);
	}
};
