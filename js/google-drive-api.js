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