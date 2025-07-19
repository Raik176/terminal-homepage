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
			class="my-4 max-w-5xl mx-auto border rounded-lg p-4 flex flex-col md:flex-row md:gap-6 items-start"
			style={{ "border-color": "var(--bright-black)" }}
		>
			<div class="md:w-1/2 flex-shrink-0 mb-4 md:mb-0">
				<Show when={props.data.media_type === "image"}>
					<a
						href={imageUrl()}
						target="_blank"
						rel="noopener noreferrer"
					>
						<img
							src={imageUrl()}
							alt={props.data.title}
							class="rounded-md w-full object-cover"
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
					>
						<iframe
							src={props.data.url}
							title={props.data.title}
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowfullscreen
							class="rounded-md"
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								width: "100%",
								height: "100%",
								border: "none",
							}}
						/>
					</div>
				</Show>
			</div>

			<div class="md:w-1/2">
				<h2
					class="font-bold text-2xl mb-2"
					style={{ color: "var(--cyan)" }}
				>
					{props.data.title}
				</h2>
				<p
					class="text-sm mb-4"
					style={{ color: "var(--bright-black)" }}
				>
					{formatDateWithRelativeTime(props.data.date)}
					{props.data.copyright && ` © ${props.data.copyright}`}
				</p>
				<p
					class="whitespace-pre-wrap leading-relaxed"
					style={{ color: "var(--text-color)" }}
				>
					{props.data.explanation}
				</p>
			</div>
		</div>
	);
};

export const handler = async (
	terminal: Terminal,
	_args: DeriveArgs<typeof meta.arguments>,
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

		terminal.println(() => <ApodComponent data={data} />);
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
