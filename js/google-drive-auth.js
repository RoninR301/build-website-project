const GOOGLE_CLIENT_ID =
"537971961349-727bf6k3uq38pnd113mr9ch0a8kc9rcl.apps.googleusercontent.com";

const GOOGLE_SCOPES =
"https://www.googleapis.com/auth/drive.file";

let googleAccessToken =
null;

let tokenClient =
null;

function saveDriveToken(
token
) {

localStorage.setItem(
    "google_drive_token",
    token
);

}

function getDriveToken() {

return localStorage.getItem(
    "google_drive_token"
);

}

function clearDriveToken() {

localStorage.removeItem(
    "google_drive_token"
);

}

function setDriveToken(
token
) {

googleAccessToken =
token;

saveDriveToken(
    token
);

}

function getCurrentDriveToken() {

return (
    googleAccessToken ||
    getDriveToken()
);

}

function isDriveConnected() {

return !!getCurrentDriveToken();

}

function disconnectDrive() {

googleAccessToken =
null;

tokenClient =
null;

clearDriveToken();

}

function loadGoogleIdentity() {

return new Promise(
    (resolve, reject) => {

        if (
            window.google &&
            google.accounts
        ) {

            resolve();
            return;
        }

        const script =
        document.createElement(
            "script"
        );

        script.src =
        "https://accounts.google.com/gsi/client";

        script.onload =
        () => resolve();

        script.onerror =
        () => reject(
            new Error(
                "Google Identity Load Failed"
            )
        );

        document.head.appendChild(
            script
        );

    }
);

}

async function connectGoogleDrive() {

await loadGoogleIdentity();

return new Promise(
(resolve, reject) => {

tokenClient =

google.accounts.oauth2
.initTokenClient({

client_id:
GOOGLE_CLIENT_ID,

scope:
GOOGLE_SCOPES,

callback:
(response) => {

if (
response.error
) {

reject(
response
);

return;
}

setDriveToken(
response.access_token
);

resolve(
response.access_token
);

}

});

tokenClient.requestAccessToken();

});
}

async function ensureDriveConnection() {

if (
isDriveConnected()
) {

return getCurrentDriveToken();

}

return await connectGoogleDrive();

}

(function initDriveToken() {
    const saved = getDriveToken();
    if (saved) {
        googleAccessToken = saved;
    }
})();
