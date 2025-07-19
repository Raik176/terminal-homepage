import {Terminal} from "../components/Terminal";
import {DeriveArgs} from "./index";

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

export const handler = (terminal: Terminal, args: DeriveArgs<typeof meta.arguments>) => {
    window.open(args.url, '_blank');
};