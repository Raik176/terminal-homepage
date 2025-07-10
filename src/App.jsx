import {createEffect, lazy} from "solid-js";
import { Router, Route } from "@solidjs/router";
import {Footer} from "./components/Footer.jsx";
import { routes } from "./routes";

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