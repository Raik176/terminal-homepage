import {
	createSignal,
	Show,
	onMount,
	onCleanup,
	Component,
	For,
} from "solid-js";
import { Terminal } from "../components/Terminal";
import pako from "pako";
import { DISCORD_ID } from "../utils";

const LanyardOperation = {
	EVENT: 0,
	HELLO: 1,
	INITIALIZE: 2,
	HEARTBEAT: 3,
};

interface LanyardData {
	active_on_discord_mobile: boolean;
	active_on_discord_desktop: boolean;
	listening_to_spotify: boolean;
	kv?: {
		[key: string]: string;
	};
	spotify?: {
		track_id: string;
		timestamps: {
			start: number;
			end: number;
		};
		song: string;
		artist: string;
		album_art_url: string;
		album: string;
	};
	discord_user: {
		id: string;
		username: string;
		avatar: string;
		discriminator: string;
		public_flags: number;
		global_name?: string;
		display_name?: string;
		primary_guild?: {
			tag: string;
			identity_guild_id: string;
			badge: string;
			identity_enabled: boolean;
		};
		avatar_decoration_data?: {
			sku_id: string;
			asset: string;
			expires_at: number;
		};
	};
	discord_status: "online" | "idle" | "dnd" | "offline";
	activities: Activity[];
}

interface Activity {
	name: string;
	id: string;
	details?: string;
	state?: string;
	type: number;
	application_id: string;
	assets?: {
		large_text?: string;
		large_image?: string;
		small_text?: string;
		small_image?: string;
	};
	timestamps?: {
		start: number;
		end?: number;
	};
	emoji?: {
		// only present when id === "custom", which is a custom status.
		id?: string;
		name: string;
		animated?: boolean;
	};
}

interface ActivityAssetUrls {
	largeImageUrl?: string;
	smallImageUrl?: string;
}

const ASSET_REGEX = /mp:external\/[^\/]+\/(?<protocol>[^\/]+)\/(?<uri>.+)/;

let socket: WebSocket | null = null;
let heartbeatInterval: number | undefined;
let activeSubscriptions = 0;

const [presence, setPresence] = createSignal<LanyardData | null>(null);
const [connectionStatus, setConnectionStatus] = createSignal<string>("Idle");

const connect = () => {
	if (socket) return;

	setConnectionStatus("Connecting...");
	socket = new WebSocket(
		"wss://api.lanyard.rest/socket?compression=zlib_json"
	);

	socket.onopen = () =>
		setConnectionStatus("Connection established. Waiting for presence...");

	socket.onclose = () => {
		clearInterval(heartbeatInterval);
		socket = null;
		setConnectionStatus(
			"Connection lost. Run the command again to reconnect."
		);
	};

	socket.onmessage = async (event) => {
		let textData: string;

		if (event.data instanceof Blob) {
			const arrayBuffer = await event.data.arrayBuffer();
			textData = pako.inflate(new Uint8Array(arrayBuffer), {
				to: "string",
			});
		} else if (event.data instanceof ArrayBuffer) {
			textData = pako.inflate(new Uint8Array(event.data), {
				to: "string",
			});
		} else {
			textData = event.data;
		}

		const data = JSON.parse(textData);

		switch (data.op) {
			case LanyardOperation.HELLO:
				heartbeatInterval = setInterval(
					() =>
						socket?.send(
							JSON.stringify({ op: LanyardOperation.HEARTBEAT })
						),
					data.d.heartbeat_interval
				);
				socket?.send(
					JSON.stringify({
						op: LanyardOperation.INITIALIZE,
						d: { subscribe_to_id: DISCORD_ID },
					})
				);
				break;
			case LanyardOperation.EVENT:
				if (data.t === "INIT_STATE" || data.t === "PRESENCE_UPDATE") {
					setPresence(data.d);
				}
				break;
		}
	};
};

const disconnect = () => {
	if (socket && activeSubscriptions === 0) {
		clearInterval(heartbeatInterval);
		socket.close();
		socket = null;
		setPresence(null);
		setConnectionStatus("Idle");
	}
};

export const meta = {
	description: "Displays my live Discord status.",
} as const;

export const handler = (terminal: Terminal) => {
	terminal.println(() => <DiscordStatusComponent />);
};

const DiscordStatusComponent: Component = () => {
	onMount(() => {
		activeSubscriptions++;
		connect();
	});

	onCleanup(() => {
		activeSubscriptions--;
		disconnect();
	});

	return (
		<section class="my-2" aria-label="Live Discord status">
			<Show
				when={presence()}
				fallback={<p role="status">{connectionStatus()}</p>}
			>
				{(data) => <DiscordCard data={data()} />}
			</Show>
		</section>
	);
};

