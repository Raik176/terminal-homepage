import {
	Component,
	createSignal,
	For,
	Show,
	createResource,
	createEffect,
	Accessor,
	createMemo,
	JSX,
	on,
} from "solid-js";
import { useSearchParams } from "@solidjs/router";

enum DependencyType {
	API,
	MINECRAFT,
	MAPPINGS,
}

interface MojangVersion {
	id: string;
	type: string;
}

const SCRIPT_LANGUAGES = [
	{
		value: "groovy",
		label: "Groovy",
	},
	{
		value: "kotlin",
		label: "Kotlin",
	},
] as const;

const OUTPUT_TYPES = [
	{ value: "buildscript", label: "Build Script" },
	{ value: "properties", label: "Gradle Properties" },
	{ value: "catalog", label: "Version Catalog" },
] as const;

const LOADER_DEFINITIONS = [
	{
		id: "fabric",
		name: "Fabric",
		icon: "/assets/icons/minecraft/fabric.svg",
		color: "#e0e0e0",
		pluginId: "fabric-loom",
		mavenUrl: "https://maven.fabricmc.net/",
		mavenGroupId: "net.fabricmc",
		mavenArtifactId: "fabric-loom",
	},
	{
		id: "neoforge",
		name: "NeoForge",
		icon: "/assets/icons/minecraft/neoforge.svg",
		color: "#6495ED",
		pluginId: "net.neoforged.gradle.userdev",
		mavenUrl: "https://maven.neoforged.net/releases/",
		mavenGroupId: "net.neoforged.gradle",
		mavenArtifactId: "userdev",
	},
	{
		id: "forge",
		name: "Forge",
		icon: "/assets/icons/minecraft/forge.svg",
		color: "#d0473a",
		pluginId: "net.minecraftforge.gradle",
		mavenUrl: "https://maven.minecraftforge.net/",
		mavenGroupId: "net.minecraftforge.gradle",
		mavenArtifactId: "ForgeGradle",
	},
	{
		id: "quilt",
		name: "Quilt",
		icon: "/assets/icons/minecraft/quilt.svg",
		color: "#8d52a1",
		pluginId: "org.quiltmc.loom",
		mavenUrl: "https://maven.quiltmc.org/repository/release/",
		mavenGroupId: "org.quiltmc",
		mavenArtifactId: "loom",
	},
	{
		id: "legacy-fabric",
		name: "Legacy Fabric",
		icon: "/assets/icons/minecraft/legacy_fabric.svg",
		color: "#D68938",
		pluginId: "legacy-looming",
		mavenUrl: "https://maven.legacyfabric.net/",
		mavenGroupId: "net.legacyfabric",
		mavenArtifactId: "legacy-looming",
	},
] as const;

type ScriptType = (typeof SCRIPT_LANGUAGES)[number]["value"];
type LoaderId = (typeof LOADER_DEFINITIONS)[number]["id"];
type OutputType = (typeof OUTPUT_TYPES)[number]["value"];

const MAPPING_DEFINITIONS = [
	{
		value: "yarn",
		getLabel: () => "Yarn",
		loaders: ["fabric"] as LoaderId[],
	},
	{
		value: "legacy-yarn",
		getLabel: () => "Legacy Yarn",
		loaders: ["legacy-fabric"] as LoaderId[],
	},
	{
		value: "quilt",
		getLabel: () => "Quilt Mappings",
		loaders: ["quilt"] as LoaderId[],
	},
	{
		value: "mojang",
		getLabel: (loader: LoaderId) =>
			loader === "quilt" ? "Mojang (Layered)" : "Mojang",
		loaders: ["fabric", "quilt"] as LoaderId[],
	},
];

type MappingType = (typeof MAPPING_DEFINITIONS)[number]["value"];

interface ApiDefinition {
	id: string;
	getMavenId: (loaderId: LoaderId) => string;
	mavenUrl?: string;
	color: string;
}

interface Api extends ApiDefinition {
	title: string;
	description: string;
	icon_url: string;
	slug: string;
}

interface BuildDependency {
	type: DependencyType;
	group: string;
	name: string;
	version?: string;
}

interface CatalogVersion {
	alias: string;
	version: string;
}

interface CatalogLibrary {
	alias: string;
	group: string;
	name: string;
	versionRef: string;
}

interface CatalogPlugin {
	alias: string;
	id: string;
	versionRef: string;
}

interface BuildConfiguration {
	repositories: Set<string>;
	plugins: { id: string; version?: string; versionRef?: string }[];
	dependencies: BuildDependency[];
	mappingsDependency?: { type: "string" | "method"; value: string };
	catalog: {
		versions: CatalogVersion[];
		libraries: string[];
		plugins: string[];
	};
}

const API_DEFINITIONS: ApiDefinition[] = [
	{
		id: "P7dR8mSH", // Fabric API
		getMavenId: () => "net.fabricmc.fabric-api:fabric-api",
		mavenUrl: "https://maven.fabricmc.net/",
		color: "#296d98",
	},
	{
		id: "mOgUt4GM", // Mod Menu
		getMavenId: () => "com.terraformersmc:modmenu",
		mavenUrl: "https://maven.terraformersmc.com/releases/",
		color: "#f9a600",
	},
	{
		id: "9s6osm5g", // Cloth Config
		getMavenId: (loader) => `me.shedaniel.cloth:cloth-config-${loader}`,
		mavenUrl: "https://maven.shedaniel.me/",
		color: "#a56de2",
	},
	{
		id: "lhGA9TYQ", // Architectury API
		getMavenId: (loader) => `dev.architectury:architectury-${loader}`,
		mavenUrl: "https://maven.architectury.dev/",
		color: "#d14b3a",
	},
	{
		id: "qvIfYCYJ", // Quilted Fabric API
		getMavenId: () => "org.quiltmc.quilted-fabric-api:quilted-fabric-api",
		mavenUrl: "https://maven.quiltmc.org/repository/release/",
		color: "#4f559c",
	},
	{
		id: "9CJED7xi", // Legacy Fabric API
		getMavenId: () =>
			"net.legacyfabric.legacy-fabric-api:legacy-fabric-api",
		mavenUrl: "https://maven.legacyfabric.net/",
		color: "#A0522D",
	},
];

const PROXY_URL = "https://corsproxy.io/?";

