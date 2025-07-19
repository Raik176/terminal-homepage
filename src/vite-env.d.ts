/// <reference types="vite/client" />

interface Window {
	hljs: {
		highlightElement(element: HTMLElement): void;
	};
}
