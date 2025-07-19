import { Terminal } from "../components/Terminal";

export const meta = {
	description: "clears the terminal",
};

export const handler = (terminal: Terminal) => {
	terminal.clear();
};