const fetchJson = async <T,>(url: string): Promise<T | null> => {
	try {
		const res = await fetch(url);
		return res.ok ? ((await res.json()) as T) : null;
	} catch (error) {
		console.error(`Failed to fetch JSON from ${url}:`, error);
		return null;
	}
};

const fetchPluginVersion = async (
	loader: (typeof LOADER_DEFINITIONS)[number]
): Promise<string | null> => {
	try {
		const groupIdPath = loader.mavenGroupId.replace(/\./g, "/");
		const metadataUrl = `${loader.mavenUrl}${groupIdPath}/${loader.mavenArtifactId}/maven-metadata.xml`;

		const response = await fetch(
			`${PROXY_URL}${encodeURIComponent(metadataUrl)}`
		);

		if (!response.ok) {
			console.error(
				`Failed to fetch maven metadata for ${loader.name}. Status: ${response.status}`
			);
			return null;
		}

		const xmlText = await response.text();
		const releaseMatch = /<release>(.*?)<\/release>/.exec(xmlText);
		if (releaseMatch && releaseMatch[1]) {
			return releaseMatch[1];
		}

		const latestMatch = /<latest>(.*?)<\/latest>/.exec(xmlText);
		if (latestMatch && latestMatch[1]) {
			return latestMatch[1];
		}

		console.error(
			`Could not find a version in metadata for ${loader.name}`
		);
		return null;
	} catch (e) {
		console.error(
			`Failed to fetch or parse plugin version for ${loader.name}`,
			e
		);
		return null;
	}
};

const fetchModrinthProjects = async (ids: string[]) => {
	const data = await fetchJson<any[]>(
		`https://api.modrinth.com/v2/projects?ids=${JSON.stringify(ids)}`
	);
	return data?.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}) || {};
};

const fetchModrinthVersions = async (
	apis: Api[],
	mcVersion: string,
	loader: LoaderId
): Promise<Record<string, string>> => {
	const versionPromises = apis.map(async (api) => {
		const versions = await fetchJson<{ version_number: string }[]>(
			`https://api.modrinth.com/v2/project/${
				api.id
			}/version?loaders=["${loader}"]&game_versions=["${mcVersion}"]`
		);
		return {
			id: api.id,
			version: versions?.[0]?.version_number || "N/A",
		};
	});
	const results = await Promise.all(versionPromises);
	return results.reduce(
		(acc, { id, version }) => ({ ...acc, [id]: version }),
		{}
	);
};

const Section: Component<{ title: string; children: JSX.Element }> = (
	props
) => (
	<section class="animate-fade-in">
		<h2
			class="text-xl font-bold mb-4 pb-2 border-b-2 text-[var(--cyan)]"
			style={{
				"border-color": "var(--bright-black)",
				"text-shadow": "0 0 8px var(--cyan_30%)",
			}}
		>
			{props.title}
		</h2>
		{props.children}
	</section>
);

const ClickToCopyUrl: Component<{ url: Accessor<string> }> = (props) => {
	const [showPopup, setShowPopup] = createSignal(false);
	let timeoutId: number;

	const handleCopy = () => {
		clearTimeout(timeoutId);
		navigator.clipboard.writeText(props.url()).then(() => {
			setShowPopup(true);
			timeoutId = setTimeout(() => setShowPopup(false), 1500);
		});
	};

	return (
		<div class="relative inline-block text-center mt-2">
			<div
				class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-[var(--selection-bg)] text-[var(--text-color)] rounded-md shadow-lg text-xs whitespace-nowrap transition-all duration-200 ease-out z-10"
				classList={{
					"opacity-100 translate-y-0": showPopup(),
					"opacity-0 translate-y-2 pointer-events-none": !showPopup(),
				}}
			>
				URL Copied!
				<div
					class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4"
					style={{ "border-top-color": "var(--selection-bg)" }}
				/>
			</div>
			<button
				onClick={handleCopy}
				title="Click to copy URL"
				class="text-xs font-mono p-2 rounded-lg transition-colors bg-[color-mix(in_srgb,var(--background)_80%,var(--bright-black))] text-[var(--bright-black)] hover:text-[var(--text-color)]"
			>
				{props.url()}
			</button>
		</div>
	);
};

const CopyButton: Component<{
	text: string;
	class?: string;
	children: JSX.Element;
}> = (props) => {
	const [label, setLabel] = createSignal(props.children);
	const handleCopy = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		navigator.clipboard.writeText(props.text).then(() => {
			setLabel(<>Copied!</>);
			setTimeout(() => setLabel(props.children), 2000);
		});
	};
	return (
		<button onClick={handleCopy} class={props.class}>
			{label()}
		</button>
	);
};

const OutputSnippet: Component<{
	code: string;
	language: string;
	fileName: string;
	loading?: boolean;
	minHeight?: string;
}> = (props) => {
	const [codeEl, setCodeEl] = createSignal<HTMLElement>();

	createEffect(() => {
		const el = codeEl();
		if (el && !props.loading) {
			el.textContent = props.code;
			el.className = `language-${props.language}`;
			delete el.dataset.highlighted;
			window.hljs.highlightElement(el);
		} else if (el) {
			el.textContent = "";
		}
	});

	return (
		<div class="relative group/snippet font-mono bg-[color-mix(in_srgb,var(--background)_80%,var(--bright-black))] rounded-lg overflow-hidden border border-transparent hover:border-[var(--bright-black)] transition-all">
			<div class="px-4 py-2 flex justify-between items-center bg-[color-mix(in_srgb,var(--background)_60%,var(--bright-black))]">
				{" "}
				<span class="text-xs font-semibold uppercase text-[var(--bright-black)]">
					{props.fileName}{" "}
				</span>
				<CopyButton
					text={props.code}
					class="px-2 py-1 text-xs rounded-md transition-all duration-200 bg-[var(--selection-bg)] text-[var(--text-color)] hover:bg-[var(--bright-black)]"
				>
					<>Copy Script</>
				</CopyButton>
			</div>
			<Show
				when={!props.loading}
				fallback={
					<div
						class="w-full bg-[var(--bright-black)] opacity-20 animate-pulse"
						style={{ height: props.minHeight || "5rem" }}
					/>
				}
			>
				{" "}
				<pre
					class="p-4 overflow-x-auto text-sm"
					style={{ "min-height": props.minHeight || "auto" }}
				>
					<code ref={setCodeEl} />
				</pre>
			</Show>
		</div>
	);
};

