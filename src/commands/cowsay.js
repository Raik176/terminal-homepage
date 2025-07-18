export const meta = {
    description: "An ASCII cow says whatever you want.",
    arguments: [{
        name: "message",
        optional: false,
        type: "string",
        description: "The message for the cow to say."
    }],
};

export const handler = (terminal, args) => {
    const message = args.message;
    const bubble = [
        ` ${'_'.repeat(message.length + 2)} `,
        `< ${message} >`,
        ` ${'-'.repeat(message.length + 2)} `
    ].join('\n');

    const cow = `
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||
        `;

    terminal.println(bubble + cow);
};