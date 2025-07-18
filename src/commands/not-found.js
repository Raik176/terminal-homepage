export const meta = {
    description: "Redirects you to the 404 not found page",
};

export const handler = () => {
    window.location.href = "/404";
};