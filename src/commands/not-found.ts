export const meta = {
	description: "Redirects you to the 404 not found page",
} as const;

export const handler = () => {
	window.location.href = "/404";
};
