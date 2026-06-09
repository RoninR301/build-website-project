let currentDriveFolderId =
null;

function setDriveFolderId(
folderId
) {

currentDriveFolderId =
folderId;

localStorage.setItem(
    "drive_folder_id",
    folderId
);

}

function getDriveFolderId() {

return (

    currentDriveFolderId ||

    localStorage.getItem(
        "drive_folder_id"
    )

);

}

async function createDriveFile(
fileName,
content
) {

const token =
getCurrentDriveToken();

const folderId =
getDriveFolderId();

if (!token) {

    throw new Error(
        "Drive Not Connected"
    );
}

if (!folderId) {

    throw new Error(
        "Drive Folder Missing"
    );
}

const metadata = {

    name:
    fileName,

    parents: [
        folderId
    ]

};

const form =
new FormData();

form.append(

    "metadata",

    new Blob(
        [
            JSON.stringify(
                metadata
            )
        ],
        {
            type:
            "application/json"
        }
    )

);

form.append(

    "file",

    new Blob(
        [content],
        {
            type:
            "text/plain"
        }
    )

);

const response =
await fetch(

"https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",

{
    method: "POST",

    headers: {

        Authorization:
        `Bearer ${token}`

    },

    body: form
}

);

return await response.json();

}

async function updateDriveFile(
fileId,
content
) {

const token =
getCurrentDriveToken();

const response =
await fetch(

`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,

{
    method: "PATCH",

    headers: {

        Authorization:
        `Bearer ${token}`

    },

    body:
    content
}

);

return await response.json();

}