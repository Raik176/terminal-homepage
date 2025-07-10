import "./PrivacyPolicy.css";

export default function PrivacyPolicy() {
    return (
        <div
            class="bg-black text-white font-mono p-4 md:p-8 w-full min-h-screen overflow-y-auto max-h-[100vh] whitespace-pre-wrap flex flex-col items-center justify-between"
            style={{fontFamily: "'Roboto Mono', monospace"}}
        >
            {/* ASCII Art */}
            <section class="text-center mb-4 md:mb-6 animate-fade-in">
                <pre class="text-green-400 text-sm md:text-base">
                    {`
 _______           _                                    _______         __    _                   
|_   __ \\         (_)                                  |_   __ \\       [  |  (_)                  
  | |__) |_ .--.  __  _   __  ,--.   .---.   _   __      | |__) | .--.  | |  __   .---.   _   __  
  |  ___/[ \`/'\`\\][  |[ \\ [  ]\`'_\\ : / /'\`\\] [ \\ [  ]     |  ___// .'\`\\ \\| | [  | / /'\`\\] [ \\ [  ] 
 _| |_    | |     | | \\ \\/ / // | |,| \\__.   \\ '/ /     _| |_   | \\__. || |  | | | \\__.   \\ '/ /  
|_____|  [___]   [___] \\__/  \\'-;__/'.___.'[\\_:  /     |_____|   '.__.'[___][___]'.___.'[\\_:  /   
                                            \\__.'                                        \\__.'    
                    `}
                </pre>
            </section>

            {/* Text Content */}
            <div class="max-w-2xl text-center animate-slide-in-left">
                <p class="text-lg leading-relaxed text-white mb-6">
                    This website does not track personal data. I, however, use
                    <a
                        href="https://github.com/milesmcc/shynet"
                        class="text-green-400 font-bold underline hover:text-green-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Shynet
                    </a> to collect anonymous visit statistics
                    <span class="text-red-500 font-bold"> without storing IP addresses, cookies, or personal data</span>.
                    Additionally, <span class="text-green-400 font-bold">Shynet respects Do Not Track (DNT)</span>,
                    meaning visitors who enable DNT in their browser will not be tracked at all.
                </p>


                <p class="text-lg leading-relaxed text-white mb-6">
                    The following data is collected:
                </p>
                <ul class="list-disc pl-6 text-white text-lg mb-6">
                    <li>Country of origin</li>
                    <li>Operating system (e.g., Windows, macOS, Android, iOS)</li>
                    <li>Device type (e.g., mobile, desktop, tablet)</li>
                    <li>Referrer (the page the user came from before landing on this site)</li>
                    <li>Browser (e.g., Chrome, Firefox, Safari)</li>
                    <li>Visit counts (how many times the site has been visited)</li>
                    <li>Visit time (how long the user stays on the site)</li>
                </ul>
                <p class="text-lg leading-relaxed text-white mb-6">
                    This data is used solely for analyzing website traffic patterns and improving the user experience.
                </p>

                {/* Additional information about session data */}
                <p class="text-lg leading-relaxed text-white mb-6">
                    The following session data is also collected:
                </p>
                <ul class="list-disc pl-6 text-white text-lg mb-6">
                    <li>When the session started</li>
                    <li>Network provider</li>
                    <li>Country of origin</li>
                    <li>Session duration</li>
                </ul>
                <p class="text-lg leading-relaxed text-white mb-6">
                    This session data is anonymized and is used solely for analyzing traffic patterns and improving site
                    performance.
                </p>
            </div>
        </div>
    );
}