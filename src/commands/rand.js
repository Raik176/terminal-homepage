export const meta = {
    description: "generate a random number within a specified range",
    arguments: [
        {
            name: "min",
            optional: true,
            default: "1",
            description: "the minimum value (inclusive)",
            type: "integer",
        },
        {
            name: "max",
            optional: true,
            default: "100",
            description: "the maximum value (inclusive)",
            type: "integer",
        },
        {
            name: "float",
            shorthand: "f",
            optional: true,
            default: "false",
            description: "whether to generate a floating-point number instead of an integer",
            type: "boolean",
        },
    ],
};

export const handler = (terminal, args) => {
    const min = args.min;
    const max = args.max;
    const isFloat = args.float;

    if (min > max) {
        throw new Error("The minimum value must be less than or equal to the maximum value.")
    }

    if (isFloat) {
        const randomFloat = Math.random() * (max - min) + min;
        terminal.println(randomFloat.toFixed(4));
    } else {
        const randomInt = Math.floor(Math.random() * (max - min + 1)) + min;
        terminal.println(randomInt.toString());
    }
};