const CardCodeSnippet: Component<{
	code: string;
	language: string;
}> = (props) => {
	let codeRef: HTMLElement | undefined;

	createEffect(() => {
		if (codeRef) {
			codeRef.textContent = props.code;
			codeRef.className = `language-${props.language}`;
			delete codeRef.dataset.highlighted;
			window.hljs.highlightElement(codeRef);
		}
	});

	return (
		<div class="relative group/card-snippet font-mono">
			{" "}
			<pre class="p-3 pr-2 rounded-md overflow-x-auto text-sm bg-[rgba(0,0,0,0.2)]">
				<code ref={codeRef} />{" "}
			</pre>
			<div class="absolute top-1.5 right-1.5 flex flex-col gap-1.5 opacity-0 group-hover/card-snippet:opacity-100 transition-opacity">
				<CopyButton
					text={props.code}
					class="px-2 h-6 text-xs rounded-md transition-all duration-200 bg-[var(--selection-bg)] text-[var(--text-color)] hover:bg-[var(--bright-black)]"
				>
					<>Copy</>
				</CopyButton>
			</div>
		</div>
	);
};

const CheckIcon: Component = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 20 20"
		fill="currentColor"
		class="w-3.5 h-3.5"
	>
		<path
			fill-rule="evenodd"
			d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z"
			clip-rule="evenodd"
		/>
	</svg>
);

const SkeletonCard: Component = () => (
	<div class="flex flex-col gap-2 p-4 rounded-xl bg-[color-mix(in_srgb,var(--background)_80%,var(--bright-black))] animate-pulse">
		<div class="flex items-start gap-4">
			<div class="w-12 h-12 rounded-md flex-shrink-0 bg-[var(--bright-black)]" />
			<div class="flex-grow pt-1">
				<div class="h-5 w-3/4 rounded bg-[var(--bright-black)]" />
				<div class="h-3 w-full rounded bg-[var(--bright-black)] mt-2" />
				<div class="h-3 w-2/3 rounded bg-[var(--bright-black)] mt-1" />
			</div>
		</div>
		<div class="mt-auto pt-2">
			<div class="h-10 w-full rounded bg-[var(--bright-black)]" />
		</div>
	</div>
);

const VersionTag: Component<{ version: string }> = (props) => {
	const [showPopup, setShowPopup] = createSignal(false);
	let timeoutId: number;

	const handleCopy = (e: MouseEvent) => {
		e.stopPropagation();
		clearTimeout(timeoutId);
		navigator.clipboard.writeText(props.version).then(() => {
			setShowPopup(true);
			timeoutId = setTimeout(() => setShowPopup(false), 1500);
		});
	};

	return (
		<div class="relative inline-block">
			<div
				class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[var(--selection-bg)] text-[var(--text-color)] rounded-md shadow-lg text-xs whitespace-nowrap transition-all duration-200 ease-out z-10"
				classList={{
					"opacity-100 translate-y-0": showPopup(),
					"opacity-0 translate-y-2 pointer-events-none": !showPopup(),
				}}
			>
				Copied!
				<div
					class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4"
					style={{ "border-top-color": "var(--selection-bg)" }}
				/>
			</div>
			<button
				onClick={handleCopy}
				title="Click to copy version"
				class="text-xs font-mono px-2 py-0.5 rounded-md transition-all duration-200 bg-[color-mix(in_srgb,var(--green)_20%,transparent)] text-[var(--green)] hover:bg-[var(--green)] hover:text-[var(--background)]"
			>
				{props.version}
			</button>
		</div>
	);
};

const ApiCard: Component<{
	mod: Api;
	version: string | undefined;
	selected: boolean;
	onToggle: (id: string) => void;
	scriptType: Accessor<ScriptType>;
	loaderId: Accessor<LoaderId>;
}> = (props) => {
	const modUrl = () =>
		`https://modrinth.com/mod/${props.mod.slug || props.mod.id}`;
	const isAvailable = createMemo(() =>
		Boolean(props.version && props.version !== "N/A")
	);

	const snippet = createMemo(() => {
		if (!isAvailable()) return `// Not available for this MC version`;

		const ver = props.version;
		const depString = `${props.mod.getMavenId(props.loaderId())}:${ver}`;
		return props.scriptType() === "kotlin"
			? `modImplementation("${depString}")`
			: `modImplementation "${depString}"`;
	});

	return (
		<div
			class="group relative flex flex-col gap-2 p-4 rounded-xl border-2 transition-all duration-300"
			classList={{
				"cursor-pointer": isAvailable(),
				"cursor-not-allowed": !isAvailable(),
				"border-[var(--brand-color)] bg-[color-mix(in_srgb,var(--brand-color)_10%,transparent)]":
					props.selected,
				"bg-[color-mix(in_srgb,var(--background)_90%,var(--bright-black))] hover:border-[var(--bright-black)] border-transparent":
					!props.selected,
			}}
			style={{
				"--brand-color": props.mod.color,
				"box-shadow": props.selected
					? `0 0 15px -3px var(--brand-color)`
					: "none",
			}}
			onClick={() => isAvailable() && props.onToggle(props.mod.id)}
		>
			<Show when={!isAvailable()}>
				<div class="absolute inset-0 bg-[var(--background)] opacity-60 rounded-xl z-10" />
				<div class="absolute inset-0 flex items-center justify-center z-20 font-bold text-xs text-center p-2">
					Not Available
				</div>
			</Show>

			<div class="flex items-start gap-4">
				<img
					src={props.mod.icon_url || "/assets/icons/unknown.svg"}
					alt={`${props.mod.title} icon`}
					class="w-12 h-12 rounded-md flex-shrink-0 object-cover bg-[color-mix(in_srgb,var(--bright-black)_20%,var(--background))] p-1"
				/>
				<div class="flex-grow">
					<div class="flex justify-between items-center mb-1">
						<div class="flex items-center gap-2 flex-wrap">
							<h4
								class="text-lg font-bold transition-colors duration-300"
								style={{ color: "var(--text-color)" }}
							>
								<a
									href={modUrl()}
									target="_blank"
									rel="noopener noreferrer"
									class="hover:underline hover:text-[var(--brand-color)]"
									onClick={(e) => e.stopPropagation()}
								>
									{props.mod.title}
								</a>
							</h4>
							<Show when={isAvailable() && props.version}>
								<VersionTag version={props.version!} />
							</Show>
						</div>
						<div
							class="w-5 h-5 border-2 rounded-full flex-shrink-0 transition-all flex items-center justify-center text-white"
							classList={{
								"border-[var(--brand-color)] bg-[var(--brand-color)]":
									props.selected,
								"border-[var(--bright-black)] group-hover:border-[var(--text-color)]":
									!props.selected,
							}}
						>
							<Show when={props.selected}>
								<CheckIcon />
							</Show>
						</div>
					</div>
					<p
						class="text-sm my-1"
						style={{ color: "var(--bright-black)" }}
					>
						{props.mod.description}
					</p>
				</div>
			</div>
			<div class="mt-auto">
				<CardCodeSnippet
					code={snippet()}
					language={props.scriptType()}
				/>
			</div>
		</div>
	);
};

