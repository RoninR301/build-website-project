const PROJECT_REOPEN_KEY =
"last_open_project";

function saveLastOpenedProject(
    projectId
) {

    localStorage.setItem(
        PROJECT_REOPEN_KEY,
        projectId
    );

}

function getLastOpenedProject() {

    return localStorage.getItem(
        PROJECT_REOPEN_KEY
    );

}

function clearLastOpenedProject() {

    localStorage.removeItem(
        PROJECT_REOPEN_KEY
    );

}

function findProjectById(
    projectId
) {

    const projects =
    getProjects();

    return projects.find(
        project =>
        String(project.id) ===
        String(projectId)
    );

}

function reopenLastProject() {

    const projectId =
    getLastOpenedProject();

    if (!projectId) {
        return false;
    }

    const project =
    findProjectById(
        projectId
    );

    if (!project) {
        return false;
    }

    if (
        typeof openProject !==
        "function"
    ) {
        return false;
    }

    openProject(
        project
    );

    return true;

}

function buildReopenSummary() {

    const projectId =
    getLastOpenedProject();

    if (!projectId) {

        return `
No Saved Project
`;
    }

    const project =
    findProjectById(
        projectId
    );

    if (!project) {

        return `
Saved Project Missing
`;
    }

    return `

LAST PROJECT

Name:
${project.name}

ID:
${project.id}

Folder:
${getFolderPath(
    project.id
) || "Not Connected"}

`;
}