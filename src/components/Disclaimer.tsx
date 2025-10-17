import { For, JSX } from "solid-js";
import type { Component } from "solid-js";

const disclaimerContent: JSX.Element[] = [
	<>
		The information provided on this homepage (the "Site") is for general
		informational purposes only. While I strive to keep the content accurate
		and up to date, I make no guarantees about the completeness,
		reliability, or suitability of the information, opinions, or resources
		shared here. Any reliance you place on such information is{" "}
		<span style={{ color: "var(--yellow)" }}>
			strictly at your own risk
		</span>
		.
	</>,
	<>
		This website respects your privacy and{" "}
		<span style={{ color: "var(--green)" }}>
			does not collect any personal data or use analytics services
		</span>
		. For more details, you can view the{" "}
		<a
			href="/legal/privacy-policy"
			class="text-blue-400 underline hover:text-blue-300"
		>
			Privacy Policy
		</a>
		.
	</>,
	<>
		I am <span style={{ color: "var(--red)" }}>not liable</span> for any
		loss or damage, including but not limited to indirect or consequential
		loss or damage, arising from the use of this Site or any content
		provided herein. This includes, but is not limited to, loss of data,
		profits, or other intangible losses.
	</>,
	<>
		This Site may include links to external websites that are not under my
		control. I have no influence over the nature, content, or availability
		of those sites. The inclusion of any links does not necessarily imply{" "}
		<span style={{ color: "var(--cyan)" }}>endorsement or agreement</span>{" "}
		with the views expressed on those sites.
	</>,
	<>
		I make every effort to keep this Site accessible and functioning
		smoothly. However, I am not responsible for any temporary unavailability
		due to technical issues beyond my control.
	</>,
	<>
		This website and its contents are governed by the laws of{" "}
		<span style={{ color: "var(--green)" }}>Germany</span>. The place of
		jurisdiction is the competent court in{" "}
		<span style={{ color: "var(--green)" }}>Papenburg, Germany</span>.
	</>,
	<>Thank you for visiting!</>,
];

const AsciiArt: Component = () => (
	<pre
		aria-hidden="true"
		class="mb-8 md:mb-10 text-sm md:text-base animate-fade-in text-center"
		style={{ color: "var(--green)", "font-size": "max(0.7vw, 0.48rem)" }}
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

const Disclaimer: Component = () => {
	return (
		<main
			class="p-8 w-full whitespace-pre-wrap"
			style={{
				"background-color": "var(--background)",
				color: "var(--text-color)",
				"font-family": "'Roboto Mono', monospace",
			}}
		>
			<h1 class="sr-only">Disclaimer</h1>
			<AsciiArt />

			<section
				class="max-w-2xl mx-auto animate-slide-in-left"
				aria-labelledby="disclaimer-heading"
			>
				<h2 id="disclaimer-heading" class="sr-only">
					Disclaimer Details
				</h2>
				<ul
					class="pl-0 text-lg leading-relaxed"
					style={{ "list-style": "none" }}
				>
					<For each={disclaimerContent}>
						{(item) => (
							<li
								class="mb-6"
								style={{ color: "var(--text-color)" }}
							>
								{item}
							</li>
						)}
					</For>
				</ul>
			</section>
		</main>
	);
};

export default Disclaimer;
