import { wrapText } from "../utils";
import { Terminal } from "../components/Terminal";
import type { DeriveArgs } from "./index";

export const meta = {
    description: "calculate π to the n-th digit",
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
        }
    ],
} as const;

export const handler = (terminal: Terminal, args: DeriveArgs<typeof meta.arguments>) => {
    let i = 1n;
    let x = 3n * (10n ** (BigInt(args.digits) + 20n));
    let pi = x;

    while (x > 0) {
        x = x * i / ((i + 1n) * 4n);
        pi += x / (i + 2n);
        i += 2n;
    }

    const result = (pi / (10n ** 20n)).toString();
    let res = `${result.slice(0, 1)}.${result.slice(1, args.digits + 1)}`;

    if (args.wrap) {
        res = wrapText(res, 75);
    }

    terminal.println(res);
};