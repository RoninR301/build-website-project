const PROJECT_REOPEN_KEY = "last_open_project";

function saveLastOpenedProject(projectId) {
    localStorage.setItem(PROJECT_REOPEN_KEY, projectId);
}

function getLastOpenedProject() {
    return localStorage.getItem(PROJECT_REOPEN_KEY);
}

function clearLastOpenedProject() {
    localStorage.removeItem(PROJECT_REOPEN_KEY);
}

function reopenLastProject() {
    const projectId = getLastOpenedProject();
    if (!projectId) return false;

    const project = findProjectById(projectId);
    if (!project) return false;

    if (typeof openProject !== "function") return false;

    openProject(project);
    return true;
}
