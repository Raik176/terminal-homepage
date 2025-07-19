import { createSignal, For, Component } from "solid-js";
import { formatDateWithRelativeTime } from "../utils";
import { Terminal } from "../components/Terminal";
import { DeriveArgs } from "./index";

interface ModrinthUser {
	username: string;
	bio: string | null;
	avatar_url: string;
	created: string;
}

interface ModrinthProjectData {
	project_type: string;
	slug: string;
	title: string;
	description: string;
	downloads: number;
	icon_url: string | null;
	published: string;
	updated: string;
}

interface UserProfileProps {
	user: ModrinthUser;
	projectCount: number;
	totalDownloads: number;
}

interface PaginationControlsProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}

interface PaginatedProjectsViewProps {
	projects: ModrinthProjectData[];
	userProfile: ModrinthUser;
	projectCount: number;
	totalDownloads: number;
}

const UserProfile: Component<UserProfileProps> = (props) => {
	const profileUrl = () => `https://modrinth.com/user/${props.user.username}`;
	return (
		<div
			class="mb-6 p-4 border rounded-lg flex items-center gap-5"
			style={{ "border-color": "var(--bright-black)" }}
		>
			<img
				src={props.user.avatar_url}
				alt={`${props.user.username}'s avatar`}
				class="w-24 h-24 rounded-full flex-shrink-0 object-cover"
			/>
			<div class="flex-grow">
				<h2
					class="font-bold text-2xl"
					style={{ color: "var(--green)" }}
				>
					<a
						href={profileUrl()}
						target="_blank"
						rel="noopener noreferrer"
						class="hover:underline"
						style={{ color: "inherit" }}
					>
						{props.user.username}
					</a>
				</h2>
				{props.user.bio && (
					<p
						class="text-sm my-2"
						style={{ color: "var(--text-color)" }}
					>
						{props.user.bio}
					</p>
				)}
				<div
					class="text-xs mt-3 flex flex-wrap gap-x-4 gap-y-2"
					style={{ color: "var(--bright-black)" }}
				>
					<span>
						<span style={{ color: "var(--text-color)" }}>📦</span>{" "}
						Projects:{" "}
						<span
							class="font-semibold"
							style={{ color: "var(--magenta)" }}
						>
							{props.projectCount}
						</span>
					</span>
					<span>
						<span style={{ color: "var(--text-color)" }}>📈</span>{" "}
						Total Downloads:{" "}
						<span
							class="font-semibold"
							style={{ color: "var(--yellow)" }}
						>
							{props.totalDownloads.toLocaleString()}
						</span>
					</span>
					<span>
						<span style={{ color: "var(--text-color)" }}>📅</span>{" "}
						Created:{" "}
						<span
							class="font-semibold"
							style={{ color: "var(--cyan)" }}
						>
							{formatDateWithRelativeTime(props.user.created)}
						</span>
					</span>
				</div>
			</div>
		</div>
	);
};

const ModrinthProject: Component<{ project: ModrinthProjectData }> = (
	props
) => {
	const projectUrl = () =>
		`https://modrinth.com/${props.project.project_type}/${props.project.slug}`;
	return (
		<div
			class="my-3 p-4 border rounded-lg flex items-start gap-4"
			style={{ "border-color": "var(--bright-black)" }}
		>
			{props.project.icon_url && (
				<img
					src={props.project.icon_url}
					alt={`${props.project.title} icon`}
					class="w-20 h-20 rounded-md flex-shrink-0 object-cover"
				/>
			)}
			<div class="flex-grow">
				<h3 class="font-bold text-xl" style={{ color: "var(--green)" }}>
					<a
						href={projectUrl()}
						target="_blank"
						rel="noopener noreferrer"
						class="hover:underline"
						style={{ color: "inherit" }}
					>
						{props.project.title}
					</a>
				</h3>
				<p class="text-sm my-2" style={{ color: "var(--text-color)" }}>
					{props.project.description}
				</p>
				<div
					class="text-xs mt-3 flex flex-wrap gap-x-4 gap-y-2"
					style={{ color: "var(--bright-black)" }}
				>
					<span>
						<span style={{ color: "var(--text-color)" }}>⬇️</span>{" "}
						Downloads:{" "}
						<span
							class="font-semibold"
							style={{ color: "var(--yellow)" }}
						>
							{props.project.downloads.toLocaleString()}
						</span>
					</span>
					<span>
						<span style={{ color: "var(--text-color)" }}>🏷️</span>{" "}
						Type:{" "}
						<span
							class="font-semibold capitalize"
							style={{ color: "var(--blue)" }}
						>
							{props.project.project_type}
						</span>
					</span>
					<span>
						<span style={{ color: "var(--text-color)" }}>🗓️</span>{" "}
						Published:{" "}
						<span
							class="font-semibold"
							style={{ color: "var(--cyan)" }}
						>
							{formatDateWithRelativeTime(
								props.project.published
							)}
						</span>
					</span>
					<span>
						<span style={{ color: "var(--text-color)" }}>🔄</span>{" "}
						Updated:{" "}
						<span
							class="font-semibold"
							style={{ color: "var(--magenta)" }}
						>
							{formatDateWithRelativeTime(props.project.updated)}
						</span>
					</span>
				</div>
			</div>
		</div>
	);
};

