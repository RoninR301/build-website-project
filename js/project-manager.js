async function createProject(projectName) {
    const trimmed = projectName.trim();
    if (!trimmed) throw new Error("Project name required");

    await validateGitHubConnection();

    const existing = findProjectByName(trimmed);
    if (existing) {
        await openProject(existing);
        return existing;
    }

    const existsOnGitHub = await projectExistsOnGitHub(trimmed);
    if (existsOnGitHub) {
        const project = createProjectRecord({
            name: trimmed,
            githubPath: getProjectGitHubPath(trimmed),
            fileShas: {},
            settings: {
                geminiApiKey: getGeminiKey() || "",
                openaiApiKey: "",
                claudeApiKey: "",
                selectedModel: "gemini-2.0-flash"
            },
            chatHistory: [],
            buildHistory: [],
            workspaceState: {}
        });
        setCurrentProject(project);
        const merged = await mergeManifestWithProject(project);
        await openProject(merged);
        return merged;
    }

    const project = createProjectRecord({
        name: trimmed,
        githubPath: getProjectGitHubPath(trimmed),
        fileShas: {},
        settings: {
            geminiApiKey: getGeminiKey() || "",
            openaiApiKey: "",
            claudeApiKey: "",
            selectedModel: "gemini-2.0-flash"
        },
        chatHistory: [],
        buildHistory: [],
        workspaceState: {}
    });

    setCurrentProject(project);

    const initialized = await initializeProjectFiles(project);
    await syncManifestToGitHub(initialized);

    logProjectCreated(trimmed);
    logGitHubCommit(`Created project: ${trimmed}`);

    await openProject(initialized);
    return initialized;
}

async function openProject(project) {
    if (!project) return;

    await validateGitHubConnection();

    setCurrentProject(project);
    saveLastOpenedProject(project.id);

    let merged = project;
    try {
        merged = await mergeManifestWithProject(project);
        setCurrentProject(merged);
    } catch (e) {
        console.warn("Manifest merge failed:", e);
    }

    await restoreWorkspace();

    renderWorkspaceUI(merged);
    logProjectOpened(merged.name);

    await refreshFileExplorer();

    const ws = getWorkspaceState();
    if (ws.openFile) {
        try {
            await openFileInEditor(ws.openFile);
        } catch (e) {
            console.warn("Could not restore open file:", e);
        }
    }
}

async function deleteProject(projectId) {
    const project = findProjectById(projectId);
    if (!project) return false;

    await validateGitHubConnection();

    try {
        await deleteGitHubProjectFolder(project.name);
        logGitHubCommit(`Deleted project folder: ${project.name}`);
    } catch (e) {
        throw new Error(`GitHub delete failed: ${e.message}`);
    }

    clearProjectActivityLogs(projectId);
    deleteProjectRecord(projectId);

    if (getCurrentProject()?.id === projectId) {
        setCurrentProject(null);
        hideWorkspace();
    }

    if (getLastOpenedProject() === projectId) {
        clearLastOpenedProject();
    }

    logProjectDeleted(project.name);
    renderProjects();
    return true;
}

async function scanProject(project) {
    if (!project?.name) {
        return { success: false, message: "No project selected" };
    }

    try {
        await validateGitHubConnection();

        const tree = await listProjectTree(project);
        const files = await getProjectFiles(project);

        const summary = {
            totalFiles: files.length,
            htmlFiles: files.filter(f => f.name.endsWith(".html")).length,
            cssFiles: files.filter(f => f.name.endsWith(".css")).length,
            jsFiles: files.filter(f => f.name.endsWith(".js")).length,
            jsonFiles: files.filter(f => f.name.endsWith(".json")).length,
            modifiedFiles: files.slice(0, 5).map(f => f.name)
        };

        updateWorkspaceState({ fileTree: tree, scanResult: summary });
        saveWorkspace();

        logProjectScanned();

        return { success: true, files, tree, summary };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function syncProjectsFromGitHub() {
    await validateGitHubConnection();
    const githubProjects = await listAllGitHubProjects();
    const localProjects = getProjects();

    for (const name of githubProjects) {
        const exists = localProjects.find(
            p => p.name.trim().toLowerCase() === name.trim().toLowerCase()
        );
        if (!exists) {
            createProjectRecord({
                name,
                githubPath: getProjectGitHubPath(name),
                fileShas: {},
                settings: {},
                chatHistory: [],
                buildHistory: [],
                workspaceState: {}
            });
        }
    }
}
