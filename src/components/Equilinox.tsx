import {
	Component,
	createSignal,
	For,
	Show,
	createResource,
	createEffect,
	Accessor,
	JSX,
	Resource,
} from "solid-js";
import JSZip from "jszip";
import { saveAs } from "file-saver";

type Language = "java" | "kotlin";

interface FileManifestEntry {
	src: string;
	dest?: string;
	process?: boolean;
	condition?: (lang: Language) => boolean;
	binary?: boolean;
}

const fileManifest: FileManifestEntry[] = [
	{ src: ".gitignore" },
	{ src: "gradlew" },
	{ src: "gradlew.bat" },
	{ src: "settings.gradle.kts" },

	{ src: "build.gradle.kts", process: true },
	{ src: "gradle.properties", process: true },
	{
		src: "src/main/resources/fabric.mod.json5",
		dest: "src/main/resources/fabric.mod.json",
		process: true,
	},

	{
		src: "src/main/resources/modid.mixins.json",
		dest: "src/main/resources/{{MOD_ID}}.mixins.json",
	},
	{
		src: "src/main/java/com/example/mixin/GameManagerMixin.java",
		dest: "src/main/java/{{PACKAGE_PATH}}/mixin/GameManagerMixin.java",
	},

	{
		src: "src/main/java/com/example/ExampleMod.java",
		dest: "src/main/java/{{PACKAGE_PATH}}/ExampleMod.java",
		condition: (lang) => lang === "java",
	},
	{
		src: "src/main/kotlin/com/example/ExampleMod.kt",
		dest: "src/main/kotlin/{{PACKAGE_PATH}}/ExampleMod.kt",
		condition: (lang) => lang === "kotlin",
	},

	{ src: "gradle/wrapper/gradle-wrapper.jar", binary: true },
	{
		src: "src/main/resources/assets/modid/icon.png",
		dest: "src/main/resources/assets/{{MOD_ID}}/icon.png",
		binary: true,
	},
];

interface License {
	licenseId: string;
	name: string;
	isOsiApproved: boolean;
	detailsUrl: string;
}

interface GradleVersion {
	version: string;
	downloadUrl: string;
}

const fetchResource = async (url: string) => {
	try {
		const res = await fetch(url);
		return res.ok ? await res.text() : null;
	} catch (e) {
		console.error(`Failed to fetch from ${url}`, e);
		return null;
	}
};

const Section: Component<{ title: string; children: JSX.Element }> = (
	props
) => (
	<section
		class="mb-8 animate-fade-in"
		aria-labelledby={props.title.replace(/\s+/g, "-").toLowerCase()}
	>
		<h2
			id={props.title.replace(/\s+/g, "-").toLowerCase()}
			class="text-2xl font-bold mb-4 pb-2 border-b-2 text-[var(--cyan)]"
			style={{
				"border-color": "var(--bright-black)",
				"text-shadow":
					"0 0 8px color-mix(in srgb, var(--cyan) 30%, transparent)",
			}}
		>
			{props.title}
		</h2>
		{props.children}
	</section>
);

const InputField: Component<{
	id: string;
	label: string;
	value: Accessor<string>;
	onInput: (e: { currentTarget: HTMLInputElement }) => void;
	placeholder?: string;
	required?: boolean;
	pattern?: string;
	title?: string;
	isInvalid?: Accessor<boolean> | boolean;
	errorMessage?: Accessor<string>;
}> = (props) => {
	const shouldShowError = () =>
		typeof props.isInvalid === "function"
			? props.isInvalid()
			: !!props.isInvalid;

	return (
		<div>
			<label for={props.id} class="text-sm font-bold mb-2 block">
				{props.label}
			</label>
			<input
				id={props.id}
				type="text"
				value={props.value()}
				onInput={(e) => props.onInput(e)}
				placeholder={props.placeholder}
				required={props.required}
				pattern={props.pattern}
				title={props.title}
				class="w-full px-3 py-2 rounded-lg border-2 bg-[var(--background)] text-[var(--text-color)] focus:outline-none focus:ring-2 transition-all"
				classList={{
					"border-[var(--bright-black)] focus:border-[var(--green)] focus:ring-[color-mix(in_srgb,var(--green)_20%,transparent)]":
						!shouldShowError(),
					"border-[var(--red)] focus:border-[var(--red)] focus:ring-[color-mix(in_srgb,var(--red)_20%,transparent)]":
						shouldShowError(),
				}}
				aria-invalid={shouldShowError()}
			/>
			<Show when={shouldShowError()}>
				<p
					class="text-xs mt-1"
					style={{ color: "var(--red)" }}
					role="alert"
				>
					{props.errorMessage?.()}
				</p>
			</Show>
		</div>
	);
};

