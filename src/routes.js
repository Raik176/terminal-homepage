import { lazy } from "solid-js";

const Error404 = lazy(() => import("./components/Error404.jsx"));
const PrivacyPolicy = lazy(() => import("./components/PrivacyPolicy.jsx"));
const Disclaimer = lazy(() => import("./components/Disclaimer.jsx"));
const Terminal = lazy(() => import("./components/Terminal.jsx"));

export const routes = [
    {
        path: "/",
        component: Terminal,
        title: "Home"
    },
    {
        path: "/legal/privacy-policy",
        component: PrivacyPolicy,
        title: "Privacy Policy"
    },
    {
        path: "/legal/disclaimer",
        component: Disclaimer,
        title: "Disclaimer"
    },
    {
        path: "/*",
        component: Error404,
        title: "404",
        hidden: true,
    }
];
