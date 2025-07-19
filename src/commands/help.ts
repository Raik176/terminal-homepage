import { Terminal } from "../components/Terminal";
import {Commands, DeriveArgs} from "./index";

export const meta = {
	description: "shows the help menu",
	arguments: [],
};

export const handler = (
	terminal: Terminal,
	args: DeriveArgs<typeof meta.arguments>,
	signal: AbortSignal,
	allCommands: Commands
) => {
	try {
		const lscmdsDesc = allCommands.lscmds.description;
		const manDesc = allCommands.man.description;

		terminal.println(` Welcome to the help menu!
 Here are some commands to try:

    [[cmd:lscmds]] ${lscmdsDesc}
    [[cmd:man]]    ${manDesc}`);
	} catch {
		terminal.error(new Error("Could not load help information."));
	}
};
