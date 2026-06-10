let currentFolderHandle = null;

async function selectRealFolder() {

if (
    !window.showDirectoryPicker
) {

    alert(
        "Folder Picker Not Supported"
    );

    return null;
}

try {

    const folderHandle =
    await window
    .showDirectoryPicker();

    currentFolderHandle =
    folderHandle;

    return folderHandle;

} catch (error) {

    console.error(
        error
    );

    return null;
}

}

function getCurrentFolderHandle() {

return currentFolderHandle;

}

async function createFileInFolder(
fileName,
content
) {

const folderHandle =
getCurrentFolderHandle();

if (!folderHandle) {

    throw new Error(
        "No Folder Selected"
    );
}

const fileHandle =
await folderHandle.getFileHandle(
    fileName,
    {
        create: true
    }
);

const writable =
await fileHandle
.createWritable();

await writable.write(
    content
);

await writable.close();

return true;

}

async function readFileFromFolder(
fileName
) {

const folderHandle =
getCurrentFolderHandle();

if (!folderHandle) {

    throw new Error(
        "No Folder Selected"
    );
}

const fileHandle =
await folderHandle.getFileHandle(
    fileName
);

const file =
await fileHandle.getFile();

return await file.text();

}

async function updateFileInFolder(
fileName,
content
) {

return await createFileInFolder(
    fileName,
    content
);

}