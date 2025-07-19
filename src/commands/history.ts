import { Terminal } from "../components/Terminal";

export const meta = {
	description: "print command history",
} as const;

export const handler = (terminal: Terminal) => {
	for (let i = 0; i < terminal.commandHistory.length; i++) {
		terminal.println(` ${i}  ${terminal.commandHistory[i]}`);
	}
};
