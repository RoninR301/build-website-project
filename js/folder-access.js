const folderHandles = {};

function selectProjectFolder(projectId) {

const currentPath =
getFolderPath(projectId) ||
"/storage/emulated/0/MyProject";

const folderPath = prompt(
    "Enter Project Folder Path",
    currentPath
);

if (
    !folderPath ||
    folderPath.trim() === ""
) {
    return null;
}

folderHandles[projectId] = {
    path: folderPath
};

localStorage.setItem(
    "folder_path_" + projectId,
    folderPath
);

return folderHandles[projectId];

}

function saveFolderReference(
projectId
) {

localStorage.setItem(
    "folder_" + projectId,
    "connected"
);

}

function getFolderReference(
projectId
) {

return localStorage.getItem(
    "folder_" + projectId
);

}

function isFolderConnected(
projectId
) {

return (
    getFolderReference(projectId)
    === "connected"
);

}

function getFolderHandle(
projectId
) {

return folderHandles[projectId];

}

function getFolderPath(
projectId
) {

return localStorage.getItem(
    "folder_path_" + projectId
);

}

function updateFolderPath(
projectId,
folderPath
) {

localStorage.setItem(
    "folder_path_" + projectId,
    folderPath
);

}

function disconnectFolder(
projectId
) {

localStorage.removeItem(
    "folder_" + projectId
);

localStorage.removeItem(
    "folder_path_" + projectId
);

delete folderHandles[
    projectId
];

}