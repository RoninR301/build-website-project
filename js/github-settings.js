const GITHUB_SETTINGS_KEY = "folder_agent_github_settings";

const DEFAULT_GITHUB_SETTINGS = {
    githubToken: "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",
    repoOwner: "roninr301",
    repoName: "folder-agent-projects",
    baseFolder: "projects"
};

function getGitHubSettings() {
    const saved = localStorage.getItem(GITHUB_SETTINGS_KEY);
    if (!saved) return { ...DEFAULT_GITHUB_SETTINGS };
    return { ...DEFAULT_GITHUB_SETTINGS, ...JSON.parse(saved) };
}

function saveGitHubSettings(settings) {
    const merged = { ...getGitHubSettings(), ...settings };
    localStorage.setItem(GITHUB_SETTINGS_KEY, JSON.stringify(merged));
    return merged;
}

function loadGitHubSettingsToUI() {
    const s = getGitHubSettings();
    const tokenEl = document.getElementById("githubToken");
    const ownerEl = document.getElementById("githubOwner");
    const repoEl = document.getElementById("githubRepo");
    const baseEl = document.getElementById("githubBaseFolder");

    if (tokenEl) tokenEl.value = s.githubToken || "";
    if (ownerEl) ownerEl.value = s.repoOwner || "";
    if (repoEl) repoEl.value = s.repoName || "";
    if (baseEl) baseEl.value = s.baseFolder || "projects";
}

function readGitHubSettingsFromUI() {
    return {
        githubToken: document.getElementById("githubToken")?.value.trim() || "",
        repoOwner: document.getElementById("githubOwner")?.value.trim() || "",
        repoName: document.getElementById("githubRepo")?.value.trim() || "",
        baseFolder: document.getElementById("githubBaseFolder")?.value.trim() || "projects"
    };
}

function getProjectGitHubPath(projectName) {
    const { baseFolder } = getGitHubSettings();
    return `${baseFolder}/${projectName}`;
}

function getFileGitHubPath(projectName, fileName) {
    return `${getProjectGitHubPath(projectName)}/${fileName}`;
}
