import { Terminal } from "../components/Terminal";
import { DeriveArgs } from "./index";

export const meta = {
	description: "echoes your input",
	arguments: [
		{
			name: "input",
			shorthand: "i",
			optional: true,
			default: " ",
			type: "string",
			description: "",
		},
	],
} as const;

export const handler = (
	terminal: Terminal,
	args: DeriveArgs<typeof meta.arguments>
) => {
	terminal.println(args.input);
};