const TextAreaField: Component<{
	id: string;
	label: string;
	value: Accessor<string>;
	onInput: (e: { currentTarget: HTMLTextAreaElement }) => void;
	placeholder?: string;
	rows?: number;
}> = (props) => (
	<div>
		<label for={props.id} class="text-sm font-bold mb-2 block">
			{props.label}
		</label>
		<textarea
			id={props.id}
			value={props.value()}
			onInput={(e) => props.onInput(e)}
			placeholder={props.placeholder}
			rows={props.rows || 3}
			class="w-full px-3 py-2 rounded-lg border-2 bg-[var(--background)] text-[var(--text-color)] focus:outline-none focus:ring-2 transition-all border-[var(--bright-black)] focus:border-[var(--green)] focus:ring-[color-mix(in_srgb,var(--green)_20%,transparent)] resize-y"
		/>
	</div>
);

const ToggleButton: Component<{
	onClick: () => void;
	isActive: boolean;
	children: JSX.Element;
}> = (props) => (
	<button
		type="button"
		aria-selected={props.isActive}
		onClick={() => props.onClick()}
		class="px-4 py-1.5 text-sm font-semibold rounded-md transition-colors flex-1"
		classList={{
			"bg-[var(--selection-bg)] text-[var(--text-color)]": props.isActive,
			"text-[var(--bright-black)] hover:text-white": !props.isActive,
		}}
	>
		{props.children}
	</button>
);

const LicenseModal: Component<{
	show: Accessor<boolean>;
	onClose: () => void;
	licenseName: Accessor<string>;
	licenseTextResource: Resource<string | undefined>;
}> = (props) => {
	return (
		<Show when={props.show()}>
			<div
				class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in"
				onClick={() => props.onClose()}
			>
				<div
					class="bg-[var(--background)] rounded-lg shadow-lg p-6 w-11/12 max-w-2xl border-2 border-[var(--bright-black)]"
					onClick={(e) => e.stopPropagation()}
				>
					<h3 class="text-2xl font-bold mb-4 pb-2 text-[var(--cyan)] border-b-2 border-[var(--bright-black)]">
						{props.licenseName()}
					</h3>
					<div class="max-h-[60vh] overflow-y-auto pr-4 bg-[color-mix(in_srgb,var(--background)_80%,var(--bright-black))] p-4 rounded shadow-inner">
						<Show
							when={!props.licenseTextResource.loading}
							fallback={
								<p class="text-[var(--bright-black)] animate-pulse">
									Loading license text...
								</p>
							}
						>
							<pre
								class="whitespace-pre-wrap text-sm font-mono"
								style={{ color: "var(--text-color)" }}
							>
								<code>{props.licenseTextResource()}</code>
							</pre>
						</Show>
					</div>
					<div class="text-right mt-6">
						<button
							onClick={() => props.onClose()}
							class="px-4 py-2 bg-[var(--green)] text-[var(--background)] rounded-lg font-bold hover:opacity-80 transition-opacity"
						>
							Close
						</button>
					</div>
				</div>
			</div>
		</Show>
	);
};

