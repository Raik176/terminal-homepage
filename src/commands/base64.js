export const meta = {
    description: "encode or decode a string in base64",
    arguments: [
        {
            name: "action",
            optional: false,
            description: "the action to perform ('encode' or 'decode')",
            type: {
                typeName: "action",
                validate: (value) => value === "encode" || value === "decode",
                parse: (val) => val,
                suggestions: (currentInput) => ["encode", "decode"].filter(val => val.startsWith(currentInput))
            },
        },
        {
            name: "string",
            optional: false,
            description: "the string to process",
            type: "string"
        }
    ]
};

export const handler = (terminal, args) => {
    try {
        if (args.action === "encode") {
            terminal.println(btoa(args.string));
        } else {
            terminal.println(atob(args.string));
        }
    } catch (e) {
        terminal.error(new Error("Invalid string for the chosen action."));
    }
};