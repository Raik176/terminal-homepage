import { Show } from 'solid-js';
import { formatDateWithRelativeTime } from '../utils.js';

export const meta = {
    description: "Displays NASA's Astronomy Picture of the Day.",
};

function ApodComponent({ data }) {
    const imageUrl = data.hdurl || data.url;
    return (
        <div class="my-4 max-w-3xl mx-auto border rounded-lg p-4" style={{ 'border-color': 'var(--bright-black)' }}>
            <h2 class="font-bold text-2xl mb-2" style={{ 'color': 'var(--cyan)' }}>
                {data.title}
            </h2>
            <p class="text-sm mb-4" style={{ 'color': 'var(--bright-black)' }}>
                {formatDateWithRelativeTime(data.date)}
                {data.copyright && ` © ${data.copyright}`}
            </p>

            <Show when={data.media_type === 'image'}>
                <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                    <img src={imageUrl} alt={data.title} class="rounded-md w-full object-contain mb-4" />
                </a>
            </Show>
            <Show when={data.media_type === 'video'}>
                <div style={{ position: 'relative', 'padding-bottom': '56.25%', height: 0, 'overflow': 'hidden' }} class="mb-4">
                    <iframe
                        src={data.url}
                        title={data.title}
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                        class="rounded-md"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    ></iframe>
                </div>
            </Show>

            <p class="whitespace-pre-wrap leading-relaxed" style={{ 'color': 'var(--text-color)' }}>
                {data.explanation}
            </p>
        </div>
    );
}

export const handler = async (terminal, args, signal) => {
    const apiKey = "DEMO_KEY";
    const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`;

    try {
        terminal.println("Fetching NASA's Astronomy Picture of the Day...");
        const response = await fetch(url, { signal });

        if (signal.aborted) return;

        if (!response.ok) {
            throw new Error(`Failed to fetch APOD data (Status: ${response.status})`);
        }

        const data = await response.json();

        terminal.println({
            html: <ApodComponent data={data} />
        });

    } catch (e) {
        if (!signal.aborted) {
            terminal.error(e);
        }
    }
};