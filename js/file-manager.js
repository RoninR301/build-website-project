const DEFAULT_PROJECT_FILES = [
    { name: "index.html", generator: "index" },
    { name: "style.css", generator: "style" },
    { name: "app.js", generator: "app" }
];

const backupVersions = {};

async function ensureBackupsFolder(project) {
    if (project.backupsFolderId) {
        return project.backupsFolderId;
    }

    const folder = await createDriveSubfolder(
        project.folderId,
        "backups"
    );

    updateProject(project.id, {
        backupsFolderId: folder.id
    });

    return folder.id;
}

async function createBackup(
    backupsFolderId,
    fileName,
    currentContent
) {
    if (!backupsFolderId || !currentContent) return null;

    const key = fileName;
    backupVersions[key] = (backupVersions[key] || 0) + 1;
    const version = backupVersions[key];

    const ext = fileName.includes(".")
        ? fileName.substring(fileName.lastIndexOf("."))
        : "";
    const base = fileName.replace(ext, "");
    const backupName = `${base}-v${version}${ext}`;

    const result = await createDriveFileInFolder(
        backupsFolderId,
        backupName,
        currentContent
    );

    logFileBackup(fileName, version);
    return result;
}

async function createOrUpdateFile(
    folderId,
    fileName,
    content,
    fileIds,
    backupsFolderId,
    createBackupFirst = true
) {
    const existing = await findFileInFolder(folderId, fileName);

    if (existing) {
        if (createBackupFirst && backupsFolderId) {
            try {
                const currentContent = await readDriveFileContent(existing.id);
                await createBackup(backupsFolderId, fileName, currentContent);
            } catch (e) {
                console.warn("Backup skipped:", e);
            }
        }

        await updateDriveFile(existing.id, content);
        logFileUpdated(fileName);

        return {
            action: "updated",
            fileId: existing.id,
            fileName
        };
    }

    const result = await createDriveFileInFolder(
        folderId,
        fileName,
        content
    );

    logFileCreated(fileName);

    return {
        action: "created",
        fileId: result.id,
        fileName
    };
}

async function getProjectFiles(folderId) {
    if (!folderId) return [];

    const result = await listDriveFiles(folderId);
    const files = result.files || [];

    return files
        .filter(f => f.mimeType !== "application/vnd.google-apps.folder")
        .map(f => ({
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            modifiedTime: f.modifiedTime
        }));
}

async function readProjectFiles(folderId, fileIds) {
    const files = await getProjectFiles(folderId);
    const contents = {};

    for (const file of files) {
        if (file.name === "project.json") continue;

        try {
            contents[file.name] = await readDriveFileContent(file.id);
            fileIds[file.name] = file.id;
        } catch (e) {
            console.warn(`Could not read ${file.name}:`, e);
        }
    }

    return { files, contents, fileIds };
}

async function readProjectFile(folderId, fileName, fileIds) {
    if (fileIds && fileIds[fileName]) {
        try {
            return await readDriveFileContent(fileIds[fileName]);
        } catch (e) {
            console.warn("Cached file ID failed, searching folder");
        }
    }

    const found = await findFileInFolder(folderId, fileName);
    if (!found) return null;

    return await readDriveFileContent(found.id);
}

async function initializeProjectFiles(project) {
    const backupsFolderId = await ensureBackupsFolder(project);
    const fileIds = { ...(project.fileIds || {}) };

    for (const fileDef of DEFAULT_PROJECT_FILES) {
        const existing = await findFileInFolder(project.folderId, fileDef.name);
        if (existing) {
            fileIds[fileDef.name] = existing.id;
            continue;
        }

        let content;
        if (fileDef.generator === "index") {
            content = generateIndexHtml(project.name);
        } else if (fileDef.generator === "style") {
            content = generateStyleCss();
        } else {
            content = generateAppJs();
        }

        const result = await createDriveFileInFolder(
            project.folderId,
            fileDef.name,
            content
        );

        fileIds[fileDef.name] = result.fileId || result.id;
        logFileCreated(fileDef.name);
    }

    updateProject(project.id, {
        fileIds,
        backupsFolderId
    });

    return findProjectById(project.id);
}

function buildFileTree(files) {
    const tree = [];
    const folders = {};

    files.forEach(file => {
        if (file.name.includes("/")) {
            const parts = file.name.split("/");
            const folderName = parts[0];
            if (!folders[folderName]) {
                folders[folderName] = {
                    type: "folder",
                    name: folderName,
                    children: []
                };
                tree.push(folders[folderName]);
            }
            folders[folderName].children.push({
                type: "file",
                name: parts.slice(1).join("/"),
                fullName: file.name,
                id: file.id,
                modifiedTime: file.modifiedTime
            });
        } else {
            tree.push({
                type: "file",
                name: file.name,
                fullName: file.name,
                id: file.id,
                modifiedTime: file.modifiedTime
            });
        }
    });

    tree.sort((a, b) => {
        if (a.type === "folder" && b.type === "file") return -1;
        if (a.type === "file" && b.type === "folder") return 1;
        return a.name.localeCompare(b.name);
    });

    return tree;
}
