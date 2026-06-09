const GOOGLE_DRIVE_API =
"https://www.googleapis.com/drive/v3";

async function getDriveFolder(
    folderId
) {

    const token =
    getCurrentDriveToken();

    if (!token) {

        throw new Error(
            "Drive Not Connected"
        );
    }

    const response =
    await fetch(

        `${GOOGLE_DRIVE_API}/files/${folderId}`,

        {
            headers: {

                Authorization:
                `Bearer ${token}`

            }
        }

    );

    return await response.json();

}

async function listDriveFiles(
    folderId
) {

    const token =
    getCurrentDriveToken();

    if (!token) {

        throw new Error(
            "Drive Not Connected"
        );
    }

    const response =
    await fetch(

        `${GOOGLE_DRIVE_API}/files?q='${folderId}'+in+parents`,

        {
            headers: {

                Authorization:
                `Bearer ${token}`

            }
        }

    );

    return await response.json();

}

async function createDriveFolder(
    folderName
) {

    const token =
    getCurrentDriveToken();

    if (!token) {

        throw new Error(
            "Drive Not Connected"
        );
    }

    const response =
    await fetch(

        "https://www.googleapis.com/drive/v3/files",

        {
            method: "POST",

            headers: {

                Authorization:
                `Bearer ${token}`,

                "Content-Type":
                "application/json"

            },

            body: JSON.stringify({

                name:
                folderName,

                mimeType:
                "application/vnd.google-apps.folder"

            })

        }

    );

    return await response.json();

}

async function getDriveFile(
    fileId
) {

    const token =
    getCurrentDriveToken();

    if (!token) {

        throw new Error(
            "Drive Not Connected"
        );
    }

    const response =
    await fetch(

        `${GOOGLE_DRIVE_API}/files/${fileId}`,

        {
            headers: {

                Authorization:
                `Bearer ${token}`

            }
        }

    );

    return await response.json();

}

async function createProjectDriveFolder(
projectName
) {

const folder =

await createDriveFolder(
    projectName
);

setDriveFolderId(
    folder.id
);

return folder;

}