import { Terminal } from "../components/Terminal";
import type { DeriveArgs } from "./index";

export const meta = {
	description: "encode or decode a string in base64",
	arguments: [
		{
			name: "action",
			optional: false,
			description: "the action to perform ('encode' or 'decode')",
			type: {
				validate: (value: string): value is "encode" | "decode" => {
					return value === "encode" || value === "decode";
				},
				parse: (val: string) => val as "encode" | "decode",
				suggestions: (currentInput: string) => {
					return ["encode", "decode"].filter((val) =>
						val.startsWith(currentInput)
					);
				},
			},
		},
		{
			name: "string",
			optional: false,
			description: "the string to process",
			type: "string",
		},
	],
} as const;

export const handler = (
	terminal: Terminal,
	args: DeriveArgs<typeof meta.arguments>
) => {
	try {
		if (args.action === "encode") {
			terminal.println(btoa(args.string));
		} else {
			terminal.println(atob(args.string));
		}
	} catch {
		terminal.error(new Error("Invalid string for the chosen action."));
	}
};
