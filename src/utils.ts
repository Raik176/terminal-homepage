export class ArgumentError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ArgumentError";
	}
}

export class InterruptError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InterruptError";
	}
}

interface TimeUnit {
	name: "year" | "month" | "day" | "hour" | "minute";
	seconds: number;
}

export function formatDateWithRelativeTime(
	dateInput: Date | string | number | null | undefined
): string {
	if (!dateInput) return "N/A";

	const date = new Date(dateInput);
	if (isNaN(date.getTime())) {
		return String(dateInput);
	}

	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const year = date.getFullYear();
	const formattedDate = `${day}/${month}/${year}`;

	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const seconds = Math.round(Math.abs(diff) / 1000);

	if (date.toDateString() === now.toDateString()) {
		return `${formattedDate} (today)`;
	}

	const timeUnits: readonly TimeUnit[] = [
		{ name: "year", seconds: 31536000 },
		{ name: "month", seconds: 2592000 },
		{ name: "day", seconds: 86400 },
		{ name: "hour", seconds: 3600 },
		{ name: "minute", seconds: 60 },
	];

	let relativeTime = "just now";

	for (const unit of timeUnits) {
		const count = Math.floor(seconds / unit.seconds);
		if (count >= 1) {
			const plural = count > 1 ? "s" : "";
			const suffix = diff > 0 ? "ago" : "from now";
			relativeTime = `${count} ${unit.name}${plural} ${suffix}`;
			break;
		}
	}

	return `${formattedDate} (${relativeTime})`;
}

export function delay(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal?.aborted) {
			return reject(new DOMException("Aborted", "AbortError"));
		}
		const timeout = setTimeout(resolve, ms);
		signal?.addEventListener("abort", () => {
			clearTimeout(timeout);
			reject(new DOMException("Aborted", "AbortError"));
		});
	});
}

export function getDate(): string {
	const options: Intl.DateTimeFormatOptions = {
		weekday: "short",
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		timeZoneName: "short",
		hour12: false,
	};

	const formattedDate = new Intl.DateTimeFormat("en-US", options).format(
		new Date()
	);

	return formattedDate.replace(/(\w+)\s+(\d+)/, "$1\u00A0$2");
}

export function wrapText(text: string, wrapLength: number): string {
	if (wrapLength <= 0) {
		return text;
	}
	let wrappedText = "";
	for (let i = 0; i < text.length; i += wrapLength) {
		wrappedText += text.substring(i, i + wrapLength) + "\n";
	}
	return wrappedText.trim();
}

export const ANSI_COLORS = {
	RESET: "\x1b[0m",
	BLACK: "\x1b[30m",
	RED: "\x1b[31m",
	GREEN: "\x1b[32m",
	YELLOW: "\x1b[33m",
	BLUE: "\x1b[34m",
	MAGENTA: "\x1b[35m",
	CYAN: "\x1b[36m",
	WHITE: "\x1b[37m",
	BRIGHT_BLACK: "\x1b[90m",
	BRIGHT_RED: "\x1b[91m",
	BRIGHT_GREEN: "\x1b[92m",
	BRIGHT_YELLOW: "\x1b[93m",
	BRIGHT_BLUE: "\x1b[94m",
	BRIGHT_MAGENTA: "\x1b[95m",
	BRIGHT_CYAN: "\x1b[96m",
	BRIGHT_WHITE: "\x1b[97m",
	BG_BLACK: "\x1b[40m",
	BG_RED: "\x1b[41m",
	BG_GREEN: "\x1b[42m",
	BG_YELLOW: "\x1b[43m",
	BG_BLUE: "\x1b[44m",
	BG_MAGENTA: "\x1b[45m",
	BG_CYAN: "\x1b[46m",
	BG_WHITE: "\x1b[47m",
	BG_BRIGHT_BLACK: "\x1b[100m",
	BG_BRIGHT_RED: "\x1b[101m",
	BG_BRIGHT_GREEN: "\x1b[102m",
	BG_BRIGHT_YELLOW: "\x1b[103m",
	BG_BRIGHT_BLUE: "\x1b[104m",
	BG_BRIGHT_MAGENTA: "\x1b[105m",
	BG_BRIGHT_CYAN: "\x1b[106m",
	BG_BRIGHT_WHITE: "\x1b[107m",
	FG_BLACK_BG_WHITE: "\x1b[30;47m",
} as const;

export interface Contact {
	service: string;
	username: string | (() => Promise<string>);
	icon: string;
	color: string;
	url?: string;
}

export const DISCORD_ID = "1186409886129594428";
export const MODRINTH_USER = "rhm176.";
export const GITHUB_USER = "Raik176";

export const SOCIALS: Contact[] = [
	{
		service: "Discord",
		username: async () => {
			const response = await fetch(
				`https://api.lanyard.rest/v1/users/${DISCORD_ID}`
			);
			if (!response.ok) {
				console.error(
					"Failed to fetch username:",
					new Error(`HTTP error! status: ${response.status}`)
				);
				return "N/A";
			}
			const data = await response.json();
			return data?.data?.discord_user?.username || "N/A";
		},
		url: `https://discord.com/users/${DISCORD_ID}`,
		icon: "/assets/icons/socials/discord.svg",
		color: "var(--bright-blue)",
	},
	{
		service: "Discord Server",
		username: "RHM's Lab",
		url: "https://discord.gg/FpEReTJbSA",
		icon: "/assets/icons/socials/discord.svg",
		color: "var(--bright-blue)",
	},
	{
		service: "Steam",
		username: "raik176",
		url: "https://steamcommunity.com/profiles/76561198807024982/",
		icon: "/assets/icons/socials/steam.svg",
		color: "#66c0f4",
	},
	{
		service: "GitHub",
		username: GITHUB_USER,
		url: `https://github.com/${GITHUB_USER}`,
		icon: "/assets/icons/socials/github.svg",
		color: "var(--bright-white)",
	},
	{
		service: "Email",
		username: "righthandman176@proton.me",
		url: "mailto:righthandman176@proton.me",
		icon: "/assets/icons/socials/email.svg",
		color: "var(--bright-red)",
	},
	{
		service: "Modrinth",
		username: MODRINTH_USER,
		url: `https://modrinth.com/user/${MODRINTH_USER}`,
		icon: "/assets/icons/socials/modrinth.svg",
		color: "var(--green)",
	},
	{
		service: "Curseforge",
		username: "rhm176",
		url: "https://www.curseforge.com/members/rhm176",
		icon: "/assets/icons/socials/curseforge.svg",
		color: "#ffa500",
	},
	{
		service: "Bluesky",
		username: "rhm176.de",
		url: "https://bsky.app/profile/rhm176.de",
		icon: "/assets/icons/socials/bsky.svg",
		color: "var(--blue)",
	},
] as const;
