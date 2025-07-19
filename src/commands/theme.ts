import Themes from "../themes";
import { Terminal } from "../components/Terminal";
import type { DeriveArgs } from "./index";

const hexToRgb = (hex: string) => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
			}
		: null;
};

const colorBlock = (hex: string) => {
	if (!hex) return "  ";
	const rgb = hexToRgb(hex);
	if (!rgb) return "  ";
	return `\x1b[48;2;${rgb.r};${rgb.g};${rgb.b}m  \x1b[0m`;
};

export const meta = {
	description: "list available themes or set a new theme",
	arguments: [
		{
			name: "name",
			optional: true,
			description: "the name of the theme to apply",
			type: "theme",
		},
	],
} as const;

export const handler = (
	terminal: Terminal,
	args: DeriveArgs<typeof meta.arguments>
) => {
	const themeNames = Object.keys(Themes);

	if (args.name) {
		if (themeNames.includes(args.name)) {
			const event = new CustomEvent("set-theme", { detail: args.name });
			window.dispatchEvent(event);
			terminal.println(`Theme set to '${args.name}'.`);
		} else {
			terminal.error(new Error(`Theme '${args.name}' not found.`));
		}
		return;
	}

	terminal.println("Available themes:");
	const colorNames = [
		"black",
		"red",
		"green",
		"yellow",
		"blue",
		"magenta",
		"cyan",
		"white",
	];

	for (const themeName of themeNames) {
		const theme = Themes[themeName];
		const normalColors = colorNames
			.map((c) => colorBlock(theme[`--${c}`]))
			.join("");
		const brightColors = colorNames
			.map((c) => colorBlock(theme[`--bright-${c}`]))
			.join("");

		terminal.println(`${themeName.padEnd(8)} ${normalColors}  ${brightColors}`);
	}

	terminal.println(`\nCurrent theme: ${terminal.getTheme()}`);
	terminal.println("Use 'theme <name>' to set a new theme.");
};
