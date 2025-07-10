import { createEffect } from "solid-js";

export default function Error404() {
    createEffect(() => {
        const handleKeyPress = () => {
            window.location.href = "/";
        };

        window.addEventListener("keydown", handleKeyPress);

        return () => {
            window.removeEventListener("keydown", handleKeyPress);
        };
    });

    return (
        <div
            class="bg-black text-green-400 font-mono p-8 w-full h-screen overflow-y-auto max-h-[100vh] whitespace-pre-wrap"
            style={{ "font-family": "'Roboto Mono', monospace" }}
        >
            <div class="w-full max-w-3xl">
                <pre class="text-green-400">
                    {`
   _____  _______      _____                            __      _____                        .___
  /  |  | \\   _  \\    /  |  |              ____   _____/  |_  _/ ____\\____  __ __  ____    __| _/
 /   |  |_/  /_\\  \\  /   |  |_   ______   /    \\ /  _ \\   __\\ \\   __\\/  _ \\|  |  \\/    \\  / __ | 
/    ^   /\\  \\_/   \\/    ^   /  /_____/  |   |  (  <_> )  |    |  | (  <_> )  |  /   |  \\/ /_/ | 
\\____   |  \\_____  /\\____   |            |___|  /\\____/|__|    |__|  \\____/|____/|___|  /\\____ | 
     |__|        \\/      |__|                 \\/                                      \\/      \\/ 
                    `}
                </pre>
                <div class="mt-4">
                    <p class="text-green-400">
                        <span class="text-red-500">Error 404:</span> Page not found
                    </p>
                    <p class="text-green-400 mt-2">
                        Oops! Looks like you took a wrong turn. The page you were looking for doesn't exist. Here's what you can do:
                    </p>
                    <ul class="list-disc list-inside text-green-400 mt-2">
                        <li>
                            Head back to the{" "}
                            <a href="/" class="text-blue-400 underline hover:text-blue-300">
                                homepage
                            </a>{" "}
                            by pressing any key or using the link.
                        </li>
                        <li>Check the URL, maybe it was a typo?</li>
                    </ul>
                </div>
                <div class="mt-6">
                    <p class="text-green-400">
                        <span class="text-yellow-400">$</span> Press any key to continue...
                    </p>
                </div>
            </div>
        </div>
    );
}