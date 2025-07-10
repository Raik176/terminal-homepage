export default function Disclaimer() {
    return (
        <div
            class="bg-black text-white font-mono p-8 w-full h-screen overflow-y-auto max-h-[100vh] whitespace-pre-wrap"
            style={{ "font-family": "'Roboto Mono', monospace" }}
        >
            {/* ASCII Art */}
            <pre class="text-green-400 mb-8 md:mb-10 text-sm md:text-base animate-fade-in text-center">
{`
________   .__                 .__           .__                          
\\______ \\  |__|  ______  ____  |  |  _____   |__|  _____    ____  _______ 
 |    |  \\ |  | /  ___/_/ ___\\ |  |  \\__  \\  |  | /     \\ _/ __ \\ \\_  __ \\
 |    \`   \\|  | \\___ \\ \\  \\___ |  |__ / __ \\_|  ||  Y Y  \\\\  ___/  |  | \\/
/_______  /|__|/____  > \\___  >|____/(____  /|__||__|_|  / \\___  > |__|   
        \\/          \\/      \\/            \\/           \\/      \\/         
`}
            </pre>

            {/* Text Content */}
            <div class="max-w-2xl mx-auto text-center animate-slide-in-left">
                <p class="text-lg leading-relaxed text-white mb-8 text-left px-4 sm:px-0">
                    The information provided on this homepage (the "Site") is for general informational purposes only. While I strive to keep the content accurate and up to date, I make no guarantees about the completeness, reliability, or suitability of the information, opinions, or resources shared here. Any reliance you place on such information is <span class="text-yellow-400">strictly at your own risk</span>.
                </p>
                <p class="text-lg leading-relaxed text-white mb-8 text-left px-4 sm:px-0">
                    I am <span class="text-red-400">not liable</span> for any loss or damage, including but not limited to indirect or consequential loss or damage, arising from the use of this Site or any content provided herein. This includes, but is not limited to, loss of data, profits, or other intangible losses.
                </p>
                <p class="text-lg leading-relaxed text-white mb-8 text-left px-4 sm:px-0">
                    This Site may include links to external websites that are not under my control. I have no influence over the nature, content, or availability of those sites. The inclusion of any links does not necessarily imply <span class="text-cyan-400">endorsement or agreement</span> with the views expressed on those sites.
                </p>
                <p class="text-lg leading-relaxed text-white mb-8 text-left px-4 sm:px-0">
                    I make every effort to keep this Site accessible and functioning smoothly. However, I am not responsible for any temporary unavailability due to technical issues beyond my control.
                </p>
                <p class="text-lg leading-relaxed text-white mb-8 text-left px-4 sm:px-0">
                    This website and its contents are governed by the laws of <span class="text-green-400">Germany</span>. Any disputes arising from the use of this site shall be resolved in the courts of <span class="text-green-400">Papenburg 26871, Germany</span>.
                </p>
                <p class="text-lg leading-relaxed text-white mb-8 text-left px-4 sm:px-0">
                    Thank you for visiting!
                </p>
            </div>
        </div>
    );
}