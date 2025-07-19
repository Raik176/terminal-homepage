import type { Component } from "solid-js";
import "./PrivacyPolicy.css";

const PrivacyPolicy: Component = () => {
	return (
		<main
			class="font-mono p-4 md:p-8 w-full min-h-screen overflow-y-auto max-h-[100vh] whitespace-pre-wrap flex flex-col items-center"
			style={{
				"background-color": "var(--background)",
				color: "var(--text-color)",
				"font-family": "'Roboto Mono', monospace",
			}}
		>
			<h1 class="sr-only">Privacy Policy</h1>

			<section class="text-center mb-4 md:mb-6 animate-fade-in">
				<pre
					aria-hidden="true"
					class="text-sm md:text-base"
					style={{ color: "var(--green)" }}
				>
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

			<div class="max-w-xl text-center animate-slide-in-left">
				<p class="text-xl leading-relaxed mb-6">
					Your privacy is important.
				</p>
				<p class="text-lg leading-relaxed mb-6 text-left px-4 sm:px-0">
					This website{" "}
					<span
						style={{ color: "var(--green)", "font-weight": "bold" }}
					>
						does not use cookies, tracking scripts, or any analytics
						services
					</span>
					.
				</p>
				<p class="text-lg leading-relaxed mb-6 text-left px-4 sm:px-0">
					No personal data, IP addresses, browser information, or any
					other user information is collected, stored, or processed.
					Your visit is completely anonymous.
				</p>
			</div>
		</main>
	);
};

export default PrivacyPolicy;
