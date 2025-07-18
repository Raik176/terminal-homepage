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
        }
    ],
};

export const handler = (terminal, args) => {
    terminal.println(args.input);
};