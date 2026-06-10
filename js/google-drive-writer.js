let currentDriveFolderId = null;

function setDriveFolderId(folderId) {
    currentDriveFolderId = folderId;
}

function getDriveFolderId() {
    return currentDriveFolderId;
}

async function createDriveFileInFolder(folderId, fileName, content) {
    const token = getCurrentDriveToken();
    if (!token) throw new Error("Drive Not Connected");
    if (!folderId) throw new Error("Drive Folder Missing");

    const metadata = {
        name: fileName,
        parents: [folderId]
    };

    const form = new FormData();
    form.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append(
        "file",
        new Blob([content], { type: "text/plain" })
    );

    const response = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name",
        {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: form
        }
    );

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error?.message || "File upload failed");
    }

    return data;
}

async function createDriveFile(fileName, content) {
    const folderId = getDriveFolderId();
    return createDriveFileInFolder(folderId, fileName, content);
}

async function updateDriveFile(fileId, content) {
    const token = getCurrentDriveToken();
    if (!token) throw new Error("Drive Not Connected");

    const response = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
            body: content
        }
    );

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error?.message || "File update failed");
    }

    return await response.json();
}

async function uploadGeneratedFiles() {
    const files = getGeneratedFiles();

    for (const file of files) {
        await createOrUpdateFile(
            getDriveFolderId(),
            file.fileName,
            file.content,
            getCurrentProject()?.fileIds || {},
            getCurrentProject()?.backupsFolderId
        );
    }

    return true;
}
