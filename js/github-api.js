const GITHUB_API = "https://api.github.com";

async function githubFetch(path, options = {}) {
    const settings = getGitHubSettings();
    if (!settings.githubToken) {
        throw new Error("GitHub token not configured");
    }

    const url = path.startsWith("http") ? path : `${GITHUB_API}${path}`;

    let response;
    try {
        response = await fetch(url, {
            ...options,
            headers: {
                Authorization: `Bearer ${settings.githubToken}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                ...options.headers
            }
        });
    } catch (networkError) {
        throw new Error(
            `GitHub network error: ${networkError.message}. Check token and connection.`
        );
    }

    if (response.status === 204) {
        return { success: true };
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || `GitHub API error: ${response.status}`);
    }

    return data;
}

function getRepoPath(subPath = "") {
    const { repoOwner, repoName } = getGitHubSettings();
    const clean = subPath.replace(/^\//, "");
    return `/repos/${repoOwner}/${repoName}/contents/${clean}`;
}

async function validateGitHubToken() {
    const data = await githubFetch("/user");
    return { valid: true, login: data.login };
}

async function validateGitHubRepository() {
    const { repoOwner, repoName } = getGitHubSettings();
    const data = await githubFetch(`/repos/${repoOwner}/${repoName}`);
    return { valid: true, fullName: data.full_name, defaultBranch: data.default_branch };
}

async function pathExists(path) {
    try {
        await githubFetch(getRepoPath(path));
        return true;
    } catch (e) {
        if (e.message.includes("404") || e.message.toLowerCase().includes("not found")) {
            return false;
        }
        throw e;
    }
}

async function ensureBaseFolder() {
    const { baseFolder } = getGitHubSettings();
    const exists = await pathExists(baseFolder);

    if (!exists) {
        await writeGitHubFile(
            `${baseFolder}/.gitkeep`,
            "",
            null,
            `Create base folder: ${baseFolder}`
        );
    }

    return baseFolder;
}

async function validateGitHubConnection() {
    await validateGitHubToken();
    await validateGitHubRepository();
    await ensureBaseFolder();
    return { success: true };
}

async function readGitHubFile(filePath) {
    const data = await githubFetch(getRepoPath(filePath));

    if (Array.isArray(data)) {
        throw new Error(`${filePath} is a directory, not a file`);
    }

    let content = "";
    if (data.content) {
        content = decodeURIComponent(
            escape(atob(data.content.replace(/\n/g, "")))
        );
    }

    return {
        content,
        sha: data.sha,
        path: data.path,
        name: data.name
    };
}

async function listGitHubDirectory(dirPath) {
    try {
        const data = await githubFetch(getRepoPath(dirPath));
        if (!Array.isArray(data)) return [];
        return data;
    } catch (e) {
        if (e.message.includes("404") || e.message.toLowerCase().includes("not found")) {
            return [];
        }
        throw e;
    }
}

async function writeGitHubFile(filePath, content, sha, message) {
    const body = {
        message: message || `Update ${filePath}`,
        content: btoa(unescape(encodeURIComponent(content)))
    };

    if (sha) {
        body.sha = sha;
    }

    const data = await githubFetch(getRepoPath(filePath), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (!data.content?.sha) {
        throw new Error(`GitHub did not confirm write for ${filePath}`);
    }

    return {
        sha: data.content.sha,
        path: data.content.path,
        commit: data.commit?.sha
    };
}

async function deleteGitHubFile(filePath, sha, message) {
    const data = await githubFetch(getRepoPath(filePath), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            message: message || `Delete ${filePath}`,
            sha
        })
    });

    return data;
}

async function listProjectOnGitHub(projectName) {
    const projectPath = getProjectGitHubPath(projectName);
    return listGitHubDirectory(projectPath);
}

async function projectExistsOnGitHub(projectName) {
    const items = await listProjectOnGitHub(projectName);
    return items.length > 0;
}

async function listAllGitHubProjects() {
    const { baseFolder } = getGitHubSettings();
    const items = await listGitHubDirectory(baseFolder);
    return items
        .filter(item => item.type === "dir")
        .map(item => item.name);
}

async function deleteGitHubProjectFolder(projectName) {
    const projectPath = getProjectGitHubPath(projectName);

    async function deleteRecursive(dirPath) {
        const items = await listGitHubDirectory(dirPath);
        for (const item of items) {
            if (item.type === "dir") {
                await deleteRecursive(item.path);
            } else {
                await deleteGitHubFile(
                    item.path,
                    item.sha,
                    `Delete ${item.path}`
                );
            }
        }
    }

    await deleteRecursive(projectPath);
}
