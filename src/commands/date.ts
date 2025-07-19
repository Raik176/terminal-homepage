import { Terminal } from "../components/Terminal";

export const meta = {
	description: "print system date and time",
} as const;

export const handler = (terminal: Terminal) => {
	terminal.println(
		new Date()
			.toLocaleString("en-US", {
				weekday: "short",
				year: "numeric",
				month: "short",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
				hour12: true,
				timeZoneName: "short",
			})
			.replaceAll(",", "")
	);
};
