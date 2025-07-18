export const meta = {
    description: "open a link in another tab",
    arguments: [
        {
            name: "url",
            shorthand: "u",
            optional: false,
            description: "url to open",
            type: "string"
        }
    ],
};

export const handler = (terminal, args) => {
    window.open(args.url, '_blank');
};