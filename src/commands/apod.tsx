import { Component, Show } from "solid-js";
import { formatDateWithRelativeTime } from "../utils";
import { Terminal } from "../components/Terminal";
import { DeriveArgs } from "./index";

interface ApodData {
	title: string;
	date: string;
	copyright?: string;
	hdurl?: string;
	url: string;
	media_type: "image" | "video";
	explanation: string;
}

export const meta = {
	description: "Displays NASA's Astronomy Picture of the Day.",
	arguments: [],
} as const;

const ApodComponent: Component<{ data: ApodData }> = (props) => {
	const imageUrl = () => props.data.hdurl || props.data.url;

	return (
		<div
			class="my-4 max-w-3xl mx-auto border rounded-lg p-4"
			style={{ "border-color": "var(--bright-black)" }}
		>
			<h2
				class="font-bold text-2xl mb-2"
				style={{ color: "var(--cyan)" }}
			>
				{props.data.title}
			</h2>
			<p class="text-sm mb-4" style={{ color: "var(--bright-black)" }}>
				{formatDateWithRelativeTime(props.data.date)}
				{props.data.copyright && ` © ${props.data.copyright}`}
			</p>

			<Show when={props.data.media_type === "image"}>
				<a href={imageUrl()} target="_blank" rel="noopener noreferrer">
					<img
						src={imageUrl()}
						alt={props.data.title}
						class="rounded-md w-full object-contain mb-4"
					/>
				</a>
			</Show>
			<Show when={props.data.media_type === "video"}>
				<div
					style={{
						position: "relative",
						"padding-bottom": "56.25%",
						height: 0,
						overflow: "hidden",
					}}
					class="mb-4"
				>
					<iframe
						src={props.data.url}
						title={props.data.title}
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen
						class="rounded-md"
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							width: "100%",
							height: "100%",
						}}
					></iframe>
				</div>
			</Show>

			<p
				class="whitespace-pre-wrap leading-relaxed"
				style={{ color: "var(--text-color)" }}
			>
				{props.data.explanation}
			</p>
		</div>
	);
};

export const handler = async (
	terminal: Terminal,
	args: DeriveArgs<typeof meta.arguments>,
	signal: AbortSignal
) => {
	const apiKey = "DEMO_KEY";
	const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`;

	try {
		terminal.println("Fetching NASA's Astronomy Picture of the Day...");
		const response = await fetch(url, { signal });

		if (signal.aborted) return;

		if (!response.ok) {
			throw new Error(
				`Failed to fetch APOD data (Status: ${response.status})`
			);
		}

		const data: ApodData = await response.json();

		terminal.println({
			html: <ApodComponent data={data} />,
		});
	} catch (e: unknown) {
		if (!signal.aborted) {
			if (e instanceof Error) {
				terminal.error(e);
			} else {
				terminal.error(new Error(String(e)));
			}
		}
	}
};
