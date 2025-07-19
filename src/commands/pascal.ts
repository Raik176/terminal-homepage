import { Terminal } from "../components/Terminal";
import { DeriveArgs } from "./index";

export const meta = {
	description: "print a pascal triangle",
	arguments: [
		{
			name: "depth",
			shorthand: "d",
			optional: false,
			description: "depth of the triangle",
			type: "integer",
		},
	],
} as const;

export const handler = (
	terminal: Terminal,
	args: DeriveArgs<typeof meta.arguments>
) => {
	const depth = args.depth;

	if (depth <= 0) {
		throw new Error("Depth must be a positive integer.");
	}

	const generatePascalsTriangle = (numRows: number): number[][] => {
		const triangle: number[][] = [];
		for (let i = 0; i < numRows; i++) {
			triangle[i] = [];
			triangle[i][0] = 1;
			for (let j = 1; j < i; j++) {
				triangle[i][j] = triangle[i - 1][j - 1] + triangle[i - 1][j];
			}
			triangle[i][i] = 1;
		}
		return triangle;
	};

	const triangle = generatePascalsTriangle(depth);

	if (triangle.length === 0) {
		return;
	}

	const maxNumber = Math.max(...triangle[triangle.length - 1]);
	const maxNumberLength = maxNumber.toString().length;

	let output = "";
	for (let i = 0; i < triangle.length; i++) {
		output += " ".repeat(
			(triangle.length - i - 1) * Math.floor(maxNumberLength / 2 + 1)
		);
		for (let j = 0; j < triangle[i].length; j++) {
			output += triangle[i][j]
				.toString()
				.padEnd(maxNumberLength + 1, " ");
		}
		output += "\n";
	}

	terminal.println(output);
};
