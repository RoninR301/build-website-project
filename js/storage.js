const STORAGE_KEY = "folder_agent_projects";

function getProjects() {
    const projects = localStorage.getItem(STORAGE_KEY);
    if (!projects) return [];
    return JSON.parse(projects);
}

function saveProjects(projects) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function createProjectRecord(data) {
    const projects = getProjects();

    const project = {
        id: Date.now().toString(),
        name: data.name,
        folderId: data.folderId || "",
        backupsFolderId: data.backupsFolderId || "",
        fileIds: data.fileIds || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: data.settings || {},
        chatHistory: data.chatHistory || [],
        buildHistory: data.buildHistory || [],
        workspaceState: data.workspaceState || {}
    };

    projects.unshift(project);
    saveProjects(projects);
    return project;
}

function updateProject(projectId, data) {
    const projects = getProjects();

    const updatedProjects = projects.map(project => {
        if (project.id === projectId) {
            return {
                ...project,
                ...data,
                updatedAt: new Date().toISOString()
            };
        }
        return project;
    });

    saveProjects(updatedProjects);
}

function deleteProjectRecord(projectId) {
    const projects = getProjects();
    const filtered = projects.filter(p => p.id !== projectId);
    saveProjects(filtered);
}

function findProjectById(projectId) {
    return getProjects().find(
        p => String(p.id) === String(projectId)
    ) || null;
}

function findProjectByName(name) {
    const normalized = name.trim().toLowerCase();
    return getProjects().find(
        p => p.name.trim().toLowerCase() === normalized
    ) || null;
}
