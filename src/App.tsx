import { createSignal, createEffect, onMount, type Component } from "solid-js";
import { Router, Route } from "@solidjs/router";
import { Footer } from "./components/Footer";
import { routes } from "./routes";
import Themes, { defaultTheme } from "./themes";

function Wrapper(Comp: Component<any>, title: string): Component {
	return (props) => {
		createEffect(() => {
			document.title = `${title} | RHM`;
		});

		return (
			<div>
				<Comp {...props} />
				<Footer />
			</div>
		);
	};
}

const App: Component = () => {
	const [theme, setTheme] = createSignal<string>(
		localStorage.getItem("theme") || defaultTheme
	);

	const applyTheme = (themeName: string) => {
		const selectedTheme = Themes[themeName];
		if (selectedTheme) {
			for (const [key, value] of Object.entries(selectedTheme)) {
				document.documentElement.style.setProperty(key, value);
			}
			localStorage.setItem("theme", themeName);
		}
	};

	onMount(() => {
		const handleThemeChange = (e: Event) => {
			const themeEvent = e as CustomEvent<string>;
			if (themeEvent.detail) {
				setTheme(themeEvent.detail);
			}
		};

		window.addEventListener("set-theme", handleThemeChange);
	});

	createEffect(() => {
		applyTheme(theme());
	});

	return (
		<Router>
			{routes.map((route) => (
				<Route
					path={route.path}
					component={Wrapper(route.component, route.title)}
					key={route.path}
				/>
			))}
		</Router>
	);
};

export default App;
