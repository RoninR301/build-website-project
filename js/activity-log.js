const activityLogs = {};

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
    activityLogs[projectId] = saved ? JSON.parse(saved) : [];
}

function loadActivityLogs() {
    getProjects().forEach(p => loadProjectActivityLogs(p.id));
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
    container.textContent = pid ? buildActivitySummary(pid) : "No activity yet";
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
    addActivityLog("Scanned project from GitHub");
}

function logPromptSent(prompt) {
    addActivityLog(`Prompt sent: ${prompt.substring(0, 60)}`);
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

function logGitHubCommit(message) {
    addActivityLog(`GitHub commit: ${message}`);
}

function logAIRequest(prompt) {
    addActivityLog(`AI request: ${prompt.substring(0, 50)}...`);
}

function logAIResponse(summary) {
    addActivityLog(`AI response: ${summary}...`);
}

function logGeminiPipelineStep(step, details) {
    addActivityLog(`Gemini ${step}: ${String(details).substring(0, 120)}`);
}

function logAIError(message) {
    addActivityLog(`AI error: ${String(message).substring(0, 150)}`);
}

function logAIFileUpdate(fileName, action, success, detail) {
    const status = success ? "OK" : "FAILED";
    const msg = detail
        ? `File ${status}: ${action} ${fileName} — ${detail}`
        : `File ${status}: ${action} ${fileName}`;
    addActivityLog(msg);
}

function logAIParseResult(success, summary) {
    addActivityLog(`AI parse ${success ? "OK" : "FAILED"}: ${String(summary).substring(0, 100)}`);
}

loadActivityLogs();
