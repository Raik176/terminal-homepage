import { createSignal, For, Show, Component, JSX } from "solid-js";
import { Terminal } from "../components/Terminal";

const contacts: Contact[] = [
	{
		service: "Discord",
		username: "rhm176.",
		icon: "/assets/icons/discord.svg",
		color: "var(--bright-blue)",
	},
	{
		service: "Steam",
		username: "raik176",
		url: "https://steamcommunity.com/profiles/76561198807024982/",
		icon: "/assets/icons/steam.svg",
		color: "#66c0f4",
	},
	{
		service: "GitHub",
		username: "Raik176",
		url: "https://github.com/Raik176",
		icon: "/assets/icons/github.svg",
		color: "var(--bright-white)",
	},
	{
		service: "Email",
		username: "righthandman176@proton.me",
		url: "mailto:righthandman176@proton.me",
		icon: "/assets/icons/email.svg",
		color: "var(--bright-red)",
	},
	{
		service: "Modrinth",
		username: "rhm176.",
		url: "https://modrinth.com/user/rhm176.",
		icon: "/assets/icons/modrinth.svg",
		color: "var(--green)",
	},
	{
		service: "Curseforge",
		username: "rhm176",
		url: "https://www.curseforge.com/members/rhm176",
		icon: "/assets/icons/curseforge.svg",
		color: "#ffa500",
	},
	{
		service: "Bluesky",
		username: "rhm176.de",
		url: "https://bsky.app/profile/rhm176.de",
		icon: "/assets/icons/bsky.svg",
		color: "var(--blue)",
	},
];

interface Contact {
	service: string;
	username: string;
	icon: string;
	color: string;
	url?: string;
}

export const meta = {
	description: "displays my contact information",
} as const;

const CopyButton: Component<{ textToCopy: string }> = (props) => {
	const [copyText, setCopyText] = createSignal("Copy");

	const handleCopy: JSX.EventHandler<HTMLButtonElement, MouseEvent> = () => {
		navigator.clipboard.writeText(props.textToCopy).then(() => {
			setCopyText("Copied!");
			setTimeout(() => setCopyText("Copy"), 2000);
		});
	};

	return (
		<button
			onClick={handleCopy}
			class="px-2 py-1 text-xs rounded transition-all duration-200"
			style={{
				"background-color": "var(--selection-bg)",
				color: "var(--text-color)",
			}}
		>
			{copyText()}
		</button>
	);
};

const ContactCard: Component<{ contact: Contact }> = (props) => {
	const CardContent: Component = () => (
		<>
			<div
				class="w-8 h-8 flex-shrink-0 transition-colors duration-200 group-hover:bg-[var(--card-accent-color)]"
				style={{
					"background-color": "var(--text-color)",
					"mask-image": `url(${props.contact.icon})`,
					"mask-size": "contain",
					"mask-repeat": "no-repeat",
					"mask-position": "center",
				}}
			/>
			<div>
				<h3
					class="font-bold text-lg"
					style={{ color: "var(--card-accent-color)" }}
				>
					{props.contact.service}
				</h3>
				<p class="text-sm" style={{ color: "var(--text-color)" }}>
					{props.contact.username}
				</p>
			</div>
		</>
	);

	return (
		<div
			class="group relative p-4 border rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:bg-[var(--selection-bg)]"
			style={{
				"border-color": "var(--bright-black)",
				"background-color": "var(--background)",
				"--card-accent-color": props.contact.color,
			}}
		>
			<div
				class="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
				style={{
					"box-shadow": `0 0 10px 1px var(--card-accent-color)`,
				}}
			/>

			<Show
				when={props.contact.url}
				fallback={
					<div class="flex items-center gap-4">
						<CardContent />
					</div>
				}
			>
				<a
					href={props.contact.url}
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center gap-4"
				>
					<CardContent />
				</a>
			</Show>

			<div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
				<CopyButton textToCopy={props.contact.username} />
			</div>
		</div>
	);
};

const ContactInfoComponent: Component = () => {
	return (
		<div class="my-2">
			<p class="text-center mb-2" style={{ color: "var(--text-color)" }}>
				Click on any card to get in touch.
			</p>
			<p
				class="text-center text-sm mb-6"
				style={{ color: "var(--bright-black)" }}
			>
				(Services are ordered by most frequently used from left to
				right)
			</p>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
				<For each={contacts}>
					{(contact) => <ContactCard contact={contact} />}
				</For>
			</div>
		</div>
	);
};

export const handler = (terminal: Terminal) => {
	terminal.println(() => <ContactInfoComponent />);
};
