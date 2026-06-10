let currentProject = null;
let workspaceState = {
    openFile: null,
    editorContent: "",
    fileTree: [],
    scanResult: null
};

function getCurrentProject() {
    return currentProject;
}

function setCurrentProject(project) {
    currentProject = project;
}

function getWorkspaceState() {
    return workspaceState;
}

function updateWorkspaceState(updates) {
    workspaceState = { ...workspaceState, ...updates };
}

function saveWorkspace() {
    if (!currentProject) return;

    const state = {
        openFile: workspaceState.openFile,
        editorContent: workspaceState.editorContent,
        fileTree: workspaceState.fileTree,
        scanResult: workspaceState.scanResult
    };

    updateProject(currentProject.id, { workspaceState: state });
    currentProject = findProjectById(currentProject.id);
}

async function restoreWorkspace() {
    if (!currentProject) return;

    const saved = currentProject.workspaceState;
    if (saved) {
        workspaceState = {
            openFile: saved.openFile || null,
            editorContent: saved.editorContent || "",
            fileTree: saved.fileTree || [],
            scanResult: saved.scanResult || null
        };
    }

    loadProjectSettings(currentProject);
    loadProjectChatHistory(currentProject);
    loadProjectActivityLogs(currentProject.id);
}

function loadProjectSettings(project) {
    const settings = project.settings || {};
    const fields = {
        geminiApiKey: "geminiApiKey",
        openaiApiKey: "openaiApiKey",
        claudeApiKey: "claudeApiKey"
    };

    for (const [key, id] of Object.entries(fields)) {
        const el = document.getElementById(id);
        if (el && settings[key]) el.value = settings[key];
    }

    const modelSelect = document.getElementById("modelSelect");
    if (modelSelect && settings.selectedModel) {
        modelSelect.value = settings.selectedModel;
    }
}

function saveProjectSettings() {
    if (!currentProject) return;

    const settings = {
        geminiApiKey: document.getElementById("geminiApiKey")?.value.trim() || "",
        openaiApiKey: document.getElementById("openaiApiKey")?.value.trim() || "",
        claudeApiKey: document.getElementById("claudeApiKey")?.value.trim() || "",
        selectedModel: document.getElementById("modelSelect")?.value || "gemini-2.0-flash",
        github: getGitHubSettings()
    };

    updateProject(currentProject.id, { settings });
    currentProject = findProjectById(currentProject.id);

    if (settings.geminiApiKey) {
        saveGeminiKey(settings.geminiApiKey);
    }
}

function loadProjectChatHistory(project) {
    const container = document.getElementById("chatHistory");
    if (!container) return;

    const history = project.chatHistory || [];
    container.innerHTML = "";

    if (history.length === 0) {
        container.innerHTML = '<p class="chat-empty">Start chatting to build your website</p>';
        return;
    }

    history.forEach(entry => {
        appendChatMessage(entry.role, entry.content, entry.time, false);
    });
}

function addChatMessage(role, content) {
    if (!currentProject) return;

    const entry = {
        role,
        content,
        time: new Date().toLocaleTimeString()
    };

    const history = [...(currentProject.chatHistory || []), entry];
    updateProject(currentProject.id, { chatHistory: history });
    currentProject = findProjectById(currentProject.id);

    appendChatMessage(role, content, entry.time, true);
}

function appendChatMessage(role, content, time, scroll) {
    const container = document.getElementById("chatHistory");
    if (!container) return;

    const empty = container.querySelector(".chat-empty");
    if (empty) empty.remove();

    const msg = document.createElement("div");
    msg.className = `chat-message chat-${role}`;
    msg.innerHTML = `
        <div class="chat-meta">${role === "user" ? "You" : "AI"} · ${time}</div>
        <div class="chat-text">${escapeHtml(content)}</div>
    `;
    container.appendChild(msg);

    if (scroll) {
        container.scrollTop = container.scrollHeight;
    }
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
