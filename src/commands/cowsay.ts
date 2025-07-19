import { Terminal } from "../components/Terminal";
import { DeriveArgs } from "./index";

export const meta = {
	description: "An ASCII cow says whatever you want.",
	arguments: [
		{
			name: "message",
			optional: false,
			type: "string",
			description: "The message for the cow to say.",
		},
	],
} as const;

export const handler = (
	terminal: Terminal,
	args: DeriveArgs<typeof meta.arguments>
) => {
	const message = args.message;
	const bubble = [
		` ${"_".repeat(message.length + 2)} `,
		`< ${message} >`,
		` ${"-".repeat(message.length + 2)} `,
	].join("\n");

	const cow = `
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||
        `;

	terminal.println(bubble + cow);
};
