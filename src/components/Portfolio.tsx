import { Component, createEffect, createSignal } from "solid-js";
import { createResource, For, Show, createMemo } from "solid-js";
import { Contact, GITHUB_USER, MODRINTH_USER, SOCIALS } from "../utils";

// --- TYPE DEFINITIONS ---
type GithubRepo = {
	id: number;
	name: string;
	html_url: string;
	description: string;
	stargazers_count: number;
	forks_count: number;
	language: string;
};

type ModrinthProject = {
	id: string;
	slug: string;
	title: string;
	description: string;
	source_url: string | null;
	icon_url: string | null;
	downloads: number;
	followers: number;
	loaders: string[];
	categories: string[];
};

type Project = {
	id: string | number;
	title: string;
	description: string;
	url: string;
	icon_url?: string | null;
	github?: Omit<GithubRepo, "id" | "name" | "description" | "html_url"> & {
		html_url: string;
	};
	modrinth?: Omit<
		ModrinthProject,
		"id" | "title" | "description" | "source_url"
	>;
};

// --- API FETCHING LOGIC ---
const fetchGithubRepos = async (): Promise<GithubRepo[]> => {
	let allRepos: GithubRepo[] = [];
	let nextUrl: string | null =
		`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100`;
	while (nextUrl) {
		const response = await fetch(nextUrl);
		if (!response.ok) throw new Error("Failed to fetch from GitHub API");
		const reposOnPage: GithubRepo[] = await response.json();
		allRepos = allRepos.concat(reposOnPage);
		const linkHeader = response.headers.get("Link");
		const links = parseLinkHeader(linkHeader);
		nextUrl = links.next || null;
	}
	return allRepos;
};

const fetchModrinthProjects = async (): Promise<ModrinthProject[]> => {
	const response = await fetch(
		`https://api.modrinth.com/v2/user/${MODRINTH_USER}/projects`
	);
	if (!response.ok) throw new Error("Failed to fetch from Modrinth API");
	return response.json();
};

const parseLinkHeader = (header: string | null): { [key: string]: string } => {
	if (!header) return {};
	return Object.fromEntries(
		header.split(",").map((part) => {
			const match = part.match(/<(.+)>; rel="(.+)"/);
			return [match?.[2], match?.[1]];
		})
	);
};

function getAge(birthDate: string | Date) {
	const today = new Date();
	const birth = new Date(birthDate);
	let age = today.getFullYear() - birth.getFullYear();

	const monthDiff = today.getMonth() - birth.getMonth();
	const dayDiff = today.getDate() - birth.getDate();
	if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
		age--;
	}

	return age;
}

const fetchAndMergeProjects = async (): Promise<Project[]> => {
	const [githubData, modrinthData] = await Promise.all([
		fetchGithubRepos(),
		fetchModrinthProjects(),
	]);

	const mergedProjects: Project[] = [];
	const githubRepoMap = new Map(
		githubData.map((repo) => [repo.html_url, repo])
	);

	for (const mod of modrinthData) {
		const githubMatch = mod.source_url
			? githubRepoMap.get(mod.source_url)
			: undefined;

		const project: Project = {
			id: mod.id,
			title: mod.title,
			description:
				mod.description ||
				githubMatch?.description ||
				"No description available.",
			url: `https://modrinth.com/mod/${mod.slug}`,
			icon_url: mod.icon_url,
			modrinth: {
				slug: mod.slug,
				icon_url: mod.icon_url,
				downloads: mod.downloads,
				followers: mod.followers,
				loaders: mod.loaders,
				categories: mod.categories,
			},
		};

		if (githubMatch) {
			project.github = {
				stargazers_count: githubMatch.stargazers_count,
				forks_count: githubMatch.forks_count,
				language: githubMatch.language,
				html_url: githubMatch.html_url,
			};
			githubRepoMap.delete(githubMatch.html_url);
		}
		mergedProjects.push(project);
	}

	for (const repo of githubRepoMap.values()) {
		mergedProjects.push({
			id: repo.id,
			title: repo.name,
			description: repo.description || "No description available.",
			url: repo.html_url,
			github: {
				stargazers_count: repo.stargazers_count,
				forks_count: repo.forks_count,
				language: repo.language,
				html_url: repo.html_url,
			},
		});
	}

	return mergedProjects.sort((a, b) => {
		const scoreA =
			(a.github?.stargazers_count || 0) * 5 +
			(a.modrinth?.downloads || 0);
		const scoreB =
			(b.github?.stargazers_count || 0) * 5 +
			(b.modrinth?.downloads || 0);
		return scoreB - scoreA;
	});
};

