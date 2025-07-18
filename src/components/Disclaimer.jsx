import { For } from 'solid-js';

const disclaimerContent = [
    {
        id: 1,
        text: `The information provided on this homepage (the "Site") is for general informational purposes only. While I strive to keep the content accurate and up to date, I make no guarantees about the completeness, reliability, or suitability of the information, opinions, or resources shared here. Any reliance you place on such information is <span style="color: var(--yellow)">strictly at your own risk</span>.`
    },
    {
        id: 2,
        text: `This website respects your privacy and <span style="color: var(--green)">does not collect any personal data or use analytics services</span>. For more details, you can view the <a href="/legal/privacy-policy" class="text-blue-400 underline hover:text-blue-300">Privacy Policy</a>.`
    },
    {
        id: 3,
        text: `I am <span style="color: var(--red)">not liable</span> for any loss or damage, including but not limited to indirect or consequential loss or damage, arising from the use of this Site or any content provided herein. This includes, but is not limited to, loss of data, profits, or other intangible losses.`
    },
    {
        id: 4,
        text: `This Site may include links to external websites that are not under my control. I have no influence over the nature, content, or availability of those sites. The inclusion of any links does not necessarily imply <span style="color: var(--cyan)">endorsement or agreement</span> with the views expressed on those sites.`
    },
    {
        id: 5,
        text: `I make every effort to keep this Site accessible and functioning smoothly. However, I am not responsible for any temporary unavailability due to technical issues beyond my control.`
    },
    {
        id: 6,
        text: `This website and its contents are governed by the laws of <span style="color: var(--green)">Germany</span>. The place of jurisdiction shall be the competent court in <span style="color: var(--green)">Papenburg, Germany</span>.`
    }
];

const AsciiArt = () => (
    <pre
        aria-hidden="true"
        class="mb-8 md:mb-10 text-sm md:text-base animate-fade-in text-center"
        style={{ color: 'var(--green)' }}
    >
{`
________   .__                 .__           .__                          
\\______ \\  |__|  ______  ____  |  |  _____   |__|  _____    ____  _______ 
 |    |  \\ |  | /  ___/_/ ___\\ |  |  \\__  \\  |  | /     \\ _/ __ \\ \\_  __ \\
 |    \`   \\|  | \\___ \\ \\  \\___ |  |__ / __ \\_|  ||  Y Y  \\\\  ___/  |  | \\/
/_______  /|__|/____  > \\___  >|____/(____  /|__||__|_|  / \\___  > |__|   
        \\/          \\/      \\/            \\/           \\/      \\/         
`}
    </pre>
);

export default function Disclaimer() {
    return (
        <main
            class="p-8 w-full h-screen overflow-y-auto whitespace-pre-wrap"
            style={{
                "background-color": "var(--background)",
                "color": "var(--text-color)",
                "font-family": "'Roboto Mono', monospace"
            }}
        >
            <h1 class="sr-only">Disclaimer</h1>

            <AsciiArt />

            <section class="max-w-2xl mx-auto text-center animate-slide-in-left">
                <For each={disclaimerContent}>
                    {(item) => (
                        <p
                            class="text-lg leading-relaxed mb-8 text-left px-4 sm:px-0"
                            style={{ color: 'var(--text-color)'}}
                            innerHTML={item.text}
                        />
                    )}
                </For>

                <p class="text-lg leading-relaxed mb-8 text-left px-4 sm:px-0" style={{color: 'var(--text-color)'}}>
                    Thank you for visiting!
                </p>
            </section>
        </main>
    );
}