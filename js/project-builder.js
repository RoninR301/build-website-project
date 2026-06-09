const projectBuildState = {

    folders: [],

    files: [],

    lastPrompt: "",

    lastResponse: ""

};

function resetBuildState() {

    projectBuildState.folders = [];

    projectBuildState.files = [];

}

function addBuildFolder(
    folderName
) {

    projectBuildState.folders.push(
        folderName
    );

}

function addBuildFile(
    fileName
) {

    projectBuildState.files.push(
        fileName
    );

}

function getBuildFolders() {

    return projectBuildState.folders;

}

function getBuildFiles() {

    return projectBuildState.files;

}

function saveBuildPrompt(
    prompt
) {

    projectBuildState.lastPrompt =
    prompt;

}

function saveBuildResponse(
    response
) {

    projectBuildState.lastResponse =
    response;

}

function buildDefaultWebsitePlan() {

    resetBuildState();

    addBuildFolder(
        "css"
    );

    addBuildFolder(
        "js"
    );

    addBuildFolder(
        "assets"
    );

    addBuildFile(
        "index.html"
    );

    addBuildFile(
        "css/style.css"
    );

    addBuildFile(
        "js/app.js"
    );

}

function buildProjectSummary() {

    let output =

`PROJECT BUILD PLAN

Folders:
`;

    getBuildFolders().forEach(
        folder => {

            output +=
            "\n• " +
            folder;

        }
    );

    output +=

`\n\nFiles:
`;

    getBuildFiles().forEach(
        file => {

            output +=
            "\n• " +
            file;

        }
    );

    return output;

}

function generateProjectPlan(
    prompt,
    response
) {

    saveBuildPrompt(
        prompt
    );

    saveBuildResponse(
        response
    );

    buildDefaultWebsitePlan();

    return buildProjectSummary();

}