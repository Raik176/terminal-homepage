export const meta = {
    description: "print a random (useless) fact",
};

export const handler = async (terminal) => {
    const fact = await fetch("https://uselessfacts.jsph.pl/api/v2/facts/random");
    const res = await fact.json();
    terminal.println(res.text);
};