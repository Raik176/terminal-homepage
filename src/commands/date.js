export const meta = {
    description: "print system date and time",
};

export const handler = (terminal) => {
    terminal.println(new Date().toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZoneName: "short"
    }).replaceAll(",", ""));
};