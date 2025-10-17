import {
	createSignal,
	For,
	Show,
	Component,
	JSX,
	createEffect,
	onCleanup,
} from "solid-js";
import { Terminal } from "../components/Terminal";
import { Contact, SOCIALS } from "../utils";

const usernameCache = new Map<Contact, Promise<string> | string>();
let activeDynamicCards = 0;

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
	const [username, setUsername] = createSignal<string | null>(null);

	createEffect(() => {
		const { username: user } = props.contact;

		if (typeof user === "function") {
			if (!usernameCache.has(props.contact)) {
				const promise = user()
					.then((name) => {
						usernameCache.set(props.contact, name);
						return name;
					})
					.catch(() => {
						usernameCache.set(props.contact, "N/A");
						return "N/A";
					});
				usernameCache.set(props.contact, promise);
			}

			activeDynamicCards++;

			const cached = usernameCache.get(props.contact)!;
			if (typeof cached === "string") {
				setUsername(cached);
			} else {
				cached.then(setUsername);
			}

			onCleanup(() => {
				activeDynamicCards--;
				if (activeDynamicCards === 0) {
					usernameCache.clear();
				}
			});
		} else {
			setUsername(user);
		}
	});

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
					<Show fallback="Loading..." when={username()}>
						{username()}
					</Show>
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
				<Show when={username()}>
					{(name) => <CopyButton textToCopy={name()} />}
				</Show>
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
				<For each={SOCIALS}>
					{(contact) => <ContactCard contact={contact} />}
				</For>
			</div>
		</div>
	);
};

export const meta = {
	description: "displays my socials",
} as const;

export const handler = (terminal: Terminal) => {
	terminal.println(() => <ContactInfoComponent />);
};
