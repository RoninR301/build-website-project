async function createProject(projectName) {
    const existing = findProjectByName(projectName);
    if (existing) {
        await openProject(existing);
        return existing;
    }

    await ensureDriveConnection();

    const folder = await createDriveFolder(
        `FolderAgent_${projectName}`
    );

    if (folder.error) {
        throw new Error(folder.error.message || "Drive folder creation failed");
    }

    const project = createProjectRecord({
        name: projectName,
        folderId: folder.id,
        fileIds: {},
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

    setDriveFolderId(folder.id);
    setCurrentProject(project);

    const initialized = await initializeProjectFiles(project);
    await syncManifestToDrive(initialized);

    logProjectCreated(projectName);
    logDriveSync("Project folder created");

    await openProject(initialized);
    return initialized;
}

async function openProject(project) {
    if (!project) return;

    setCurrentProject(project);
    setDriveFolderId(project.folderId);

    saveLastOpenedProject(project.id);
    saveProjectSettings();

    let merged = project;
    if (project.folderId && isDriveConnected()) {
        try {
            merged = await mergeManifestWithProject(project);
            setCurrentProject(merged);
        } catch (e) {
            console.warn("Manifest merge failed:", e);
        }
    }

    await restoreWorkspace();

    renderWorkspaceUI(merged);
    logProjectOpened(merged.name);

    if (merged.folderId && isDriveConnected()) {
        await refreshFileExplorer();
    }
}

async function deleteProject(projectId) {
    const project = findProjectById(projectId);
    if (!project) return false;

    if (project.folderId && isDriveConnected()) {
        try {
            await trashDriveFolder(project.folderId);
            logDriveSync("Project folder trashed");
        } catch (e) {
            console.warn("Drive folder delete failed:", e);
        }
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
    if (!project?.folderId) {
        return {
            success: false,
            message: "No Google Drive folder linked to this project"
        };
    }

    if (!isDriveConnected()) {
        return {
            success: false,
            message: "Google Drive not connected"
        };
    }

    try {
        const files = await getProjectFiles(project.folderId);
        const tree = buildFileTree(files);

        const summary = {
            totalFiles: files.length,
            htmlFiles: files.filter(f => f.name.endsWith(".html")).length,
            cssFiles: files.filter(f => f.name.endsWith(".css")).length,
            jsFiles: files.filter(f => f.name.endsWith(".js")).length,
            jsonFiles: files.filter(f => f.name.endsWith(".json")).length,
            modifiedFiles: files
                .sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime))
                .slice(0, 5)
                .map(f => f.name)
        };

        updateWorkspaceState({ fileTree: tree, scanResult: summary });
        saveWorkspace();

        logProjectScanned();

        return {
            success: true,
            files,
            tree,
            summary
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

function buildScanSummaryText(result) {
    if (!result.success) {
        return `Scan Failed\n\n${result.message}`;
    }

    const s = result.summary;
    return `Project Scan Complete

Total Files: ${s.totalFiles}
HTML: ${s.htmlFiles} | CSS: ${s.cssFiles} | JS: ${s.jsFiles}

Recently Modified:
${s.modifiedFiles.map(f => `• ${f}`).join("\n") || "None"}`;
}
