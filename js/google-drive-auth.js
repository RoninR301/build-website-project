const GOOGLE_CLIENT_ID =
"YOUR_GOOGLE_CLIENT_ID";

const GOOGLE_SCOPES =
"https://www.googleapis.com/auth/drive.file";

let googleAccessToken =
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

clearDriveToken();

}