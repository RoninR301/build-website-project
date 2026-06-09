const createProjectBtn =
document.getElementById("createProjectBtn");

const saveProjectBtn =
document.getElementById("saveProjectBtn");

const projectModal =
document.getElementById("projectModal");

const projectNameInput =
document.getElementById("projectName");

const projectsList =
document.getElementById("projectsList");

const workspaceScreen =
document.getElementById("workspaceScreen");

const workspaceProjectName =
document.getElementById("workspaceProjectName");

const workspaceFolderPath =
document.getElementById("workspaceFolderPath");

const projectSummary =
document.getElementById("projectSummary");

const scanProjectBtn =
document.getElementById("scanProjectBtn");

const geminiApiKeyInput =
document.getElementById("geminiApiKey");

const promptInput =
document.getElementById("promptInput");

const sendPromptBtn =
document.getElementById("sendPromptBtn");

const geminiResponse =
document.getElementById("geminiResponse");

let currentProject = null;

function openModal() {

projectModal.classList.remove(
    "hidden"
);

projectNameInput.focus();

}

function closeModal() {

projectModal.classList.add(
    "hidden"
);

projectNameInput.value = "";

}

function updateProjectSummary(
project
) {

projectSummary.textContent =

`
Project Loaded

Name:
${project.name}

Folder:
${getFolderPath(project.id) || "Not Connected"}

Status:
Ready
`;
}

function openProject(
project
) {

currentProject = project;

workspaceScreen.classList.remove(
    "hidden"
);

workspaceProjectName.textContent =
project.name;

workspaceFolderPath.textContent =
getFolderPath(project.id) ||
"No Folder Connected";

updateProjectSummary(
    project
);

logProjectOpened(
    project.name
);

saveLastOpenedProject(
    project.id
);

}

function handleScanProject() {

if (!currentProject) {

    alert(
        "No Project Open"
    );

    return;
}

const summary =
runProjectScan(
    currentProject.id
);

projectSummary.textContent =
summary;

logProjectScanned();

}

async function createRealProjectFiles() {

try {

    await createFileInFolder(
        "index.html",
        "<h1>Hello World</h1>"
    );

    await createFileInFolder(
        "style.css",
        "body{}"
    );

    await createFileInFolder(
        "app.js",
        "console.log('ready');"
    );

    return true;

} catch (error) {

    console.error(
        error
    );

    return false;
}

}

async function handleGeminiPrompt() {

const apiKey =
geminiApiKeyInput.value.trim();

const userPrompt =
promptInput.value.trim();

if (!apiKey) {

    alert(
        "Enter Gemini API Key"
    );
    
logPromptSent(
    userPrompt
);

    return;
}

if (!userPrompt) {

    alert(
        "Enter Prompt"
    );

    return;
}

if (!currentProject) {

    alert(
        "Open Project First"
    );

    return;
}

saveGeminiKey(
    apiKey
);

const folderHandle =
await selectRealFolder();

if (!folderHandle) {

    geminiResponse.textContent =
    "Folder Not Selected";

    return;
}

geminiResponse.textContent =
"Creating Files...";

const created =
await createRealProjectFiles();

if (!created) {

    geminiResponse.textContent =
    "File Creation Failed";

    return;
}

const agentPrompt =
buildAgentPrompt(
    currentProject,
    userPrompt
);

const result =
await sendToGemini(
    agentPrompt
);

if (!result.success) {

    geminiResponse.textContent =
    result.message;

    return;
}

const buildPlan =
generateProjectPlan(
    userPrompt,
    result.response
);

const writeQueue =
buildWriteSummary();

generateProjectFiles(
    userPrompt
);

const generatedFiles =
buildGeneratedFilesSummary();

geminiResponse.textContent =

`
PROJECT PLAN

${buildPlan}

----------------

WRITE QUEUE

${writeQueue}

----------------

GENERATED FILES

${generatedFiles}

----------------

AI RESPONSE

${result.response}
`;

logBuildCompleted();

}

function renderProjects() {

const projects =
getProjects();

projectsList.innerHTML = "";

if (
    projects.length === 0
) {

    projectsList.innerHTML =
    "<p>No Projects Yet</p>";

    return;
}

projects.forEach(project => {

    const card =
    document.createElement("div");

    card.className =
    "project-card";

    card.innerHTML =
    `
    <h3>${project.name}</h3>
    <p>Project Ready</p>
    `;

    card.addEventListener(
        "click",
        () => {

            if (
                !isFolderConnected(
                    project.id
                )
            ) {

                const folderHandle =
                selectProjectFolder(
                    project.id
                );

                if (!folderHandle) {
                    return;
                }

                saveFolderReference(
                    project.id
                );

                return;
            }

            openProject(
                project
            );
        }
    );

    projectsList.appendChild(
        card
    );
});

}

function handleCreateProject() {

const name =
projectNameInput.value.trim();

if (!name) {

    alert(
        "Enter Project Name"
    );

    return;
}

createProject(
    name
);

renderProjects();

closeModal();

}

function initApp() {

renderProjects();

reopenLastProject();

createProjectBtn.addEventListener(
    "click",
    openModal
);

saveProjectBtn.addEventListener(
    "click",
    handleCreateProject
);

scanProjectBtn.addEventListener(
    "click",
    handleScanProject
);

sendPromptBtn.addEventListener(
    "click",
    handleGeminiPrompt
);

projectModal.addEventListener(
    "click",
    (e) => {

        if (
            e.target ===
            projectModal
        ) {

            closeModal();
        }
    }
);

}

initApp();