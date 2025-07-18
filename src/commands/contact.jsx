import { createSignal, For, Show } from 'solid-js';

export const meta = {
    description: "displays my contact information",
};

function CopyButton({ textToCopy }) {
    const [copyText, setCopyText] = createSignal('Copy');

    const handleCopy = (e) => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopyText('Copied!');
            setTimeout(() => setCopyText('Copy'), 2000);
        });
    };

    return (
        <button
            onClick={handleCopy}
            class="px-2 py-1 text-xs rounded transition-all duration-200"
            style={{
                'background-color': 'var(--selection-bg)',
                'color': 'var(--text-color)',
            }}
        >
            {copyText()}
        </button>
    );
}

function ContactInfoComponent() {
    const contacts = [
        {
            service: 'Discord',
            username: 'rhm176.',
            icon: '/assets/icons/discord.svg',
            color: 'var(--bright-blue)'
        },
        {
            service: 'GitHub',
            username: 'Raik176',
            url: 'https://github.com/Raik176',
            icon: '/assets/icons/github.svg',
            color: 'var(--bright-white)'
        },
        {
            service: 'Email',
            username: 'righthandman176@proton.me',
            url: 'mailto:righthandman176@proton.me',
            icon: '/assets/icons/email.svg',
            color: 'var(--bright-red)'
        },
        {
            service: 'Bluesky',
            username: 'rhm176.de',
            url: 'https://bsky.app/profile/rhm176.de',
            icon: '/assets/icons/bsky.svg',
            color: 'var(--blue)'
        },
    ];

    return (
        <div class="my-2">
            <p class="text-center mb-2" style={{ 'color': 'var(--text-color)' }}>
                Click on any card to get in touch.
            </p>
            <p class="text-center text-sm mb-6" style={{ 'color': 'var(--bright-black)' }}>
                (Services are ordered by most frequently used from left to right)
            </p>
            <div
                class="grid gap-4"
                style={{ 'grid-template-columns': 'repeat(auto-fit, minmax(250px, 1fr))' }}
            >
                <For each={contacts}>
                    {(contact) => <ContactCard contact={contact} />}
                </For>
            </div>
        </div>
    );
}

function ContactCard({ contact }) {
    const CardContent = () => (
        <>
            <div
                class="w-8 h-8 flex-shrink-0 transition-colors duration-200 group-hover:bg-[var(--card-accent-color)]"
                style={{
                    'background-color': 'var(--text-color)',
                    'mask-image': `url(${contact.icon})`,
                    'mask-size': 'contain',
                    'mask-repeat': 'no-repeat',
                    'mask-position': 'center',
                }}
            ></div>
            <div>
                <h3 class="font-bold text-lg" style={{ 'color': 'var(--card-accent-color)' }}>
                    {contact.service}
                </h3>
                <p class="text-sm" style={{ 'color': 'var(--text-color)' }}>
                    {contact.username}
                </p>
            </div>
        </>
    );

    return (
        <div
            class="group relative p-4 border rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:bg-[var(--selection-bg)]"
            style={{
                'border-color': 'var(--bright-black)',
                'background-color': 'var(--background)',
                '--card-accent-color': contact.color,
            }}
        >
            <div
                class="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{ 'box-shadow': '0 0 10px 1px var(--card-accent-color)' }}
            />

            <Show
                when={contact.url}
                fallback={
                    <div class="flex items-center gap-4">
                        <CardContent />
                    </div>
                }
            >
                <a
                    href={contact.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-4"
                >
                    <CardContent />
                </a>
            </Show>

            <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <CopyButton textToCopy={contact.username} />
            </div>
        </div>
    );
}

export const handler = (terminal) => {
    terminal.println({
        html: <ContactInfoComponent />
    });
};