const DependencyInfoCard: Component<{
	name: string;
	version: Accessor<string | undefined>;
}> = (props) => {
	const [copied, setCopied] = createSignal(false);

	const copyVersion = async () => {
		const versionString = props.version();
		if (!versionString) return;
		try {
			await navigator.clipboard.writeText(versionString);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy text: ", err);
			alert("Failed to copy version.");
		}
	};

	return (
		<dl class="bg-[color-mix(in_srgb,var(--background)_80%,var(--bright-black))] p-3 rounded-lg flex items-center justify-between gap-4">
			<dt class="font-semibold text-[var(--text-color)]">{props.name}</dt>
			<dd class="flex items-center gap-2">
				<Show
					when={props.version()}
					fallback={
						<span class="text-sm text-[var(--bright-black)] animate-pulse">
							Loading...
						</span>
					}
				>
					<code class="px-2 py-1 rounded bg-[var(--background)] text-[var(--cyan)] text-sm">
						{props.version()}
					</code>
					<button
						type="button"
						onClick={copyVersion}
						class="px-3 py-1 text-xs font-bold rounded-md transition-colors"
						classList={{
							"bg-[var(--green)] text-[var(--background)]":
								copied(),
							"bg-[var(--bright-black)] text-[var(--text-color)] hover:bg-[var(--cyan)] hover:text-black":
								!copied(),
						}}
					>
						{copied() ? "Copied!" : "Copy"}
					</button>
				</Show>
			</dd>
		</dl>
	);
};

