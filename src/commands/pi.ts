import { wrapText } from "../utils";
import { Terminal } from "../components/Terminal";
import type { DeriveArgs } from "./index";

type BSResult = {
	P: bigint;
	Q: bigint;
	T: bigint;
};

export const meta = {
	description: "calculate π to the n-th digit using the Chudnovsky algorithm",
	arguments: [
		{
			name: "digits",
			shorthand: "d",
			optional: true,
			default: "100",
			description: "Number of digits",
			type: "integer",
		},
		{
			name: "wrap",
			shorthand: "w",
			optional: true,
			default: "true",
			description: "Whether to split the output into lines",
			type: "boolean",
		},
	],
} as const;

const bigSqrt = (n: bigint): bigint => {
	if (n < 0n) throw new Error("Negative number");
	if (n < 2n) return n;

	let x0 = n;
	let x1 = (x0 + n / x0) >> 1n;

	while (x1 < x0) {
		x0 = x1;
		x1 = (x0 + n / x0) >> 1n;
	}
	return x0;
};

const computeBS = (a: bigint, b: bigint): BSResult => {
	if (b - a === 1n) {
		const Pab = -(6n * a - 5n) * (2n * a - 1n) * (6n * a - 1n);
		const Qab = 10939058860032000n * a * a * a;

		return a === 0n
			? { P: 1n, Q: 1n, T: 13591409n }
			: { P: Pab, Q: Qab, T: Pab * (545140134n * a + 13591409n) };
	}

	const m = (a + b) >> 1n;
	const left = computeBS(a, m);
	const right = computeBS(m, b);

	return {
		P: left.P * right.P,
		Q: left.Q * right.Q,
		T: left.T * right.Q + left.P * right.T,
	};
};

export const handler = (
	terminal: Terminal,
	args: DeriveArgs<typeof meta.arguments>
) => {
	const digits = BigInt(args.digits);

	const EXTRA_PRECISION = 10n;
	const precision = digits + EXTRA_PRECISION;

	const { Q, T } = computeBS(0n, precision / 14n + 1n);

	const result = (
		(426880n * bigSqrt(10005n * (10n ** precision) ** 2n) * Q) /
		(T * 10n ** EXTRA_PRECISION)
	).toString();

	let res = `${result.slice(0, 1)}.${result.slice(1, Number(digits) + 1)}`;

	if (args.wrap) {
		res = wrapText(res, 75);
	}

	terminal.println(res);
};
