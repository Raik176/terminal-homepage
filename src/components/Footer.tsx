import { routes } from "../routes.js";
import { Component, For } from "solid-js";

export const Footer: Component = () => {
	const filteredRoutes = routes.filter((route) => !route.hidden);

	return (
		<footer
			class="bg-gray-950 w-full p-1"
			style={{ "font-family": "'Oswald', sans-serif" }}
		>
			<div class="p-1">
				<p class="text-white inline">
					&copy; {new Date().getFullYear()} Right Hand Man.
				</p>
				<nav aria-label="Footer navigation" class="inline">
					<For each={filteredRoutes}>
						{(route) => (
							<>
								<span
									aria-hidden="true"
									class="text-gray-400 mx-2"
								>
									|
								</span>
								<a
									href={route.path}
									class="text-gray-400 hover:text-white text-sm"
								>
									{route.title}
								</a>
							</>
						)}
					</For>
				</nav>
			</div>
		</footer>
	);
};