const toCamelCase = (str: string) =>
	str.replace(/([-_][a-z])/gi, ($1) =>
		$1.toUpperCase().replace("-", "").replace("_", "")
	);

function getConfigurationName(type: DependencyType, loader: LoaderId): string {
	switch (type) {
		case DependencyType.API:
			return loader === "forge" || loader === "neoforge"
				? "implementation"
				: "modImplementation";

		case DependencyType.MAPPINGS:
			return "mappings";

		case DependencyType.MINECRAFT:
			return "minecraft";

		default:
			return "implementation";
	}
}

function resolveDependency(
	dep: BuildDependency,
	loader: LoaderId,
	dsl: ScriptType
): string {
	const configName = getConfigurationName(dep.type, loader);
	const depId = `${dep.group}:${dep.name}:${dep.version}`;

	const quote = dsl === "kotlin" ? '"' : "'";
	let depValue = `${quote}${depId}${quote}`;

	if (loader === "forge" && dep.type === DependencyType.API) {
		depValue = `fg.deobf(${depValue})`;
	}

	return dsl === "kotlin"
		? `${configName}(${depValue})`
		: `${configName} ${depValue}`;
}

const generateBuildScript = (
	config: BuildConfiguration,
	dsl: ScriptType,
	loaderId: LoaderId
): string => {
	const isKotlin = dsl === "kotlin";
	const quote = (s: string) => (isKotlin ? `"${s}"` : `'${s}'`);
	const uri = (s: string) => (isKotlin ? `uri(${quote(s)})` : quote(s));
	const version = (v: string) => `version ${quote(v)}`;
	const versionRef = (vr: string) => `version.ref = ${quote(vr)}`;

	const pluginLines = config.plugins
		.map((p) => {
			const ver = p.version
				? version(p.version)
				: p.versionRef
					? versionRef(p.versionRef)
					: "";
			const id = isKotlin ? `id(${quote(p.id)})` : `id ${quote(p.id)}`;
			return `\t${id} ${ver}`;
		})
		.join("\n");
	const pluginsBlock = `plugins {\n${pluginLines}\n}`;

	const repoLines = Array.from(config.repositories)
		.map((url) => `\tmaven { url = ${uri(url)} }`)
		.join("\n");
	const reposBlock = `repositories {\n\tmavenCentral()${config.repositories.size > 0 ? "\n" + repoLines : ""}\n}`;

	let mappingLine = "";
	if (config.mappingsDependency) {
		const value =
			config.mappingsDependency.type === "string"
				? quote(config.mappingsDependency.value)
				: config.mappingsDependency.value;

		if (isKotlin) {
			mappingLine = `\tmappings(${value})`;
		} else {
			mappingLine = `\tmappings ${value}`;
		}
	}

	const depLines = config.dependencies
		.map((d) => `\t${resolveDependency(d, loaderId, dsl)}`)
		.join("\n");

	const allDepLines = [mappingLine, depLines].filter(Boolean).join("\n");
	const depsBlock = `dependencies {\n${allDepLines || ""}\n}`;

	return [pluginsBlock, reposBlock, depsBlock].filter(Boolean).join("\n\n");
};

const generateProperties = (config: BuildConfiguration): string => {
	const lines = config.dependencies
		.filter((d) => d.version && d.type === DependencyType.API)
		.map((d) => {
			return `${d.name.replace(/\./g, "-")}.version = ${d.version}`;
		});

	if (config.mappingsDependency?.type === "string") {
		const parts = config.mappingsDependency.value.split(":");
		if (parts.length >= 3) {
			const name = parts[1];
			const version = parts[2];
			lines.push(`${name.replace(/\./g, "-")}.version = ${version}`);
		}
	}

	return lines.length > 0 ? lines.join("\n") : "";
};

const generateCatalog = (config: BuildConfiguration): string => {
	const pluginIdToLoaderIdMap = LOADER_DEFINITIONS.reduce(
		(acc, loader) => {
			acc[loader.pluginId] = loader.id;
			return acc;
		},
		{} as Record<string, LoaderId>
	);

	const plugins: CatalogPlugin[] = config.plugins.map((plugin) => ({
		alias: toCamelCase(pluginIdToLoaderIdMap[plugin.id] ?? plugin.id),
		id: plugin.id,
		versionRef: plugin.id,
	}));

	const dependencyVersions: CatalogVersion[] = [];
	const libraries: CatalogLibrary[] = [];

	config.dependencies
		.filter((d) => d.version && d.type === DependencyType.API)
		.forEach((d) => {
			const alias = d.name.replace(/\./g, "-");

			dependencyVersions.push({ alias: alias, version: d.version! });
			libraries.push({
				alias: alias,
				group: d.group,
				name: d.name,
				versionRef: alias,
			});
		});

	if (config.mappingsDependency?.type === "string") {
		const parts = config.mappingsDependency.value.split(":");
		if (parts.length >= 3) {
			const group = parts[0];
			const name = parts[1];
			const version = parts[2];
			const alias = name.replace(/\./g, "-");

			dependencyVersions.push({ alias, version });
			libraries.push({
				alias,
				group,
				name,
				versionRef: alias,
			});
		}
	}

	const versions = [...config.catalog.versions, ...dependencyVersions];

	if (versions.length === 0) return "";

	const parts: string[] = [];
	parts.push(
		`[versions]\n${versions
			.map((v) => `${v.alias} = "${v.version}"`)
			.join("\n")}`
	);
	if (libraries.length > 0) {
		parts.push(
			`[libraries]\n${libraries
				.map(
					(l) =>
						`${l.alias} = { group = "${l.group}", name = "${l.name}", version.ref = "${l.versionRef}" }`
				)
				.join("\n")}`
		);
	}
	if (plugins.length > 0) {
		parts.push(
			`[plugins]\n${plugins
				.map(
					(p) =>
						`${p.alias} = { id = "${p.id}", version.ref = "${p.versionRef}" }`
				)
				.join("\n")}`
		);
	}

	return parts.join("\n\n");
};

