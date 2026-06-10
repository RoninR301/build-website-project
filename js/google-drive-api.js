const GOOGLE_DRIVE_API = "https://www.googleapis.com/drive/v3";

async function driveFetch(url, options = {}) {
    const token = getCurrentDriveToken();
    if (!token) throw new Error("Drive Not Connected");

    const response = await fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            ...options.headers
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error?.message || `Drive API error: ${response.status}`);
    }

    return data;
}

async function getDriveFolder(folderId) {
    return driveFetch(`${GOOGLE_DRIVE_API}/files/${folderId}`);
}

async function listDriveFiles(folderId) {
    const query = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
    return driveFetch(`${GOOGLE_DRIVE_API}/files?q=${query}&fields=files(id,name,mimeType,modifiedTime,parents)`);
}

async function findFileInFolder(folderId, fileName) {
    const result = await listDriveFiles(folderId);
    const files = result.files || [];
    return files.find(f => f.name === fileName) || null;
}

async function readDriveFileContent(fileId) {
    const token = getCurrentDriveToken();
    if (!token) throw new Error("Drive Not Connected");

    const response = await fetch(
        `${GOOGLE_DRIVE_API}/files/${fileId}?alt=media`,
        { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
        throw new Error(`Failed to read file: ${response.status}`);
    }

    return await response.text();
}

async function getDriveFile(fileId) {
    return driveFetch(`${GOOGLE_DRIVE_API}/files/${fileId}`);
}

async function createDriveFolder(folderName, parentId = null) {
    const metadata = {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder"
    };

    if (parentId) {
        metadata.parents = [parentId];
    }

    return driveFetch(`${GOOGLE_DRIVE_API}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata)
    });
}

async function createDriveSubfolder(parentId, folderName) {
    return createDriveFolder(folderName, parentId);
}

async function createProjectDriveFolder(projectName) {
    const folder = await createDriveFolder(`FolderAgent_${projectName}`);
    setDriveFolderId(folder.id);
    return folder;
}

async function trashDriveFile(fileId) {
    return driveFetch(`${GOOGLE_DRIVE_API}/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trashed: true })
    });
}

async function trashDriveFolder(folderId) {
    const files = await listDriveFiles(folderId);

    for (const file of files.files || []) {
        if (file.mimeType === "application/vnd.google-apps.folder") {
            await trashDriveFolder(file.id);
        }
        await trashDriveFile(file.id);
    }

    return trashDriveFile(folderId);
}
