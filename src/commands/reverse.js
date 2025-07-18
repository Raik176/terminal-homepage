export const meta = {
    description: "reverse a message",
    arguments: [
        {
            name: "text",
            shorthand: "t",
            optional: false,
            description: "the message to reverse",
            type: "string"
        }
    ],
};

export const handler = (terminal, args) => {
    terminal.println(args.text.split('').reverse().join(''));
};