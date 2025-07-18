import { createSignal, createEffect, onMount } from "solid-js";
import { Router, Route } from "@solidjs/router";
import { Footer } from "./components/Footer.jsx";
import { routes } from "./routes";
import Themes, {defaultTheme} from "./themes";

function Wrapper(Component, title) {
    return (props) => {
        createEffect(() => {
            document.title = `${title} | RHM`;
        });

        return (
            <div>
                <Component {...props} />
                <Footer/>
            </div>
        )
    };
}

export default function App() {
    const [theme, setTheme] = createSignal(localStorage.getItem('theme') || defaultTheme);

    const applyTheme = (themeName) => {
        const selectedTheme = Themes[themeName];
        if (selectedTheme) {
            for (const [key, value] of Object.entries(selectedTheme)) {
                document.documentElement.style.setProperty(key, value);
            }
            localStorage.setItem('theme', themeName);
        }
    };

    onMount(() => {
        window.addEventListener('set-theme', (e) => {
            setTheme(e.detail);
        });
    });

    createEffect(() => {
        applyTheme(theme());
    });

    return (
        <Router>
            {routes.map(route => (
                <Route
                    path={route.path}
                    component={Wrapper(route.component, route.title)}
                    key={route.path}
                />
            ))}
        </Router>
    );
};