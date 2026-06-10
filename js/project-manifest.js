const MANIFEST_FILE = "project.json";

function createDefaultManifest(project, fileList) {
    return {
        projectId: project.id,
        projectName: project.name,
        githubPath: project.githubPath || getProjectGitHubPath(project.name),
        createdAt: project.createdAt,
        updatedAt: new Date().toISOString(),
        fileList: fileList || Object.keys(project.fileShas || {}),
        settings: project.settings || {},
        chatHistory: project.chatHistory || [],
        buildHistory: project.buildHistory || []
    };
}

async function syncManifestToGitHub(project) {
    const files = await getProjectFiles(project);
    const fileList = files.map(f => f.name);

    const manifest = createDefaultManifest(project, fileList);
    const content = JSON.stringify(manifest, null, 2);
    const manifestPath = getFilePath(project, MANIFEST_FILE);

    let existingSha = null;
    try {
        const existing = await readGitHubFile(manifestPath);
        existingSha = existing.sha;
    } catch (e) { /* new manifest */ }

    const result = await writeGitHubFile(
        manifestPath,
        content,
        existingSha,
        "Sync project.json manifest"
    );

    const fileShas = { ...(project.fileShas || {}) };
    fileShas[MANIFEST_FILE] = result.sha;

    updateProject(project.id, {
        fileShas,
        updatedAt: new Date().toISOString()
    });

    logGitHubCommit("Synced project.json");
    return result;
}

async function readManifestFromGitHub(project) {
    try {
        const data = await readGitHubFile(getFilePath(project, MANIFEST_FILE));
        return JSON.parse(data.content);
    } catch (e) {
        return null;
    }
}

async function mergeManifestWithProject(project) {
    const manifest = await readManifestFromGitHub(project);
    if (!manifest) return project;

    const merged = {
        ...project,
        settings: { ...project.settings, ...manifest.settings },
        chatHistory: manifest.chatHistory?.length
            ? manifest.chatHistory
            : project.chatHistory,
        buildHistory: manifest.buildHistory?.length
            ? manifest.buildHistory
            : project.buildHistory
    };

    updateProject(project.id, merged);
    return findProjectById(project.id);
}
