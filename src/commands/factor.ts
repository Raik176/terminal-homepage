import { ANSI_COLORS } from "../utils";
import { Terminal } from "../components/Terminal";
import { DeriveArgs } from "./index";

export const meta = {
	description: "print prime factors of a number",
	arguments: [
		{
			name: "number",
			shorthand: "n",
			optional: false,
			description: "number to factorize",
			type: "integer",
		},
	],
} as const;

export const handler = (
	terminal: Terminal,
	args: DeriveArgs<typeof meta.arguments>
) => {
	const primeFactors = (n: number) => {
		const factors = [];
		let divisor = 2;
		let num = n;

		while (num >= 2) {
			if (num % divisor === 0) {
				factors.push(divisor);
				num = num / divisor;
			} else {
				divisor++;
			}
		}
		if (n > 1 && factors.length === 0) {
			return [n];
		}
		return [...new Set(factors)].sort((a, b) => a - b);
	};

	const factors = primeFactors(args.number);
	if (factors.length > 0) {
		terminal.println(
			`${args.number}: ${ANSI_COLORS.YELLOW}${factors.join(`${ANSI_COLORS.RESET}, ${ANSI_COLORS.YELLOW}`)}`
		);
	} else {
		terminal.println(`${args.number}:`);
	}
};