// --- ICONS ---
const StarIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		viewBox="0 0 24 24"
		fill="currentColor"
	>
		<path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z" />
	</svg>
);

const DownloadIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		viewBox="0 0 24 24"
		fill="currentColor"
	>
		<path d="M12 16l5-5h-3V4h-4v7H7l5 5zm-7 4h14v2H5v-2z" />
	</svg>
);

// --- CONTACT COMPONENT ---
const ContactCard: Component<{ contact: Contact }> = (props) => {
	const [username, setUsername] = createSignal<string>("Loading...");

	createEffect(() => {
		const { username: user } = props.contact;

		if (typeof user === "function") {
			user()
				.then((name) => setUsername(name))
				.catch(() => setUsername("N/A"));
		} else {
			setUsername(user);
		}
	});

	return (
		<a
			href={props.contact.url}
			target="_blank"
			rel="noopener noreferrer"
			class="flex items-center gap-4 p-4 border rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:bg-[var(--selection-bg)]"
			style={{
				"border-color": "var(--bright-black)",
				"background-color": "var(--background)",
			}}
		>
			<div
				style={{
					"background-color": "var(--text-color)",
					"mask-image": `url(${props.contact.icon})`,
					"mask-size": "contain",
					"mask-repeat": "no-repeat",
					"mask-position": "center",
				}}
				class="w-6 h-6 flex-shrink-0"
			/>
			<div>
				<p class="font-bold">{props.contact.service}</p>
				<p class="text-sm text-[var(--bright-black)]">{username()}</p>
			</div>
		</a>
	);
};

const ContactInfoComponent: Component = () => (
	<div class="my-6">
		<p class="text-center mb-2 text-[var(--text-color)]">
			Click on any card to get in touch.
		</p>
		<p class="text-center text-sm mb-4 text-[var(--bright-black)]">
			(Services are ordered by most frequently used from left to right)
		</p>
		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			<For each={SOCIALS}>
				{(contact) => <ContactCard contact={contact} />}
			</For>
		</div>
	</div>
);

// --- SKELETON CARD ---
const SkeletonCard = () => (
	<div class="card animate-pulse">
		<div class="card-header flex items-center gap-3">
			<div class="w-10 h-10 bg-[var(--bright-black)] rounded-md" />
			<div class="flex flex-col flex-grow gap-2">
				<div class="w-3/4 h-4 bg-[var(--bright-black)] rounded" />
				<div class="w-1/2 h-3 bg-[var(--bright-black)] rounded" />
			</div>
		</div>
		<div class="card-body h-16 bg-[var(--bright-black)] rounded mt-2" />
		<div class="card-footer flex justify-between mt-2">
			<div class="w-1/3 h-3 bg-[var(--bright-black)] rounded" />
			<div class="w-1/4 h-3 bg-[var(--bright-black)] rounded" />
		</div>
	</div>
);

const ProjectCard: Component<{ project: Project }> = (props) => (
	<div class="card animate-fade-in">
		<div class="card-header">
			{props.project.icon_url && (
				<img
					src={props.project.icon_url}
					alt=""
					class="w-10 h-10 rounded-md border border-[var(--bright-black)] object-cover"
				/>
			)}
			<div class="flex-grow">
				<h3 class="card-title">{props.project.title}</h3>
				<div class="flex items-center gap-3 text-lg mt-1 card-links">
					<Show when={props.project.github}>
						<a
							href={props.project.github!.html_url}
							target="_blank"
							rel="noopener noreferrer"
							title="View on GitHub"
						>
							<div
								class="w-6 h-6"
								style={{
									"background-color": "var(--text-color)",
									"mask-image": `url(/assets/icons/socials/github.svg)`,
									"mask-size": "contain",
									"mask-repeat": "no-repeat",
									"mask-position": "center",
								}}
							/>
						</a>
					</Show>
					<Show when={props.project.modrinth}>
						<a
							href={`https://modrinth.com/mod/${props.project.modrinth!.slug}`}
							target="_blank"
							rel="noopener noreferrer"
							title="View on Modrinth"
						>
							<div
								class="w-6 h-6"
								style={{
									"background-color": "var(--text-color)",
									"mask-image": `url(/assets/icons/socials/modrinth.svg)`,
									"mask-size": "contain",
									"mask-repeat": "no-repeat",
									"mask-position": "center",
								}}
							/>
						</a>
					</Show>
				</div>
			</div>
		</div>

		<p class="card-body line-clamp-3">{props.project.description}</p>

		<div class="card-footer">
			<div class="card-stats">
				{props.project.github && (
					<span class="flex items-center gap-1">
						<StarIcon />
						{props.project.github.stargazers_count.toLocaleString()}
					</span>
				)}
				{props.project.modrinth && (
					<span class="flex items-center gap-1">
						<DownloadIcon />
						{props.project.modrinth.downloads.toLocaleString()}
					</span>
				)}
			</div>
		</div>
	</div>
);

