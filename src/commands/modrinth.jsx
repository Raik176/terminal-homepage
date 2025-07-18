import { createSignal, For } from 'solid-js';
import { formatDateWithRelativeTime } from '../utils.js';

export const meta = {
    description: "Shows my Modrinth projects with a component-based pagination system.",
};

function UserProfile({ user, projectCount, totalDownloads }) {
    const profileUrl = `https://modrinth.com/user/${user.username}`;
    return (
        <div class="mb-6 p-4 border rounded-lg flex items-center gap-5" style={{ 'border-color': 'var(--bright-black)' }}>
            <img src={user.avatar_url} alt={`${user.username}'s avatar`} class="w-24 h-24 rounded-full flex-shrink-0 object-cover"/>
            <div class="flex-grow">
                <h2 class="font-bold text-2xl" style={{ 'color': 'var(--green)' }}>
                    <a href={profileUrl} target="_blank" rel="noopener noreferrer" class="hover:underline" style={{ 'color': 'inherit' }}>
                        {user.username}
                    </a>
                </h2>
                {user.bio && <p class="text-sm my-2" style={{ 'color': 'var(--text-color)' }}>{user.bio}</p>}
                <div class="text-xs mt-3 flex flex-wrap gap-x-4 gap-y-2" style={{ 'color': 'var(--bright-black)' }}>
                    <span><span style={{'color': 'var(--text-color)'}}>📦</span> Projects: <span class="font-semibold" style={{ 'color': 'var(--magenta)' }}>{projectCount}</span></span>
                    <span><span style={{'color': 'var(--text-color)'}}>📈</span> Total Downloads: <span class="font-semibold" style={{ 'color': 'var(--yellow)' }}>{totalDownloads.toLocaleString()}</span></span>
                    <span><span style={{'color': 'var(--text-color)'}}>📅</span> Created: <span class="font-semibold" style={{ 'color': 'var(--cyan)' }}>{formatDateWithRelativeTime(user.created)}</span></span>
                </div>
            </div>
        </div>
    );
}


function ModrinthProject({ project }) {
    const projectUrl = `https://modrinth.com/${project.project_type}/${project.slug}`;
    return (
        <div class="my-3 p-4 border rounded-lg flex items-start gap-4" style={{ 'border-color': 'var(--bright-black)' }}>
            {project.icon_url && <img src={project.icon_url} alt={`${project.title} icon`} class="w-20 h-20 rounded-md flex-shrink-0 object-cover" />}
            <div class="flex-grow">
                <h3 class="font-bold text-xl" style={{ 'color': 'var(--green)' }}>
                    <a href={projectUrl} target="_blank" rel="noopener noreferrer" class="hover:underline" style={{ 'color': 'inherit' }}>
                        {project.title}
                    </a>
                </h3>
                <p class="text-sm my-2" style={{ 'color': 'var(--text-color)' }}>{project.description}</p>
                <div class="text-xs mt-3 flex flex-wrap gap-x-4 gap-y-2" style={{ 'color': 'var(--bright-black)' }}>
                    <span><span style={{'color': 'var(--text-color)'}}>⬇️</span> Downloads: <span class="font-semibold" style={{ 'color': 'var(--yellow)' }}>{project.downloads.toLocaleString()}</span></span>
                    <span><span style={{'color': 'var(--text-color)'}}>🏷️</span> Type: <span class="font-semibold capitalize" style={{ 'color': 'var(--blue)' }}>{project.project_type}</span></span>
                    <span><span style={{'color': 'var(--text-color)'}}>🗓️</span> Published: <span class="font-semibold" style={{ 'color': 'var(--cyan)' }}>{formatDateWithRelativeTime(project.published)}</span></span>
                    <span><span style={{'color': 'var(--text-color)'}}>🔄</span> Updated: <span class="font-semibold" style={{ 'color': 'var(--magenta)' }}>{formatDateWithRelativeTime(project.updated)}</span></span>
                </div>
            </div>
        </div>
    );
}

function PaginationControls(props) {
    const buttonBaseStyle = "px-4 py-1 border rounded-md cursor-pointer transition-colors duration-150";
    const enabledStyle = "hover:bg-[var(--bright-black)] hover:text-[var(--background)]";
    const disabledStyle = "opacity-50 cursor-not-allowed";

    return (
        <div class="flex justify-between items-center mt-4 p-2">
            <button
                onClick={() => props.onPageChange(props.currentPage - 1)}
                disabled={props.currentPage === 1}
                class={`${buttonBaseStyle} ${props.currentPage === 1 ? disabledStyle : enabledStyle}`}
                style={{ 'border-color': 'var(--bright-black)', 'color': 'var(--text-color)' }}
            >
                &larr; Previous
            </button>
            <span style={{ 'color': 'var(--bright-black)' }}>
                Page {props.currentPage} of {props.totalPages}
            </span>
            <button
                onClick={() => props.onPageChange(props.currentPage + 1)}
                disabled={props.currentPage === props.totalPages}
                class={`${buttonBaseStyle} ${props.currentPage === props.totalPages ? disabledStyle : enabledStyle}`}
                style={{ 'border-color': 'var(--bright-black)', 'color': 'var(--text-color)' }}
            >
                Next &rarr;
            </button>
        </div>
    );
}

function PaginatedProjectsView({ projects, userProfile, projectCount, totalDownloads }) {
    const [currentPage, setCurrentPage] = createSignal(1);
    const projectsPerPage = 5;
    const totalPages = Math.ceil(projects.length / projectsPerPage);

    const paginatedProjects = () => {
        const startIndex = (currentPage() - 1) * projectsPerPage;
        return projects.slice(startIndex, startIndex + projectsPerPage);
    };

    return (
        <div>
            {userProfile && <UserProfile user={userProfile} projectCount={projectCount} totalDownloads={totalDownloads} />}

            <h3 class="text-xl font-bold mt-4 mb-2" style={{ 'color': 'var(--magenta)' }}>Projects</h3>
            <div style={{ 'min-height': '42rem' }}>
                <For each={paginatedProjects()}>
                    {(project) => <ModrinthProject project={project} />}
                </For>
            </div>
            {totalPages > 1 && (
                <PaginationControls
                    currentPage={currentPage()}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            )}
        </div>
    );
}

export const handler = async (terminal, args, signal) => {
    const userId = "rhm176.";
    const userUrl = `https://api.modrinth.com/v2/user/${userId}`;
    const projectsUrl = `${userUrl}/projects`;

    try {
        terminal.println("Fetching profile and projects...");
        const [userResponse, projectsResponse] = await Promise.all([
            fetch(userUrl, { signal }),
            fetch(projectsUrl, { signal })
        ]);

        if (signal.aborted) return;

        if (!userResponse.ok) {
            throw new Error(`Could not fetch user profile. (Status: ${userResponse.status})`);
        }
        if (!projectsResponse.ok) {
            throw new Error(`Could not fetch projects. (Status: ${projectsResponse.status})`);
        }

        const userProfile = await userResponse.json();
        const projects = (await projectsResponse.json()).sort((a, b) => b.downloads - a.downloads);

        const projectCount = projects.length;
        const totalDownloads = projects.reduce((acc, project) => acc + project.downloads, 0);

        if (projects.length === 0) {
            terminal.println("No projects found.");
        }

        terminal.println({
            html: <PaginatedProjectsView
                projects={projects}
                userProfile={userProfile}
                projectCount={projectCount}
                totalDownloads={totalDownloads}
            />
        });

    } catch (e) {
        if (!signal.aborted) {
            terminal.error(e);
        }
    }
};