const PaginationControls: Component<PaginationControlsProps> = (props) => {
	const buttonBaseStyle =
		"px-4 py-1 border rounded-md cursor-pointer transition-colors duration-150";
	const enabledStyle =
		"hover:bg-[var(--bright-black)] hover:text-[var(--background)]";
	const disabledStyle = "opacity-50 cursor-not-allowed";

	return (
		<div class="flex justify-between items-center mt-4 p-2">
			<button
				onClick={() => props.onPageChange(props.currentPage - 1)}
				disabled={props.currentPage === 1}
				class={`${buttonBaseStyle} ${props.currentPage === 1 ? disabledStyle : enabledStyle}`}
				style={{
					"border-color": "var(--bright-black)",
					color: "var(--text-color)",
				}}
			>
				&larr; Previous
			</button>
			<span style={{ color: "var(--bright-black)" }}>
				Page {props.currentPage} of {props.totalPages}
			</span>
			<button
				onClick={() => props.onPageChange(props.currentPage + 1)}
				disabled={props.currentPage === props.totalPages}
				class={`${buttonBaseStyle} ${props.currentPage === props.totalPages ? disabledStyle : enabledStyle}`}
				style={{
					"border-color": "var(--bright-black)",
					color: "var(--text-color)",
				}}
			>
				Next &rarr;
			</button>
		</div>
	);
};

const PaginatedProjectsView: Component<PaginatedProjectsViewProps> = (
	props
) => {
	const [currentPage, setCurrentPage] = createSignal(1);
	const projectsPerPage = 5;
	const totalPages = () => Math.ceil(props.projects.length / projectsPerPage);

	const paginatedProjects = () => {
		const startIndex = (currentPage() - 1) * projectsPerPage;
		return props.projects.slice(startIndex, startIndex + projectsPerPage);
	};

	return (
		<div>
			<UserProfile
				user={props.userProfile}
				projectCount={props.projectCount}
				totalDownloads={props.totalDownloads}
			/>
			<h3
				class="text-xl font-bold mt-4 mb-2"
				style={{ color: "var(--magenta)" }}
			>
				Projects
			</h3>
			<div style={{ "min-height": "42rem" }}>
				<For each={paginatedProjects()}>
					{(project) => <ModrinthProject project={project} />}
				</For>
			</div>
			{totalPages() > 1 && (
				<PaginationControls
					currentPage={currentPage()}
					totalPages={totalPages()}
					onPageChange={setCurrentPage}
				/>
			)}
		</div>
	);
};

export const meta = {
	description:
		"Shows my Modrinth projects with a component-based pagination system.",
	arguments: [],
} as const;

export const handler = async (
	terminal: Terminal,
	_args: DeriveArgs<typeof meta.arguments>,
	signal: AbortSignal
) => {
	const userId = "rhm176.";
	const userUrl = `https://api.modrinth.com/v2/user/${userId}`;
	const projectsUrl = `${userUrl}/projects`;

	try {
		terminal.println("Fetching profile and projects...");
		const [userResponse, projectsResponse] = await Promise.all([
			fetch(userUrl, { signal }),
			fetch(projectsUrl, { signal }),
		]);

		if (signal.aborted) return;

		if (!userResponse.ok)
			throw new Error(
				`Could not fetch user profile. (Status: ${userResponse.status})`
			);
		if (!projectsResponse.ok)
			throw new Error(
				`Could not fetch projects. (Status: ${projectsResponse.status})`
			);

		const userProfile: ModrinthUser = await userResponse.json();
		const projects: ModrinthProjectData[] = (
			await projectsResponse.json()
		).sort(
			(a: ModrinthProjectData, b: ModrinthProjectData) =>
				b.downloads - a.downloads
		);

		const projectCount = projects.length;
		const totalDownloads = projects.reduce(
			(acc, project) => acc + project.downloads,
			0
		);

		if (projects.length === 0) {
			terminal.println("No projects found.");
			return;
		}

		terminal.println(() => (
			<PaginatedProjectsView
				projects={projects}
				userProfile={userProfile}
				projectCount={projectCount}
				totalDownloads={totalDownloads}
			/>
		));
	} catch (e: unknown) {
		if (!signal.aborted) {
			if (e instanceof Error) {
				terminal.error(e);
			} else {
				terminal.error(new Error(String(e)));
			}
		}
	}
};
