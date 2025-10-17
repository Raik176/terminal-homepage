import { Component } from "solid-js";
import { Terminal } from "../components/Terminal";

export const meta = {
	description: "shows ways to support my work",
};

const SupportComponent: Component = () => (
	<div
		class="my-2 p-4 border rounded-lg max-w-lg animate-fade-in"
		style={{ "border-color": "var(--bright-black)" }}
	>
		<h2
			class="text-xl font-bold text-center mb-2"
			style={{ color: "var(--bright-yellow)" }}
		>
			Enjoying my work?
		</h2>
		<p class="text-center" style={{ color: "var(--text-color)" }}>
			Your support helps me continue creating and maintaining projects. If
			you find my work useful, please consider buying me a coffee!
		</p>
		<div class="mt-6 flex justify-center">
			<a href="https://ko-fi.com/R6R3163YVT" target="_blank">
				<img
					height="36"
					style={{ border: 0, height: "36px" }}
					src="https://storage.ko-fi.com/cdn/kofi4.png?v=6"
					alt="Buy Me a Coffee at ko-fi.com"
				/>
			</a>
		</div>
	</div>
);

export const handler = (terminal: Terminal) => {
	terminal.println(() => <SupportComponent />);
};
