import "./PrivacyPolicy.css";

export default function PrivacyPolicy() {
    return (
        <div
            class="bg-black text-white font-mono p-6 w-full h-screen overflow-y-auto max-h-[100vh] whitespace-pre-wrap"
            style={{ fontFamily: "'Fira Code', monospace" }}
        >
            {/* Header with ASCII art */}
            <pre class="text-green-400 mb-6 animate-fade-in">{`
 _______           _                                    _______         __    _                   
|_   __ \\         (_)                                  |_   __ \\       [  |  (_)                  
  | |__) |_ .--.  __  _   __  ,--.   .---.   _   __      | |__) | .--.  | |  __   .---.   _   __  
  |  ___/[ \`/'\`\\][  |[ \\ [  ]\`'_\\ : / /'\`\\] [ \\ [  ]     |  ___// .'\`\\ \\| | [  | / /'\`\\] [ \\ [  ] 
 _| |_    | |     | | \\ \\/ / // | |,| \\__.   \\ '/ /     _| |_   | \\__. || |  | | | \\__.   \\ '/ /  
|_____|  [___]   [___] \\__/  \\'-;__/'.___.'[\\_:  /     |_____|   '.__.'[___][___]'.___.'[\\_:  /   
                                            \\__.'                                        \\__.'    
`}</pre>

            {/* Introduction */}
            <p class="whitespace-pre-wrap mb-6 text-lg leading-relaxed text-gray-300 animate-slide-in-left">
                I use <span class="text-blue-500 font-bold">Shynet</span>, a privacy-focused analytics tool, to collect anonymous data to improve this website. The following information may be collected:
            </p>

            {/* List of collected data */}
            <div class="bg-gray-900 p-5 rounded-lg border-2 border-green-500 mb-6 shadow-lg animate-slide-in-right">
                <ul class="list-none space-y-3">
                    {[
                        { label: "Load time", description: "How long pages take to load. (e.g. 500ms)" },
                        { label: "Routing path", description: "Pages visited (e.g. /, /404, /legal/privacy-policy)." },
                        { label: "Country", description: "General location (country only, no IP addresses)." },
                        { label: "Referrer", description: "The page that led to this site. (e.g. https://google.com)" },
                        { label: "Operating system", description: "The system being used (e.g. Windows, macOS)." },
                        { label: "Browser", description: "The browser being used (e.g. Chrome, Firefox)." },
                        { label: "Device type", description: "The type of device (e.g. desktop, mobile)." },
                    ].map((item, index) => (
                        <li key={index} class="flex items-start">
                            <span class="text-green-400 mr-2">$</span>
                            <span>
                                <span class="text-yellow-500 font-semibold">{item.label}</span> - {item.description}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Data retention */}
            <p class="whitespace-pre-wrap mb-6 text-lg leading-relaxed text-gray-300 animate-slide-in-left">
                All data is anonymized, and no personally identifiable information is collected. Data is retained for <span class="text-yellow-500 font-semibold">3 months</span> before being deleted.
            </p>

            {/* Opt-out information */}
            <p class="whitespace-pre-wrap mb-6 text-lg leading-relaxed text-gray-300 animate-slide-in-right">
                You can opt out of analytics by enabling the <span class="text-blue-500 font-semibold">Do Not Track</span> feature in your browser.
            </p>

            {/* Consent notice */}
            <div class="bg-gray-900 p-5 rounded-lg border-2 border-green-500 mb-6 shadow-lg animate-fade-in">
                <p class="whitespace-pre-wrap text-center font-medium text-lg text-green-400">
                    By using this site, you consent to the collection of anonymous data as described.
                </p>
            </div>

            {/* Contact information */}
            <div class="bg-gray-900 p-5 rounded-lg border-2 border-blue-500 shadow-lg animate-fade-in">
                <p class="whitespace-pre-wrap text-center text-lg text-blue-500">
                    For questions, feel free to contact me at <a href="mailto:support@website.com" class="underline hover:text-blue-300">support@website.com</a>.
                </p>
            </div>
        </div>
    );
}