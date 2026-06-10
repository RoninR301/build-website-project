const MANIFEST_FILE = "project.json";

function createDefaultManifest(project) {
    return {
        projectId: project.id,
        projectName: project.name,
        folderId: project.folderId || "",
        fileIds: project.fileIds || {},
        backupsFolderId: project.backupsFolderId || "",
        createdAt: project.createdAt,
        updatedAt: new Date().toISOString(),
        settings: project.settings || {},
        chatHistory: project.chatHistory || [],
        buildHistory: project.buildHistory || []
    };
}

async function syncManifestToDrive(project) {
    if (!project.folderId) return null;

    const manifest = createDefaultManifest(project);
    const content = JSON.stringify(manifest, null, 2);

    const result = await createOrUpdateFile(
        project.folderId,
        MANIFEST_FILE,
        content,
        project.fileIds || {},
        project.backupsFolderId,
        false
    );

    const fileIds = { ...(project.fileIds || {}) };
    fileIds[MANIFEST_FILE] = result.fileId;

    updateProject(project.id, {
        fileIds,
        updatedAt: new Date().toISOString()
    });

    return result;
}

async function readManifestFromDrive(project) {
    const fileIds = project.fileIds || {};
    const manifestId = fileIds[MANIFEST_FILE];

    if (manifestId) {
        try {
            const content = await readDriveFileContent(manifestId);
            return JSON.parse(content);
        } catch (e) {
            console.warn("Manifest read failed, scanning folder", e);
        }
    }

    const found = await findFileInFolder(project.folderId, MANIFEST_FILE);
    if (found) {
        const content = await readDriveFileContent(found.id);
        return JSON.parse(content);
    }

    return null;
}

async function mergeManifestWithProject(project) {
    const manifest = await readManifestFromDrive(project);
    if (!manifest) return project;

    const merged = {
        ...project,
        fileIds: { ...project.fileIds, ...manifest.fileIds },
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
