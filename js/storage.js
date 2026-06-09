const STORAGE_KEY = "folder_agent_projects";

function getProjects() {
const projects = localStorage.getItem(STORAGE_KEY);

if (!projects) {
    return [];
}

return JSON.parse(projects);

}

function saveProjects(projects) {
localStorage.setItem(
STORAGE_KEY,
JSON.stringify(projects)
);
}

function createProject(projectName) {

const projects = getProjects();

const project = {
    id: Date.now().toString(),
    name: projectName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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

function deleteProject(projectId) {

const projects = getProjects();

const filteredProjects = projects.filter(
    project => project.id !== projectId
);

saveProjects(filteredProjects);

}