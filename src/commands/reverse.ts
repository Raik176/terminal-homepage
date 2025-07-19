import { Terminal } from "../components/Terminal";
import { DeriveArgs } from "./index";

export const meta = {
	description: "reverse a message",
	arguments: [
		{
			name: "text",
			shorthand: "t",
			optional: false,
			description: "the message to reverse",
			type: "string",
		},
	],
} as const;

export const handler = (
	terminal: Terminal,
	args: DeriveArgs<typeof meta.arguments>
) => {
	terminal.println(args.text.split("").reverse().join(""));
};
