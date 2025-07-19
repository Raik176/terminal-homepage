export const meta = {
	description: "reboots the website",
} as const;

export const handler = () => {
	window.location.reload();
};