const Minecraft: Component = () => {
	const [searchParams] = useSearchParams();

	const [rawMcVersions] = createResource(() =>
		fetchJson<{ versions: MojangVersion[] }>(
			"https://launchermeta.mojang.com/mc/game/version_manifest_v2.json"
		).then((data) => data?.versions || [])
	);

	const [showAllVersions, setShowAllVersions] = createSignal(
		searchParams.all_versions === "true"
	);

	const [mcVersions] = createResource(rawMcVersions, (versions) => {
		if (showAllVersions()) {
			return versions.map((v) => ({
				version: v.id,
				stable: v.type === "release",
			}));
		}
		return versions
			.filter((v) => v.type === "release")
			.map((v) => ({ version: v.id, stable: true }));
	});

	const [preferredMcVersion, setPreferredMcVersion] = createSignal(
		Array.isArray(searchParams.mc)
			? searchParams.mc[0]
			: (searchParams.mc ?? "")
	);

	const selectedMcVersion = createMemo(() => {
		if (mcVersions.loading) return undefined;
		const versions = mcVersions();
		if (!versions || versions.length === 0) return undefined;

		const preferred = preferredMcVersion();
		const validVersions = versions.map((v) => v.version);

		if (preferred && validVersions.includes(preferred)) {
			return preferred;
		}

		return versions[0].version;
	});

	const [fabricLoaderVersion] = createResource(async () => {
		const data = await fetchJson<
			{
				version: string;
			}[]
		>("https://meta.fabricmc.net/v2/versions/loader");
		return data?.[0]?.version || "N/A";
	});

	const [quiltLoaderVersion] = createResource(async () => {
		const data = await fetchJson<
			{
				version: string;
			}[]
		>("https://meta.quiltmc.org/v3/versions/loader");
		return data?.[0]?.version || "N/A";
	});

	const [quiltMappingsVersion] = createResource(
		selectedMcVersion,
		async (mcVersion) => {
			if (!mcVersion) return "N/A";
			const data = await fetchJson<
				{
					version: string;
				}[]
			>(
				`https://meta.quiltmc.org/v3/versions/quilt-mappings/${mcVersion}`
			);
			return data?.[0]?.version || "N/A";
		}
	);

	const [loaderPluginVersions] = createResource(async () => {
		const versions = await Promise.all(
			LOADER_DEFINITIONS.map((loader) => fetchPluginVersion(loader))
		);
		return LOADER_DEFINITIONS.reduce(
			(acc, loader, index) => {
				acc[loader.id] = versions[index] ?? "N/A";
				return acc;
			},
			{} as Record<LoaderId, string>
		);
	});

	const [loaderAvailability] = createResource(
		selectedMcVersion,
		async (mcVersion) => {
			if (!mcVersion)
				return {
					fabric: false,
					neoforge: false,
					forge: false,
					quilt: false,
					"legacy-fabric": false,
				};

			const formatNeoForgeVersion = (mcVersion: string): string => {
				const parts = mcVersion.split(".");
				if (parts.length >= 2) {
					const minor = parts[1];
					const patch = parts.length > 2 ? parts[2] : "0";
					return `${minor}.${patch}`;
				}
				return mcVersion;
			};

			const fetchXmlAndCheck = async (url: string, prefix: string) => {
				try {
					const proxiedUrl = `${PROXY_URL}${encodeURIComponent(url)}`;
					const response = await fetch(proxiedUrl);
					if (!response.ok) return false;
					const xmlText = await response.text();
					const versions = [
						...xmlText.matchAll(/<version>(.*?)<\/version>/g),
					].map((m) => m[1]);
					return versions.some((v) => v.startsWith(prefix));
				} catch (e) {
					console.error(
						`Failed to check availability for ${prefix}`,
						e
					);
					return false;
				}
			};

			const neoforgeVersionPrefix = formatNeoForgeVersion(mcVersion);

			const [
				fabricLoaders,
				forgeAvailable,
				neoforgeAvailable,
				quiltLoaders,
				legacyFabricLoaders,
			] = await Promise.all([
				fetchJson<{ loader: { separator: string } }[]>(
					`https://meta.fabricmc.net/v2/versions/loader/${mcVersion}`
				),
				fetchXmlAndCheck(
					"https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml",
					mcVersion
				),
				fetchXmlAndCheck(
					"https://maven.neoforged.net/releases/net/neoforged/neoforge/maven-metadata.xml",
					neoforgeVersionPrefix
				),
				fetchJson<{ loader: { separator: string } }[]>(
					`https://meta.quiltmc.org/v3/versions/loader/${mcVersion}`
				),
				fetchJson<{ loader: { separator: string } }[]>(
					`https://meta.legacyfabric.net/v2/versions/loader/${mcVersion}`
				),
			]);

			return {
				fabric: (fabricLoaders || []).length > 0,
				neoforge: neoforgeAvailable,
				forge: forgeAvailable,
				quilt: (quiltLoaders || []).length > 0,
				"legacy-fabric": (legacyFabricLoaders || []).length > 0,
			};
		}
	);

	const [legacyYarnVersion] = createResource(
		selectedMcVersion,
		async (mcVersion) => {
			if (!mcVersion) return "N/A";
			const data = await fetchJson<{ version: string }[]>(
				`https://meta.legacyfabric.net/v2/versions/yarn/${mcVersion}`
			);
			return data?.[0]?.version || "N/A";
		}
	);

	const [yarnVersion] = createResource(
		selectedMcVersion,
		async (mcVersion) => {
			if (!mcVersion) return "N/A";
			const data = await fetchJson<{ version: string }[]>(
				`https://meta.fabricmc.net/v2/versions/yarn/${mcVersion}`
			);
			return data?.[0]?.version || "N/A";
		}
	);

	const [legacyFabricLoaderVersion] = createResource(async () => {
		const data = await fetchJson<{ version: string }[]>(
			"https://meta.legacyfabric.net/v2/versions/loader"
		);
		return data?.[0]?.version || "N/A";
	});

	const [selectedLoaderId, setSelectedLoaderId] = createSignal<LoaderId>(
		(searchParams.loader as LoaderId) || "fabric"
	);
	const [scriptType, setScriptType] = createSignal<ScriptType>(
		(searchParams.dsl as ScriptType) || "groovy"
	);
	const [mappingType, setMappingType] = createSignal<MappingType>(
		(searchParams.mapping as MappingType) || "yarn"
	);
	const [selectedApis, setSelectedApis] = createSignal(
		new Set<string>(
			(Array.isArray(searchParams.apis)
				? searchParams.apis
				: searchParams.apis?.split(",") || []
			).filter(Boolean)
		)
	);
	const [outputType, setOutputType] = createSignal<OutputType>(
		(searchParams.output as OutputType) || "buildscript"
	);

	const availableMappings = createMemo(() => {
		const loader = selectedLoaderId();
		return MAPPING_DEFINITIONS.filter((m) => m.loaders.includes(loader));
	});

	createEffect(
		on(selectedLoaderId, () => {
			const currentMapping = mappingType();
			const available = availableMappings();
			if (!available.some((m) => m.value === currentMapping)) {
				if (available.length > 0) {
					setMappingType(available[0].value as MappingType);
				}
			}
		})
	);

	const [modProjectData] = createResource(() =>
		fetchModrinthProjects(API_DEFINITIONS.map((m) => m.id))
	);

	const shareableUrl = createMemo(() => {
		const mc = selectedMcVersion();
		if (!mc) return `${window.location.origin}${window.location.pathname}`;

		const params = new URLSearchParams();
		params.set("mc", mc);
		params.set("loader", selectedLoaderId());
		params.set("dsl", scriptType());
		params.set("output", outputType());
		if (selectedLoaderId() === "fabric" || selectedLoaderId() === "quilt") {
			params.set("mapping", mappingType());
		}
		const apis = Array.from(selectedApis()).sort().join(",");
		if (apis) {
			params.set("apis", apis);
		}
		if (showAllVersions()) {
			params.set("all_versions", "true");
		}
		return `${window.location.origin}${
			window.location.pathname
		}?${params.toString()}`;
	});

	createEffect(() => {
		const url = shareableUrl();
		if (selectedMcVersion() && url !== window.location.href) {
			window.history.replaceState({}, "", url);
		}
	});

	createEffect(() => {
		const availability = loaderAvailability();
		if (availability && !availability[selectedLoaderId()]) {
			const firstAvailable = LOADER_DEFINITIONS.find(
				(l) => availability[l.id]
			);
			if (firstAvailable) {
				setSelectedLoaderId(firstAvailable.id);
			}
		}
	});

	const availableApis = createMemo<Api[]>((): Api[] => {
		const loaderId = selectedLoaderId();
		const projects = modProjectData();
		if (!loaderId || !projects) return [];

		return API_DEFINITIONS.map((modDef) => {
			const projectInfo = projects[modDef.id];
			return {
				...modDef,
				...(projectInfo || {
					title: "Loading...",
					description: "",
					icon_url: "",
					slug: modDef.id,
					loaders: [],
				}),
			};
		}).filter((mod) => mod.loaders?.includes(loaderId));
	});

	const [apiVersions] = createResource(
		() =>
			[availableApis(), selectedMcVersion(), selectedLoaderId()] as const,
		([apis, mcVersion, loaderId]) => {
			if (!mcVersion || !loaderId || !apis || apis.length === 0) {
				return {} as Record<string, string>;
			}
			return fetchModrinthVersions(apis, mcVersion, loaderId);
		}
	);

	createEffect(
		on([selectedLoaderId, selectedMcVersion], () => {
			setSelectedApis(new Set<string>());
		})
	);

	const handleToggleApi = (id: string) => {
		setSelectedApis((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	// --- BUILDER: Populates the common format based on selections ---
	const buildConfiguration = createMemo((): BuildConfiguration => {
		const config: BuildConfiguration = {
			repositories: new Set(),
			plugins: [],
			dependencies: [],
			catalog: { versions: [], libraries: [], plugins: [] },
		};

		const loader = LOADER_DEFINITIONS.find(
			(l) => l.id === selectedLoaderId()
		);
		if (!loader) return config;

		if (loader.id === "legacy-fabric") {
			const mcVer = selectedMcVersion();
			const loaderVer = legacyFabricLoaderVersion();
			const yarnVer = legacyYarnVersion();

			if (mcVer) {
				config.dependencies.push({
					type: DependencyType.MINECRAFT,
					group: "com.mojang",
					name: "minecraft",
					version: mcVer,
				});
			}

			if (yarnVer && yarnVer !== "N/A" && mcVer) {
				const yarnBuild = yarnVer.split("+build.")[1];
				if (yarnBuild) {
					config.mappingsDependency = {
						type: "method",
						value: `legacy.yarn("${mcVer}", "${yarnBuild}")`,
					};
				}
			}

			if (loaderVer && loaderVer !== "N/A") {
				config.dependencies.push({
					type: DependencyType.API,
					group: "net.fabricmc",
					name: "fabric-loader",
					version: loaderVer,
				});
			}
		}

		const pluginVersion = loaderPluginVersions()?.[loader.id];
		if (pluginVersion && pluginVersion !== "N/A") {
			if (loader.id === "legacy-fabric") {
				config.plugins.push({
					id: "fabric-loom",
					version: pluginVersion,
				});
			}
			config.plugins.push({
				id: loader.pluginId,
				version: pluginVersion,
			});

			const alias = loader.pluginId;
			config.catalog.versions.push({
				alias: alias,
				version: pluginVersion,
			});
		}

		if (loader.id === "fabric") {
			const mcVer = selectedMcVersion();
			const loaderVer = fabricLoaderVersion();

			if (mcVer) {
				config.dependencies.push({
					type: DependencyType.MINECRAFT,
					group: "com.mojang",
					name: "minecraft",
					version: mcVer,
				});
			}
			if (mappingType() === "yarn") {
				const yarnVer = yarnVersion();
				if (yarnVer && yarnVer !== "N/A") {
					config.mappingsDependency = {
						type: "string",
						value: `net.fabricmc:yarn:${yarnVer}:v2`,
					};
				}
			} else if (mappingType() === "mojang") {
				config.mappingsDependency = {
					type: "method",
					value: "loom.officialMojangMappings()",
				};
			}

			if (loaderVer && loaderVer !== "N/A") {
				config.dependencies.push({
					type: DependencyType.API,
					group: "net.fabricmc",
					name: "fabric-loader",
					version: loaderVer,
				});
			}
		} else if (loader.id === "quilt") {
			const mcVer = selectedMcVersion();
			const loaderVer = quiltLoaderVersion();

			if (mcVer) {
				config.dependencies.push({
					type: DependencyType.MINECRAFT,
					group: "com.mojang",
					name: "minecraft",
					version: mcVer,
				});
			}

			const qmVer = quiltMappingsVersion();
			if (qmVer && qmVer !== "N/A") {
				const mappingString = `org.quiltmc:quilt-mappings:${qmVer}:intermediary-v2`;

				if (mappingType() === "quilt") {
					config.mappingsDependency = {
						type: "string",
						value: mappingString,
					};
				} else if (mappingType() === "mojang") {
					const isKotlin = scriptType() === "kotlin";
					const quote = isKotlin ? '"' : "'";

					const layeredValue = isKotlin
						? `loom.layered {\n\t\tmappings(${quote}${mappingString}${quote})\n\t\tofficialMojangMappings()\n\t}`
						: `loom.layered {\n\t\tmappings ${quote}${mappingString}${quote}\n\t\tofficialMojangMappings()\n\t}`;

					config.mappingsDependency = {
						type: "method",
						value: layeredValue,
					};
				}
			}

			if (loaderVer && loaderVer !== "N/A") {
				config.dependencies.push({
					type: DependencyType.API,
					group: "org.quiltmc",
					name: "quilt-loader",
					version: loaderVer,
				});
			}
		}

		selectedApis().forEach((apiId) => {
			const api = availableApis().find((a) => a.id === apiId);
			let version = apiVersions()?.[apiId];
			if (!api || !version || version === "N/A") return;

			if (api.id === "lhGA9TYQ" || api.id === "9s6osm5g") {
				version = version.split("+")[0];
			}

			if (api.mavenUrl) config.repositories.add(api.mavenUrl);

			const [group, name] = api.getMavenId(loader.id).split(":");

			config.dependencies.push({
				type: DependencyType.API,
				group,
				name,
				version,
			});
		});

		return config;
	});

	const outputSnippet = createMemo(() => {
		const isLoading =
			mcVersions.loading ||
			loaderPluginVersions.loading ||
			apiVersions.loading ||
			!selectedMcVersion() ||
			(selectedLoaderId() === "fabric" &&
				(yarnVersion.loading || fabricLoaderVersion.loading)) ||
			(selectedLoaderId() === "quilt" &&
				(quiltLoaderVersion.loading || quiltMappingsVersion.loading));

		if (isLoading) return `// Loading...`;

		const config = buildConfiguration();

		switch (outputType()) {
			case "buildscript":
				return generateBuildScript(
					config,
					scriptType(),
					selectedLoaderId()
				);
			case "properties":
				return generateProperties(config);
			case "catalog":
				return generateCatalog(config);
			default:
				return "// Invalid output type";
		}
	});

	const outputLanguage = createMemo(() => {
		switch (outputType()) {
			case "buildscript":
				return scriptType();
			case "properties":
				return "ini";
			case "catalog":
				return "toml";
		}
	});

	const outputFileName = createMemo(() => {
		switch (outputType()) {
			case "buildscript":
				return scriptType() === "kotlin"
					? "build.gradle.kts"
					: "build.gradle";
			case "properties":
				return "gradle.properties";
			case "catalog":
				return "libs.versions.toml";
		}
	});

	return (
		<main
			class="p-4 sm:p-8 w-full min-h-full"
			style={{
				"background-color": "var(--background)",
				color: "var(--text-color)",
				"font-family": "'Roboto Mono', monospace",
			}}
		>
			<div class="max-w-7xl mx-auto">
				<header class="text-center mb-12 animate-fade-in">
					<h1
						class="text-4xl sm:text-5xl font-bold mb-3"
						style={{
							color: "var(--green)",
							"text-shadow": "0 0 15px var(--green_40%)",
						}}
					>
						Minecraft Modding Dependencies
					</h1>
					<p class="mb-4" style={{ color: "var(--bright-black)" }}>
						A simple tool to get the latest dependency versions for
						your project.
					</p>
					<ClickToCopyUrl url={shareableUrl} />
				</header>

				<div class="grid lg:grid-cols-12 gap-8 items-start">
					<div class="lg:col-span-4 flex flex-col gap-8 sticky top-8">
						<Section title="1. Configure Project">
							<div class="flex flex-col gap-6">
								<div>
									<label class="text-sm font-bold mb-2 block">
										<div class="flex justify-between items-center">
											<span>Minecraft Version</span>
											<div class="flex items-center gap-1.5">
												<label
													for="all-versions-toggle"
													class="text-xs text-[var(--bright-black)] cursor-pointer select-none"
												>
													Show Snapshots
												</label>
												<input
													type="checkbox"
													id="all-versions-toggle"
													checked={showAllVersions()}
													onChange={(e) =>
														setShowAllVersions(
															e.currentTarget
																.checked
														)
													}
													class="w-4 h-4 rounded bg-[var(--bright-black)] border-none focus:ring-2 focus:ring-[var(--green)] cursor-pointer"
												/>
											</div>
										</div>
									</label>
									<div class="relative">
										<Show
											when={!rawMcVersions.loading}
											fallback={
												<div class="w-full h-[44px] rounded-lg bg-[color-mix(in_srgb,var(--background)_80%,var(--bright-black))] animate-pulse" />
											}
										>
											<select
												value={
													selectedMcVersion() ?? ""
												}
												onChange={(e) =>
													setPreferredMcVersion(
														e.currentTarget.value
													)
												}
												class="w-full px-3 py-2 mt-2 rounded-lg border-2 border-[var(--bright-black)] bg-[var(--background)] text-[var(--text-color)] focus:border-[var(--green)] focus:outline-none transition-colors appearance-none pr-8"
											>
												<For each={mcVersions()}>
													{(v) => (
														<option
															value={v.version}
															style={{
																"background-color":
																	"var(--background)",
																color: "var(--text-color)",
															}}
														>
															{v.version}
														</option>
													)}
												</For>
											</select>
											<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[var(--text-color)]">
												<svg
													class="fill-current h-4 w-4"
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 20 20"
												>
													<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
												</svg>
											</div>
										</Show>
									</div>
								</div>
								<div>
									<label class="text-sm font-bold mb-2 block">
										Mod Loader
									</label>
									<div class="grid grid-cols-2 md:grid-cols-3 gap-2">
										<For each={LOADER_DEFINITIONS}>
											{(loader) => {
												const isAvailable = () =>
													!loaderAvailability.loading &&
													(loaderAvailability()?.[
														loader.id
													] ??
														false);
												return (
													<button
														onClick={() =>
															setSelectedLoaderId(
																loader.id
															)
														}
														disabled={
															!isAvailable()
														}
														class="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all"
														style={{
															"--brand-color":
																loader.color,
														}}
														classList={{
															"border-[var(--brand-color)] bg-[color-mix(in_srgb,var(--brand-color)_10%,transparent)]":
																selectedLoaderId() ===
																loader.id,
															"border-transparent bg-[color-mix(in_srgb,var(--background)_90%,var(--bright-black))] hover:border-[var(--bright-black)]":
																selectedLoaderId() !==
																loader.id,
															"opacity-40 cursor-not-allowed":
																!isAvailable(),
														}}
													>
														<img
															src={loader.icon}
															alt={`${loader.name} logo`}
															class="w-8 h-8"
														/>
														<span class="text-xs font-semibold">
															{" "}
															{loader.name}{" "}
														</span>
													</button>
												);
											}}
										</For>
									</div>
								</div>
								<Show
									when={
										selectedLoaderId() === "fabric" ||
										selectedLoaderId() === "quilt" ||
										selectedLoaderId() === "legacy-fabric"
									}
								>
									<div>
										<label class="text-sm font-bold mb-2 block">
											Mappings
										</label>
										<div class="flex gap-1 p-1 rounded-lg bg-[color-mix(in_srgb,var(--background)_80%,var(--bright-black))]">
											<For each={availableMappings()}>
												{(option) => (
													<button
														onClick={() =>
															setMappingType(
																option.value
															)
														}
														class="px-4 py-1.5 text-sm font-semibold rounded-md transition-colors flex-1"
														classList={{
															"bg-[var(--selection-bg)] text-[var(--text-color)]":
																mappingType() ===
																option.value,
															"text-[var(--bright-black)] hover:text-white":
																mappingType() !==
																option.value,
														}}
													>
														{option.getLabel(
															selectedLoaderId()
														)}
													</button>
												)}
											</For>
										</div>
									</div>
								</Show>
								<div>
									<label class="text-sm font-bold mb-2 block">
										Output Format
									</label>
									<div class="flex gap-1 p-1 rounded-lg bg-[color-mix(in_srgb,var(--background)_80%,var(--bright-black))]">
										<For each={OUTPUT_TYPES}>
											{(option) => (
												<button
													onClick={() =>
														setOutputType(
															option.value
														)
													}
													class="px-4 py-1.5 text-sm font-semibold rounded-md transition-colors flex-1"
													classList={{
														"bg-[var(--selection-bg)] text-[var(--text-color)]":
															outputType() ===
															option.value,
														"text-[var(--bright-black)] hover:text-white":
															outputType() !==
															option.value,
													}}
												>
													{option.label}
												</button>
											)}
										</For>
									</div>
								</div>
								<Show when={outputType() === "buildscript"}>
									<div>
										<label class="text-sm font-bold mb-2 block">
											Build Script DSL
										</label>
										<div class="flex gap-1 p-1 rounded-lg bg-[color-mix(in_srgb,var(--background)_80%,var(--bright-black))]">
											<For each={SCRIPT_LANGUAGES}>
												{(option) => (
													<button
														onClick={() =>
															setScriptType(
																option.value
															)
														}
														class="px-4 py-1.5 text-sm font-semibold rounded-md transition-colors flex-1"
														classList={{
															"bg-[var(--selection-bg)] text-[var(--text-color)]":
																scriptType() ===
																option.value,
															"text-[var(--bright-black)] hover:text-white":
																scriptType() !==
																option.value,
														}}
													>
														{option.label}
													</button>
												)}
											</For>
										</div>
									</div>
								</Show>
							</div>
						</Section>
						<Section title="3. Get Build Script">
							<OutputSnippet
								code={outputSnippet()}
								language={outputLanguage()}
								fileName={outputFileName()}
								loading={
									loaderPluginVersions.loading ||
									apiVersions.loading ||
									yarnVersion.loading ||
									quiltLoaderVersion.loading ||
									quiltMappingsVersion.loading ||
									legacyFabricLoaderVersion.loading ||
									legacyYarnVersion.loading ||
									loaderAvailability.loading
								}
								minHeight="16rem"
							/>
						</Section>
					</div>

					<div class="lg:col-span-8">
						<Section title="2. Select API Dependencies">
							<Show
								when={
									!modProjectData.loading &&
									!apiVersions.loading
								}
								fallback={
									<div class="grid xl:grid-cols-2 gap-4">
										<SkeletonCard />
										<SkeletonCard />
										<SkeletonCard />
										<SkeletonCard />
									</div>
								}
							>
								<div class="grid xl:grid-cols-2 gap-4">
									<For
										each={availableApis()}
										fallback={
											<div
												class="xl:col-span-2 h-48 flex items-center justify-center text-center border-2 border-dashed rounded-lg"
												style={{
													"border-color":
														"var(--bright-black)",
												}}
											>
												<p
													style={{
														color: "var(--bright-black)",
													}}
												>
													No common APIs listed for
													this loader.
												</p>
											</div>
										}
									>
										{(mod) => (
											<ApiCard
												mod={mod}
												version={
													apiVersions()?.[mod.id]
												}
												selected={selectedApis().has(
													mod.id
												)}
												onToggle={handleToggleApi}
												scriptType={scriptType}
												loaderId={selectedLoaderId}
											/>
										)}
									</For>
								</div>
							</Show>
						</Section>
					</div>
				</div>
			</div>
		</main>
	);
};

export default Minecraft;
