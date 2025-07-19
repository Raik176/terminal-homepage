import { ANSI_COLORS } from "../utils";
import type { DeriveArgs } from "./index";
import { Terminal } from "../components/Terminal";

export const meta = {
	description: "prints a textual calendar",
	arguments: [
		{
			name: "month",
			shorthand: "m",
			optional: true,
			description: "The month to display (1-12)",
			type: "integer",
		},
		{
			name: "year",
			shorthand: "y",
			optional: true,
			description: "The year to display",
			type: "integer",
		},
	],
} as const;

export const handler = (
	terminal: Terminal,
	args: DeriveArgs<typeof meta.arguments>
) => {
	const now = new Date();
	const year = args.year || now.getFullYear();
	const month = args.month ? args.month - 1 : now.getMonth();

	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);
	const daysInMonth = lastDay.getDate();
	const firstDayOfWeek = firstDay.getDay();

	const monthNames = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];
	const monthName = monthNames[month];

	let calendar = `      ${ANSI_COLORS.YELLOW}${monthName} ${year}      \n`;
	calendar += "Mo Tu We Th Fr Sa Su\n";

	let day = 1;
	const today = new Date().getDate();
	for (let i = 0; i < 6; i++) {
		for (let j = 0; j < 7; j++) {
			if (
				i === 0 &&
				j < (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1)
			) {
				calendar += "   ";
			} else if (day <= daysInMonth) {
				if (
					day === today &&
					now.getMonth() === month &&
					now.getFullYear() === year
				) {
					calendar += `${ANSI_COLORS.FG_BLACK_BG_WHITE}${day < 10 ? " " : ""}${day} ${ANSI_COLORS.RESET}`;
				} else {
					calendar += (day < 10 ? " " : "") + day + " ";
				}
				day++;
			} else {
				calendar += "   ";
			}
		}
		calendar += "\n";
		if (day > daysInMonth) {
			break;
		}
	}

	terminal.println(calendar);
};
