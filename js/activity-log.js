const activityLogs = {};
const GLOBAL_LOG_KEY = "activity_logs";

function getProjectLogKey(projectId) {
    return `activity_logs_${projectId}`;
}

function addActivityLog(message, projectId) {
    const pid = projectId || getCurrentProject()?.id || "global";

    if (!activityLogs[pid]) {
        activityLogs[pid] = [];
    }

    const log = {
        id: Date.now(),
        message,
        time: new Date().toLocaleTimeString()
    };

    activityLogs[pid].push(log);
    saveActivityLogs(pid);
    renderActivityLog(pid);
    return log;
}

function getActivityLogs(projectId) {
    const pid = projectId || getCurrentProject()?.id || "global";
    return activityLogs[pid] || [];
}

function clearProjectActivityLogs(projectId) {
    delete activityLogs[projectId];
    localStorage.removeItem(getProjectLogKey(projectId));
}

function saveActivityLogs(projectId) {
    const pid = projectId || getCurrentProject()?.id || "global";
    localStorage.setItem(
        getProjectLogKey(pid),
        JSON.stringify(activityLogs[pid] || [])
    );
}

function loadProjectActivityLogs(projectId) {
    if (!projectId) return;

    const saved = localStorage.getItem(getProjectLogKey(projectId));
    if (!saved) {
        activityLogs[projectId] = [];
        return;
    }

    try {
        activityLogs[projectId] = JSON.parse(saved);
    } catch (e) {
        activityLogs[projectId] = [];
    }
}

function loadActivityLogs() {
    const projects = getProjects();
    projects.forEach(p => loadProjectActivityLogs(p.id));

    const global = localStorage.getItem(GLOBAL_LOG_KEY);
    if (global) {
        try {
            activityLogs.global = JSON.parse(global);
        } catch (e) {
            activityLogs.global = [];
        }
    }
}

function buildActivitySummary(projectId) {
    const logs = getActivityLogs(projectId);
    if (logs.length === 0) return "No activity yet";

    return logs
        .slice(-20)
        .reverse()
        .map(log => `${log.time}  ${log.message}`)
        .join("\n");
}

function renderActivityLog(projectId) {
    const container = document.getElementById("activityLog");
    if (!container) return;

    const pid = projectId || getCurrentProject()?.id;
    if (!pid) {
        container.textContent = "No activity yet";
        return;
    }

    container.textContent = buildActivitySummary(pid);
}

function logProjectCreated(name) {
    addActivityLog(`Created project: ${name}`);
}

function logProjectOpened(name) {
    addActivityLog(`Opened project: ${name}`);
}

function logProjectDeleted(name) {
    addActivityLog(`Deleted project: ${name}`);
}

function logProjectScanned() {
    addActivityLog("Scanned project folder");
}

function logPromptSent(prompt) {
    addActivityLog(`Prompt sent: ${prompt.substring(0, 60)}...`);
}

function logBuildCompleted() {
    addActivityLog("Build completed");
}

function logFileCreated(fileName) {
    addActivityLog(`Created ${fileName}`);
}

function logFileUpdated(fileName) {
    addActivityLog(`Updated ${fileName}`);
}

function logFileBackup(fileName, version) {
    addActivityLog(`Backup ${fileName} → v${version}`);
}

function logDriveSync(message) {
    addActivityLog(`Drive sync: ${message}`);
}

function logGeminiRequest(prompt) {
    addActivityLog(`Gemini request: ${prompt.substring(0, 50)}...`);
}

loadActivityLogs();
