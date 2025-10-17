import { type Component, createEffect } from "solid-js";

const Error404: Component = () => {
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
		<main
			class="font-mono p-8 w-full h-screen overflow-y-auto max-h-[100vh] whitespace-pre-wrap"
			style={{
				"background-color": "var(--background)",
				color: "var(--text-color)",
				"font-family": "'Roboto Mono', monospace",
			}}
		>
			<h1 class="sr-only">Error 404: Page Not Found</h1>
			<div class="w-full max-w-3xl">
				<pre
					aria-hidden="true"
					style={{
						color: "var(--green)",
						"font-size": "max(0.6vw, 0.35rem)",
					}}
				>
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
					<p>
						<span style={{ color: "var(--red)" }}>Error 404:</span>{" "}
						Page not found
					</p>
					<p class="mt-2">
						Oops! Looks like you took a wrong turn. The page you
						were looking for doesn't exist. Here's what you can do:
					</p>
					<ul class="list-disc list-inside mt-2">
						<li>
							Head back to the{" "}
							<a
								href="/"
								class="text-blue-400 underline hover:text-blue-300"
							>
								homepage
							</a>{" "}
							by pressing any key or using the link.
						</li>
						<li>Check the URL, maybe it was a typo?</li>
					</ul>
				</div>
				<div class="mt-6">
					<p>
						<span style={{ color: "var(--yellow)" }}>$</span> Press
						any key to continue...
					</p>
				</div>
			</div>
		</main>
	);
};

export default Error404;
