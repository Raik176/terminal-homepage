import { routes } from "../routes.js";

export function Footer() {
    const filteredRoutes = routes.filter(route => !route.hidden);

    return (
        <footer class="bg-gray-950 w-full fixed bottom-0 p-1">
            <div class="p-1">
                <p
                    class="text-white inline"
                    style="font-family: 'Oswald', sans-serif; font-optical-sizing: auto; font-weight: 350; font-style: normal;">
                    &copy; {new Date().getFullYear()} Right Hand Man.
                </p>

                {filteredRoutes.length > 0 && <span class="text-gray-400 mx-2">|</span>}

                {filteredRoutes.map((route, index) => (
                    <span key={route.path}>
                        <a
                            href={route.path}
                            class="text-gray-400 hover:text-white text-sm"
                            style="font-family: 'Oswald', sans-serif; font-optical-sizing: auto; font-weight: 350; font-style: normal;">
                            {route.title}
                        </a>
                        {index < filteredRoutes.length - 1 && <span class="text-gray-400 mx-2">|</span>}
                    </span>
                ))}
            </div>
        </footer>
    );
}