const Portfolio: Component = () => {
	const [projects] = createResource<Project[]>(fetchAndMergeProjects);

	const summary = createMemo(() => {
		const projs = projects() || [];
		return {
			totalStars: projs.reduce(
				(sum, p) => sum + (p.github?.stargazers_count ?? 0),
				0
			),
			totalDownloads: projs.reduce(
				(sum, p) => sum + (p.modrinth?.downloads ?? 0),
				0
			),
			totalProjects: projs.length,
		};
	});

	return (
		<>
			<style>{`
             .animate-fade-in { animation: fade-in 0.5s ease-out forwards; opacity: 0; }
             @keyframes fade-in { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
             .card { background: color-mix(in srgb, var(--background) 90%, var(--bright-black)); border: 1px solid var(--bright-black); border-radius: 8px; transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; display: flex; flex-direction: column; padding:0; }
             .card:hover { transform: translateY(-5px) scale(1.02); border-color: var(--cyan); box-shadow: 0 0 15px color-mix(in srgb, var(--cyan) 25%, transparent); }
             .card-header { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1rem 0.75rem; border-bottom: 1px solid var(--bright-black); }
             .card-title { color: var(--text-color); font-weight: 700; font-size: 1.125rem; }
             .card-body { padding: 0.75rem 1rem; flex-grow: 1; font-size: 0.875rem; color: var(--bright-black); line-height: 1.5; }
             .card-footer { margin-top: auto; padding: 0.75rem 1rem 1rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
             .card-stats { display: flex; gap: 0.75rem; color: var(--bright-black); font-size: 0.8rem; align-items: center; }
             .socials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin-top: 3rem; }
             .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
          `}</style>

			<main
				class="p-6 sm:p-10 w-full min-h-screen relative"
				style={{
					"background-color": "var(--background)",
					color: "var(--text-color)",
					"font-family": "'Roboto Mono', monospace",
				}}
			>
				<div class="max-w-6xl mx-auto">
					<header class="text-center mb-16 animate-fade-in">
						<h1
							class="text-4xl sm:text-5xl font-bold mb-3 flex items-center justify-center gap-3"
							style={{ color: "var(--green)" }}
						>
							My Portfolio
						</h1>
						<p class="text-[var(--bright-black)] text-lg">
							Hello! I'm Raik, a {getAge("2008-08-29")} year old
							from Germany. I'm currently studying to be an IT
							assistant at a vocational school.
						</p>
					</header>

					<section class="animate-fade-in">
						<ContactInfoComponent />
					</section>

					<section
						class="animate-fade-in"
						style={{ "animation-delay": "150ms" }}
					>
						<h2
							class="text-2xl font-bold mb-4 pb-3 border-b-2"
							style={{
								color: "var(--cyan)",
								"border-color": "var(--bright-black)",
							}}
						>
							My Projects
						</h2>

						<div class="mb-6 text-center text-lg">
							<span>
								Total Projects: {summary().totalProjects}
							</span>{" "}
							|{" "}
							<span>
								Total GitHub Stars:{" "}
								{summary().totalStars.toLocaleString()}
							</span>{" "}
							|{" "}
							<span>
								Total Modrinth Downloads:{" "}
								{summary().totalDownloads.toLocaleString()}
							</span>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							<Show
								when={!projects.loading}
								fallback={
									<For each={[1, 2, 3, 4, 5, 6]}>
										{() => <SkeletonCard />}
									</For>
								}
							>
								<For
									each={projects()}
									fallback={<p>No projects found.</p>}
								>
									{(project) => (
										<ProjectCard project={project} />
									)}
								</For>
							</Show>
						</div>
					</section>
				</div>
			</main>
		</>
	);
};

export default Portfolio;
