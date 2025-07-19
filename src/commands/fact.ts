import {Terminal} from "../components/Terminal";

export const meta = {
    description: "print a random (useless) fact",
} as const;

export const handler = async (terminal: Terminal) => {
    const fact = await fetch("https://uselessfacts.jsph.pl/api/v2/facts/random");
    const res = await fact.json();
    terminal.println(res.text);
};