const DiscordCard: Component<{ data: LanyardData }> = (props) => {
	const [now, setNow] = createSignal(Date.now());

	onMount(() => {
		const timer = setInterval(() => setNow(Date.now()), 1000);
		onCleanup(() => clearInterval(timer));
	});

	const avatarUrl = () =>
		props.data.discord_user.avatar
			? `https://api.lanyard.rest/${props.data.discord_user.id}.webp`
			: `https://cdn.discordapp.com/embed/avatars/${(Number(props.data.discord_user.id) >> 22) % 6}`;

	const customStatus = () =>
		props.data.activities.find((a) => a.id === "custom");

	const statusColors = {
		online: "#3ba55c",
		idle: "#faa81a",
		dnd: "#ed4245",
		offline: "#747f8d",
	};

	const formatTimestamp = (start?: number, end?: number) => {
		if (!start) return null;
		const total = end ? end - start : now() - start;
		const elapsed = Math.max(0, now() - start);
		return {
			progress: end ? Math.min(100, (elapsed / total) * 100) : null,
			elapsed: Math.max(0, Math.floor(elapsed / 1000)),
			total: Math.max(0, Math.floor(total / 1000)),
		};
	};

	const formatTime = (seconds: number) => {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, "0")}`;
	};

	const getActivityAssetUrls = (
		activity: Activity
	): ActivityAssetUrls | null => {
		if (!activity.assets) return null;

		function extractUrl(image?: string): string | undefined {
			if (!image) return undefined;
			const match = image.match(ASSET_REGEX);
			if (match?.groups) {
				return `${match.groups.protocol}://${match.groups.uri}`;
			}
			if (image.startsWith("spotify:")) {
				return `https://i.scdn.co/image/${image.split(":")[1]}`;
			}
			return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${image}.png`;
		}

		return {
			largeImageUrl: extractUrl(activity.assets.large_image),
			smallImageUrl: extractUrl(activity.assets.small_image),
		};
	};

	return (
		<article
			class="p-5 bg-gray-900 rounded-xl shadow-lg text-white max-w-md mx-auto"
			aria-label="Discord user profile card"
		>
			<header class="flex items-start gap-4">
				<figure class="relative w-20 h-20">
					<img
						src={avatarUrl()}
						alt={`${props.data.discord_user.display_name || props.data.discord_user.username}'s Discord avatar`}
						class="rounded-full border-4 border-gray-700 w-20 h-20"
					/>
					<figcaption class="sr-only">
						{props.data.discord_user.display_name ||
							props.data.discord_user.username}
					</figcaption>
					<span
						class="absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-gray-900"
						style={{
							"background-color":
								statusColors[props.data.discord_status],
						}}
						role="img"
						aria-label={`Status: ${props.data.discord_status}`}
					/>
					{props.data.discord_user.avatar_decoration_data && (
						<img
							src={`https://cdn.discordapp.com/avatar-decoration-presets/${props.data.discord_user.avatar_decoration_data.asset}.png`}
							alt=""
							aria-hidden="true"
							class="absolute top-0 left-0 w-20 h-20 pointer-events-none"
						/>
					)}
				</figure>

				<div class="flex flex-col gap-1">
					<div class="flex items-center gap-2 flex-wrap">
						<h2 class="text-[0.9375rem] font-bold">
							{props.data.discord_user.display_name ||
								props.data.discord_user.global_name}
							<span class="text-gray-400 font-normal">
								&nbsp;({props.data.discord_user.username})
							</span>
						</h2>

						{props.data.discord_user.primary_guild && (
							<div
								class="flex items-center gap-1 bg-gray-800 rounded px-1.5 py-0.5"
								aria-label="Primary guild badge"
							>
								<img
									src={`https://cdn.discordapp.com/guild-tag-badges/${props.data.discord_user.primary_guild.identity_guild_id}/${props.data.discord_user.primary_guild.badge}.webp`}
									alt="Guild badge"
									class="w-4 h-4"
								/>
								<span class="text-xs font-semibold">
									{props.data.discord_user.primary_guild.tag.slice(
										0,
										4
									)}
								</span>
							</div>
						)}
					</div>

					{customStatus() && (
						<p class="text-sm text-gray-400 italic flex items-center gap-1">
							{customStatus()!.emoji &&
								(customStatus()!.emoji!.id ? (
									<img
										src={`https://cdn.discordapp.com/emojis/${customStatus()!.emoji!.id}.webp`}
										alt={customStatus()!.emoji!.name}
										title={
											customStatus()?.id
												? `:${customStatus()!.emoji!.name}:`
												: ""
										}
										class="w-4 h-4 inline-block"
										draggable={false}
									/>
								) : (
									<span>{customStatus()!.emoji!.name}</span>
								))}
							{customStatus()!.state}
						</p>
					)}
				</div>
			</header>

			{/* Spotify Activity */}
			{props.data.listening_to_spotify && props.data.spotify && (
				<section
					class="mt-4 p-3 rounded-lg bg-green-800 bg-opacity-40"
					aria-label="Listening on Spotify"
				>
					<div class="flex gap-3">
						<img
							src={props.data.spotify.album_art_url}
							alt={`Album art for ${props.data.spotify.album}`}
							class="w-16 h-16 rounded-md"
						/>
						<div class="flex-1">
							<div class="flex justify-between items-start">
								<h3 class="font-bold text-green-400">
									{props.data.spotify.song}
								</h3>
								<a
									href={`https://open.spotify.com/track/${props.data.spotify.track_id}`}
									target="_blank"
									rel="noopener noreferrer"
									class="ml-2 text-xs font-semibold px-2 py-1 rounded bg-green-600 hover:bg-green-500 text-white transition"
									title="Open in Spotify"
								>
									Open in Spotify
								</a>
							</div>
							<p class="text-xs text-gray-300">
								{props.data.spotify.artist}
							</p>
							<p class="text-xs italic text-gray-400">
								{props.data.spotify.album}
							</p>
						</div>
					</div>

					<Show
						when={formatTimestamp(
							props.data.spotify.timestamps.start,
							props.data.spotify.timestamps.end
						)}
					>
						{(timeData) => (
							<>
								{timeData().progress !== null && (
									<div
										class="mt-2 h-1 w-full bg-gray-700 rounded-full"
										role="progressbar"
										aria-valuemin="0"
										aria-valuemax="100"
										aria-valuenow={Math.round(
											timeData().progress || 0
										)}
									>
										<div
											class="h-full bg-green-500 rounded-full"
											style={{
												width: `${timeData().progress}%`,
											}}
										/>
									</div>
								)}
								<div class="flex justify-between text-xs text-gray-400 mt-1">
									<time dateTime={`PT${timeData().elapsed}S`}>
										{formatTime(timeData().elapsed)}
									</time>
									{timeData().total && (
										<time
											dateTime={`PT${timeData().total}S`}
										>
											{formatTime(timeData().total)}
										</time>
									)}
								</div>
							</>
						)}
					</Show>
				</section>
			)}

			{/* Other Activities */}
			<section
				class="mt-4 space-y-3"
				aria-label="Other Discord activities"
			>
				{props.data.activities.length > 0 ? (
					<ul class="space-y-3">
						<For
							each={props.data.activities.filter(
								(a) =>
									!a.id.startsWith("spotify:") &&
									a.id !== "custom"
							)}
						>
							{(activity) => {
								const urls = getActivityAssetUrls(activity);
								const timeData = () =>
									formatTimestamp(
										activity.timestamps?.start,
										activity.timestamps?.end
									);

								return (
									<li class="p-3 rounded-lg bg-gray-800 flex gap-3 items-center relative">
										{urls?.largeImageUrl && (
											<div class="relative">
												<img
													src={decodeURIComponent(
														urls.largeImageUrl
													)}
													alt={
														activity.assets
															?.large_text ||
														activity.name
													}
													class="w-12 h-12 rounded-md"
												/>
												{urls?.smallImageUrl && (
													<img
														src={decodeURIComponent(
															urls.smallImageUrl
														)}
														alt={
															activity.assets
																?.small_text ||
															""
														}
														class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-gray-800"
													/>
												)}
											</div>
										)}

										<div>
											<h4 class="font-semibold text-purple-400">
												{activity.name}
											</h4>
											{activity.details && (
												<p class="text-sm">
													{activity.details}
												</p>
											)}
											{activity.state && (
												<p class="text-xs text-gray-400">
													{activity.state}
												</p>
											)}
											{timeData() && (
												<p class="text-xs text-gray-400 mt-1">
													Time elapsed:{" "}
													<time
														dateTime={`PT${timeData()!.elapsed}S`}
													>
														{formatTime(
															timeData()!.elapsed
														)}
													</time>
												</p>
											)}
										</div>
									</li>
								);
							}}
						</For>
					</ul>
				) : (
					<p class="text-sm text-gray-500" role="status">
						No active activities
					</p>
				)}
			</section>
		</article>
	);
};
