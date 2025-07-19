import { Terminal } from "../components/Terminal";
import { DeriveArgs } from "./index";

export const meta = {
	description:
		"get the day of the week for a specific date (format: DD.MM.YYYY)",
	arguments: [
		{
			name: "date",
			shorthand: "d",
			optional: false,
			description: "the date in DD.MM.YYYY format",
			type: "string",
		},
	],
} as const;

export const handler = (
	terminal: Terminal,
	args: DeriveArgs<typeof meta.arguments>
) => {
	const [day, month, year] = args.date.split(".").map(Number);
	const date = new Date(year, month - 1, day);

	if (
		isNaN(date.getTime()) ||
		date.getDate() !== day ||
		date.getMonth() + 1 !== month ||
		date.getFullYear() !== year
	) {
		throw new Error("Invalid date format. Please use DD.MM.YYYY.");
	}

	const days = [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	];
	const dayOfWeek = days[date.getDay()];
	const monthName = date.toLocaleString("default", { month: "long" });
	const daySuffix = (d: number) => {
		if (d > 3 && d < 21) return "th";
		switch (d % 10) {
			case 1:
				return "st";
			case 2:
				return "nd";
			case 3:
				return "rd";
			default:
				return "th";
		}
	};
	const isPast =
		new Date(date.toDateString()) < new Date(new Date().toDateString());
	const output = `The ${day}${daySuffix(day)} of ${monthName} of the year ${date.getFullYear()} ${isPast ? "was" : "will be"} a ${dayOfWeek}.`;

	terminal.println(output);
};
