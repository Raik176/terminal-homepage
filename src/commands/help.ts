import {Terminal} from "../components/Terminal";
import {DeriveArgs} from "./index";

export const meta = {
    description: "shows the help menu",
    arguments: [

    ]
};

export const handler = (terminal: Terminal, args: DeriveArgs<typeof meta.arguments>, signal: AbortSignal, allCommands: { [key: string]: any }) => {
    try {
        const lscmdsDesc = allCommands.lscmds.description;
        const manDesc = allCommands.man.description;

        terminal.println(` Welcome to the help menu!
 Here are some commands to try:

    [[cmd:lscmds]] ${lscmdsDesc}
    [[cmd:man]]    ${manDesc}`);

    } catch (e) {
        terminal.error(new Error("Could not load help information."));
    }
};