import { ANSI_COLORS } from "../utils";
import { Terminal } from "../components/Terminal";
import { DeriveArgs } from "./index";

export const meta = {
	description: "prints the Fibonacci sequence",
	arguments: [
		{
			name: "number",
			shorthand: "n",
			optional: true,
			default: "10",
			description: "number of elements to print",
			type: "integer",
		},
		{
			name: "phi",
			shorthand: "p",
			optional: true,
			default: "false",
			description:
				"calculate the golden ratio using the last two elements",
			type: "boolean",
		},
	],
} as const;

export const handler = (
	terminal: Terminal,
	args: DeriveArgs<typeof meta.arguments>
) => {
	const n = args.number;
	const calculatePhi = args.phi;

	if (n <= 0) {
		throw new Error(
			"The number of elements to print must be greater than 0."
		);
	}

	const fibSequence = [0, 1];
	for (let i = 2; i < n; i++) {
		fibSequence.push(fibSequence[i - 1] + fibSequence[i - 2]);
	}

	let output = fibSequence.slice(0, n).join("\n");

	if (calculatePhi && n >= 2) {
		const last = fibSequence[n - 1];
		const secondLast = fibSequence[n - 2];
		const phi = last / secondLast;
		output += `\n${ANSI_COLORS.YELLOW}Golden Ratio (φ): ${phi}`;
	}

	terminal.println(output);
};
