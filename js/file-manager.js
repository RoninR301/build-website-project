const DEFAULT_PROJECT_FILES = [
    { name: "index.html", generator: "index" },
    { name: "style.css", generator: "style" },
    { name: "app.js", generator: "app" }
];

const backupVersions = {};

function getProjectPath(project) {
    return project.githubPath || getProjectGitHubPath(project.name);
}

function getFilePath(project, fileName) {
    const base = getProjectPath(project);
    return `${base}/${fileName}`;
}

async function createBackup(project, fileName, currentContent) {
    if (!currentContent) return null;

    const key = `${project.name}/${fileName}`;
    backupVersions[key] = (backupVersions[key] || 0) + 1;
    const version = backupVersions[key];

    const ext = fileName.includes(".")
        ? fileName.substring(fileName.lastIndexOf("."))
        : "";
    const base = fileName.replace(ext, "");
    const backupName = `backups/${base}-v${version}${ext}`;
    const backupPath = getFilePath(project, backupName);

    let existingSha = null;
    try {
        const existing = await readGitHubFile(backupPath);
        existingSha = existing.sha;
    } catch (e) { /* new backup */ }

    const result = await writeGitHubFile(
        backupPath,
        currentContent,
        existingSha,
        `Backup ${fileName} v${version}`
    );

    logFileBackup(fileName, version);
    logGitHubCommit(`Backup ${backupName}`);
    return result;
}

async function createOrUpdateFile(project, fileName, content, createBackupFirst = true) {
    const filePath = getFilePath(project, fileName);
    let existingSha = null;
    let isUpdate = false;

    try {
        const existing = await readGitHubFile(filePath);
        existingSha = existing.sha;
        isUpdate = true;

        if (createBackupFirst) {
            await createBackup(project, fileName, existing.content);
        }
    } catch (e) {
        const notFound = e.message.includes("404") ||
            e.message.toLowerCase().includes("not found");
        if (!notFound) throw e;
    }

    const result = await writeGitHubFile(
        filePath,
        content,
        existingSha,
        isUpdate ? `Update ${fileName}` : `Create ${fileName}`
    );

    const fileShas = { ...(project.fileShas || {}) };
    fileShas[fileName] = result.sha;
    updateProject(project.id, { fileShas });

    if (isUpdate) {
        logFileUpdated(fileName);
    } else {
        logFileCreated(fileName);
    }
    logGitHubCommit(`${isUpdate ? "Updated" : "Created"} ${fileName}`);

    return {
        action: isUpdate ? "updated" : "created",
        sha: result.sha,
        fileName,
        commit: result.commit
    };
}

async function getProjectFiles(project) {
    const projectPath = getProjectPath(project);
    const items = await listGitHubDirectory(projectPath);

    return items
        .filter(item => item.type === "file")
        .map(item => ({
            name: item.name,
            path: item.path,
            sha: item.sha,
            size: item.size
        }));
}

async function listProjectTree(project) {
    const projectPath = getProjectPath(project);
    return buildTreeFromGitHub(projectPath);
}

async function buildTreeFromGitHub(dirPath) {
    const items = await listGitHubDirectory(dirPath);
    const tree = [];

    for (const item of items) {
        if (item.name === "project.json") continue;

        const relativeName = item.path.replace(`${dirPath}/`, "");

        if (item.type === "dir") {
            const children = await buildTreeFromGitHub(item.path);
            tree.push({
                type: "folder",
                name: item.name,
                path: item.path,
                children: children.map(c => ({
                    ...c,
                    fullName: c.fullName || `${item.name}/${c.name}`
                }))
            });
        } else {
            tree.push({
                type: "file",
                name: item.name,
                fullName: relativeName,
                path: item.path,
                sha: item.sha
            });
        }
    }

    tree.sort((a, b) => {
        if (a.type === "folder" && b.type === "file") return -1;
        if (a.type === "file" && b.type === "folder") return 1;
        return a.name.localeCompare(b.name);
    });

    return tree;
}

async function readProjectFiles(project) {
    const files = await getProjectFiles(project);
    const contents = {};
    const fileShas = { ...(project.fileShas || {}) };

    for (const file of files) {
        if (file.name === "project.json") continue;

        try {
            const data = await readGitHubFile(file.path);
            contents[file.name] = data.content;
            fileShas[file.name] = data.sha;
        } catch (e) {
            console.warn(`Could not read ${file.name}:`, e);
        }
    }

    return { files, contents, fileShas };
}

async function readProjectFile(project, fileName) {
    const filePath = getFilePath(project, fileName);
    const data = await readGitHubFile(filePath);
    return data.content;
}

async function initializeProjectFiles(project) {
    const fileShas = { ...(project.fileShas || {}) };

    await writeGitHubFile(
        getFilePath(project, "backups/.gitkeep"),
        "",
        null,
        "Create backups folder"
    );

    for (const fileDef of DEFAULT_PROJECT_FILES) {
        const filePath = getFilePath(project, fileDef.name);

        try {
            const existing = await readGitHubFile(filePath);
            fileShas[fileDef.name] = existing.sha;
            continue;
        } catch (e) { /* create new */ }

        let content;
        if (fileDef.generator === "index") {
            content = generateIndexHtml(project.name);
        } else if (fileDef.generator === "style") {
            content = generateStyleCss();
        } else {
            content = generateAppJs();
        }

        const result = await writeGitHubFile(
            filePath,
            content,
            null,
            `Create ${fileDef.name}`
        );

        fileShas[fileDef.name] = result.sha;
        logFileCreated(fileDef.name);
        logGitHubCommit(`Created ${fileDef.name}`);
    }

    updateProject(project.id, { fileShas });
    return findProjectById(project.id);
}

function buildFileTreeFromScan(tree) {
    return tree;
}