const Equilinox: Component = () => {
	const [modName, setModName] = createSignal("Example Mod");
	const [modId, setModId] = createSignal("examplemod");
	const [modVersion, setModVersion] = createSignal("1.0.0");
	const [author, setAuthor] = createSignal("Me!");
	const [description, setDescription] = createSignal(
		"This is an example description! Tell everyone what your mod is about!"
	);
	const [packageName, setPackageName] = createSignal(
		"com.example.examplemod"
	);
	const [language, setLanguage] = createSignal<Language>("java");
	const [license, setLicense] = createSignal("MIT");
	const [showLicenseModal, setShowLicenseModal] = createSignal(false);
	const [modIdError, setModIdError] = createSignal("");
	const [packageNameError, setPackageNameError] = createSignal("");
	const [isVersionSemVer, setIsVersionSemVer] = createSignal(true);

	createEffect(() => {
		const version = modVersion();
		if (version) {
			const semverRegex =
				/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
			setIsVersionSemVer(semverRegex.test(version));
		} else {
			setIsVersionSemVer(true);
		}
	});

	const [licenses] = createResource<License[]>(async () => {
		try {
			const response = await fetch(
				"https://raw.githubusercontent.com/spdx/license-list-data/main/json/licenses.json"
			);
			if (!response.ok) return [];
			const data = await response.json();
			return (data.licenses as License[])
				.filter((lic) => lic.isOsiApproved)
				.map((lic) => {
					lic.detailsUrl = `https://raw.githubusercontent.com/spdx/license-list-data/refs/heads/main/json/details/${lic.licenseId}.json`;
					return lic;
				})
				.sort((a, b) => a.name.localeCompare(b.name));
		} catch (e) {
			console.error("Failed to fetch licenses", e);
			return [];
		}
	});

	const fetchLicenseText = async (
		licenseId: string,
		licenseList: License[],
		author: string
	): Promise<string> => {
		if (!licenseId) return "No license selected.";
		try {
			const licenseDetails = licenseList.find(
				(l) => l.licenseId === licenseId
			);
			if (!licenseDetails?.detailsUrl) {
				return "License details URL not found.";
			}

			author = author || "the copyright holders";

			const response = await fetch(licenseDetails.detailsUrl);
			if (!response.ok) return "License text not found.";
			const data = await response.json();
			const year = new Date().getFullYear().toString();
			return (data.licenseText || "License text could not be retrieved.")
				.replace(/\[year]/gi, year)
				.replace(/<year>/gi, year)
				.replace(/\bYEAR\b/g, year)
				.replace(/\[owner]/gi, author)
				.replace(/<copyright holders>/gi, author);
		} catch (e) {
			console.error(`Failed to fetch license text for ${licenseId}`, e);
			return "Failed to load license text.";
		}
	};

	// @ts-expect-error Solid's createResource has typing issues with complex dependencies
	const [selectedLicenseText] = createResource(
		() => [license(), licenses(), author()],
		([licenseId, licenseList]: [
			string | undefined,
			License[] | undefined,
		]) => {
			if (!licenseId || !licenseList) return "Loading...";
			return fetchLicenseText(licenseId, licenseList, author());
		}
	);

	const selectedLicenseName = () =>
		licenses()?.find((l) => l.licenseId === license())?.name || license();

	const fetchLatestGitHubRelease = (owner: string, repo: string) =>
		fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`)
			.then((res) => res.json())
			.then((data) => data.tag_name.replaceAll("v", ""));

	const [latestSilkPlugin] = createResource(() =>
		fetchLatestGitHubRelease("SilkLoader", "silk-plugin")
	);

	const [latestSilkLoader] = createResource(() =>
		fetchLatestGitHubRelease("SilkLoader", "silk-loader")
	);

	const [latestSilkApi] = createResource(() =>
		fetchLatestGitHubRelease("SilkLoader", "silk-api")
	);

	const [latestKotlinLanguage] = createResource(() =>
		fetchResource(
			"https://maven.fabricmc.net/net/fabricmc/fabric-language-kotlin/maven-metadata.xml"
		).then((xml) => xml?.match(/<latest>(.*?)<\/latest>/)?.[1])
	);

	const [latestGradle] = createResource<GradleVersion>(() =>
		fetchResource("https://services.gradle.org/versions/current").then(
			(json) => JSON.parse(json || "{}")
		)
	);

	const [isGenerating, setIsGenerating] = createSignal(false);

	const getTemplateFile = async (path: string) => {
		const response = await fetch(`/assets/equilinox/${path}`);
		if (!response.ok)
			throw new Error(`Failed to fetch template file: ${path}`);
		if (path.endsWith(".jar") || path.endsWith(".png"))
			return response.blob();
		return response.text();
	};

	const processConditionalBlocks = (content: string, lang: Language) => {
		const keepTag = lang.toUpperCase();
		const removeTag = lang === "java" ? "KOTLIN" : "JAVA";
		let processedContent = content.replace(
			new RegExp(
				`^\\s*//<${removeTag}>[\\s\\S]*?^\\s*//<\\/${removeTag}>\\s*$\\r?\\n?`,
				"gm"
			),
			""
		);
		processedContent = processedContent.replace(
			new RegExp(`^\\s*//<${keepTag}>\\s*$\\r?\\n?`, "gm"),
			""
		);
		processedContent = processedContent.replace(
			new RegExp(`^\\s*//<\\/${keepTag}>\\s*$\\r?\\n?`, "gm"),
			""
		);
		return processedContent;
	};

	const generateProject = async () => {
		setIsGenerating(true);
		try {
			const zip = new JSZip();
			const kotlinVersionFull = latestKotlinLanguage() || "";
			const [, kotlinLangVersion] = kotlinVersionFull.split("+kotlin.");
			const selectedLicenseId = license();

			const replacements: Record<string, string> = {
				"{{MOD_NAME}}": modName(),
				"{{MOD_ID}}": modId(),
				"{{MOD_VERSION}}": modVersion(),
				"{{MOD_PACKAGE_NAME}}": packageName(),
				"{{MOD_AUTHOR}}": author(),
				"{{MOD_DESCRIPTION}}": description(),
				"{{SILK_PLUGIN_VERSION}}": latestSilkPlugin() || "N/A",
				"{{SILK_LOADER_VERSION}}": latestSilkLoader() || "N/A",
				"{{SILK_API_VERSION": latestSilkApi() || "N/A",
				"{{GRADLE_DISTRIBUTION_URL}}":
					latestGradle()?.downloadUrl?.replace(/\\/g, "") || "",
				"{{KOTLIN_MOD_VERSION}}": kotlinVersionFull,
				"{{KOTLIN_JVM_VERSION}}": kotlinLangVersion,
				"{{MOD_LICENSE}}": selectedLicenseId,
				"{{PACKAGE_PATH}}": packageName().replaceAll(".", "/"),
			};

			const processAndReplace = (content: string) => {
				let result = content;
				for (const [key, value] of Object.entries(replacements)) {
					result = result.replaceAll(key, value);
				}
				result = result.replace(
					/"authors":\s*\["Me!"]/,
					`"authors": ["${author()}"]`
				);
				result = result.replace(
					/"description": "This is an example description! Tell everyone what your mod is about!"/,
					`"description": "${description()}"`
				);
				return result;
			};

			const lang = language();
			for (const file of fileManifest) {
				if (file.condition && !file.condition(lang)) {
					continue;
				}

				let destinationPath = file.dest ?? file.src;
				for (const [key, value] of Object.entries(replacements)) {
					destinationPath = destinationPath.replaceAll(key, value);
				}

				const templateContent = await getTemplateFile(file.src);

				if (file.binary) {
					zip.file(destinationPath, templateContent as Blob);
				} else {
					let textContent = templateContent as string;

					if (file.process) {
						textContent = processConditionalBlocks(
							textContent,
							lang
						);
					}

					zip.file(destinationPath, processAndReplace(textContent));
				}
			}

			if (license()) {
				const licenseText = selectedLicenseText();
				if (licenseText) {
					zip.file("LICENSE", licenseText);
				}
			}

			const zipBlob = await zip.generateAsync({
				type: "blob",
				platform: "UNIX",
			});
			saveAs(zipBlob, `${modId()}.zip`);
		} catch (error) {
			console.error("Failed to generate project:", error);
			alert("An error occurred. Check the console for details.");
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<>
			<main
				class="p-4 sm:p-8 w-full min-h-full"
				style={{
					"background-color": "var(--background)",
					color: "var(--text-color)",
					"font-family": "'Roboto Mono', monospace",
				}}
			>
				<div class="max-w-4xl mx-auto">
					<header class="text-center mb-16 animate-fade-in">
						<h1
							class="text-4xl sm:text-5xl font-bold mb-3"
							style={{
								color: "var(--green)",
								"text-shadow":
									"0 0 15px color-mix(in srgb, var(--green) 40%, transparent)",
							}}
						>
							Equilinox Mod Template Generator
						</h1>
						<p
							class="mb-4"
							style={{ color: "var(--bright-black)" }}
						>
							Quickly set up your development environment for
							creating Equilinox mods with Silk Loader.
						</p>
					</header>

					<div class="grid lg:grid-cols-2 gap-x-8 gap-y-4">
						<div class="flex flex-col gap-8">
							<form
								onSubmit={(e) => {
									e.preventDefault();
									generateProject().catch((err) => {
										console.error(
											"A critical error occurred in generateProject:",
											err
										);
									});
								}}
							>
								<fieldset disabled={isGenerating()}>
									<Section title="Project Configuration">
										<div class="flex flex-col gap-4">
											<InputField
												id="mod-name"
												label="Mod Name"
												value={modName}
												onInput={(e) =>
													setModName(
														e.currentTarget.value
													)
												}
												placeholder="My Awesome Mod"
												required
											/>
											<InputField
												id="mod-id"
												label="Mod ID"
												value={modId}
												onInput={(e) => {
													setModId(
														e.currentTarget.value
													);
													setModIdError(
														e.currentTarget.checkValidity()
															? ""
															: e.currentTarget
																	.title
													);
												}}
												placeholder="my-awesome-mod"
												required
												pattern="^[\-a-z0-9_]+$"
												title="The mod id can only contain lowercase characters, numbers, underscores, and hyphens."
												isInvalid={!!modIdError()}
												errorMessage={modIdError}
											/>
											<InputField
												id="mod-version"
												label="Mod Version"
												value={modVersion}
												onInput={(e) =>
													setModVersion(
														e.currentTarget.value
													)
												}
												placeholder="1.0.0"
												required
												isInvalid={!isVersionSemVer()}
												errorMessage={() =>
													"Warning: Not a standard semantic version."
												}
											/>
											<InputField
												id="mod-author"
												label="Author"
												value={author}
												onInput={(e) =>
													setAuthor(
														e.currentTarget.value
													)
												}
												placeholder="Your Name"
												required
											/>
											<TextAreaField
												id="mod-description"
												label="Description"
												value={description}
												onInput={(e) =>
													setDescription(
														e.currentTarget.value
													)
												}
												placeholder="A brief description of your mod."
											/>
											<InputField
												id="package-name"
												label="Package Name"
												value={packageName}
												onInput={(e) => {
													setPackageName(
														e.currentTarget.value
													);
													setPackageNameError(
														e.currentTarget.checkValidity()
															? ""
															: e.currentTarget
																	.title
													);
												}}
												placeholder="com.example.mod"
												required
												pattern="^[a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*$"
												title="Must be a standard Java package name (e.g., com.example.mod)."
												isInvalid={!!packageNameError()}
												errorMessage={packageNameError}
											/>
											<Show
												when={!licenses.loading}
												fallback={
													<div>
														<label class="text-sm font-bold mb-2 block">
															License
														</label>
														<div class="w-full h-[44px] rounded-lg bg-[color-mix(in_srgb,var(--background)_80%,var(--bright-black))] animate-pulse" />
													</div>
												}
											>
												<div>
													<label class="text-sm font-bold mb-2 block">
														License
													</label>
													<div class="flex items-center gap-2">
														<select
															value={license()}
															onInput={(e) =>
																setLicense(
																	e
																		.currentTarget
																		.value
																)
															}
															class="flex-grow w-full px-3 py-2 rounded-lg border-2 border-[var(--bright-black)] bg-[var(--background)] text-[var(--text-color)] focus:border-[var(--green)] focus:outline-none transition-colors"
														>
															<For
																each={licenses()}
															>
																{(lic) => (
																	<option
																		value={
																			lic.licenseId
																		}
																	>
																		{
																			lic.name
																		}
																	</option>
																)}
															</For>
														</select>
														<button
															type="button"
															onClick={() =>
																setShowLicenseModal(
																	true
																)
															}
															class="px-4 py-2 text-sm font-bold bg-[var(--bright-black)] rounded-lg hover:bg-[var(--cyan)] hover:text-black transition-colors"
														>
															View
														</button>
													</div>
												</div>
											</Show>
											<div>
												<label class="text-sm font-bold mb-2 block">
													Language
												</label>
												<div class="flex gap-1 p-1 rounded-lg bg-[color-mix(in_srgb,var(--background)_80%,var(--bright-black))]">
													<For
														each={
															[
																"java",
																"kotlin",
															] as Language[]
														}
													>
														{(lang) => (
															<ToggleButton
																onClick={() =>
																	setLanguage(
																		lang
																	)
																}
																isActive={
																	language() ===
																	lang
																}
															>
																<span class="capitalize">
																	{lang}
																</span>
															</ToggleButton>
														)}
													</For>
												</div>
											</div>
										</div>
									</Section>
									<div class="text-center mt-8">
										<button
											type="submit"
											disabled={
												isGenerating() ||
												!!modIdError() ||
												!!packageNameError()
											}
											class="px-8 py-3 bg-[var(--green)] text-[var(--background)] rounded-lg font-bold text-lg hover:bg-[color-mix(in_srgb,var(--green)_80%,white)] transition-all duration-200 disabled:opacity-50 disabled:cursor-wait transform hover:scale-105 active:scale-100"
										>
											<Show
												when={isGenerating()}
												fallback={
													<>Download Project ZIP</>
												}
											>
												<div class="flex items-center justify-center gap-2">
													<svg
														class="animate-spin h-5 w-5"
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
													>
														<circle
															class="opacity-25"
															cx="12"
															cy="12"
															r="10"
															stroke="currentColor"
															stroke-width="4"
														/>
														<path
															class="opacity-75"
															fill="currentColor"
															d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
														/>
													</svg>
													Generating...
												</div>
											</Show>
										</button>
									</div>
								</fieldset>
							</form>
						</div>

						<div class="flex flex-col gap-8">
							<Section title="Reference Information">
								<div class="flex flex-col gap-4">
									<DependencyInfoCard
										name="Silk Plugin"
										version={latestSilkPlugin}
									/>
									<DependencyInfoCard
										name="Silk Loader"
										version={latestSilkLoader}
									/>
									<DependencyInfoCard
										name="Silk API"
										version={latestSilkApi}
									/>
									<DependencyInfoCard
										name="Kotlin Language"
										version={latestKotlinLanguage}
									/>
									<DependencyInfoCard
										name="Gradle"
										version={() => latestGradle()?.version}
									/>
								</div>
							</Section>
						</div>
					</div>
				</div>
			</main>
			<LicenseModal
				show={showLicenseModal}
				onClose={() => setShowLicenseModal(false)}
				licenseName={selectedLicenseName}
				licenseTextResource={selectedLicenseText}
			/>
		</>
	);
};

export default Equilinox;
