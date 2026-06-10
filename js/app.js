let openFileName = null;
let editorDirty = false;
let githubConnected = false;

function $(id) {
    return document.getElementById(id);
}

function openModal() {
    $("projectModal").classList.remove("hidden");
    $("projectName").focus();
}

function closeModal() {
    $("projectModal").classList.add("hidden");
    $("projectName").value = "";
}

function openSettingsModal() {
    loadGitHubSettingsToUI();
    $("settingsModal").classList.remove("hidden");
}

function closeSettingsModal() {
    $("settingsModal").classList.add("hidden");
}

function hideWorkspace() {
    $("workspaceScreen").classList.add("hidden");
    $("homeScreen").classList.remove("hidden");
}

function showWorkspace() {
    $("homeScreen").classList.add("hidden");
    $("workspaceScreen").classList.remove("hidden");
}

function updateGitHubStatus(connected, message) {
    githubConnected = connected;
    const badge = $("githubStatus");
    if (!badge) return;

    badge.textContent = message || (connected ? "GitHub Connected" : "GitHub Disconnected");
    badge.classList.toggle("disconnected", !connected);
}

function renderWorkspaceUI(project) {
    showWorkspace();
    $("workspaceProjectName").textContent = project.name;

    const badge = $("workspaceFolderPath");
    badge.textContent = project.githubPath || getProjectGitHubPath(project.name);

    updateProjectSummaryUI(project);
    renderActivityLog(project.id);
}

function updateProjectSummaryUI(project) {
    const scan = getWorkspaceState().scanResult;
    const settings = getGitHubSettings();

    $("projectSummary").textContent = `
Project: ${project.name}
GitHub Path: ${project.githubPath}
Repository: ${settings.repoOwner}/${settings.repoName}
Files Tracked: ${Object.keys(project.fileShas || {}).length}
Chat Messages: ${(project.chatHistory || []).length}
Build History: ${(project.buildHistory || []).length}
${scan ? `Last Scan: ${scan.totalFiles} files` : ""}
Status: ${githubConnected ? "Connected" : "Disconnected"}
`;
}

function renderProjects() {
    const projects = getProjects();
    const list = $("projectsList");
    list.innerHTML = "";

    if (projects.length === 0) {
        list.innerHTML = '<p class="empty-state">No projects yet. Connect GitHub and create one.</p>';
        return;
    }

    projects.forEach(project => {
        const card = document.createElement("div");
        card.className = "project-card";
        card.innerHTML = `
            <h3>${escapeHtml(project.name)}</h3>
            <p>${project.githubPath || "GitHub project"}</p>
            <div class="meta">Updated ${new Date(project.updatedAt).toLocaleDateString()}</div>
        `;
        card.addEventListener("click", () => openProject(project));
        list.appendChild(card);
    });
}

async function refreshFileExplorer() {
    const project = getCurrentProject();
    const explorer = $("fileExplorer");

    if (!project) {
        explorer.innerHTML = '<p class="empty-state">No project open</p>';
        return;
    }

    try {
        const result = await scanProject(project);
        if (!result.success) {
            explorer.innerHTML = `<p class="empty-state">${escapeHtml(result.message)}</p>`;
            return;
        }

        renderFileTree(result.tree, explorer);
        updateProjectSummaryUI(getCurrentProject());
    } catch (e) {
        explorer.innerHTML = `<p class="empty-state">Error: ${escapeHtml(e.message)}</p>`;
    }
}

function renderFileTree(tree, container) {
    container.innerHTML = "";

    if (!tree || tree.length === 0) {
        container.innerHTML = '<p class="empty-state">No files found</p>';
        return;
    }

    tree.forEach(item => renderTreeItem(item, container, 0));
}

function renderTreeItem(item, container, depth) {
    if (item.type === "folder") {
        const folderEl = document.createElement("div");
        folderEl.className = "folder-item";
        folderEl.style.paddingLeft = `${depth * 12}px`;
        folderEl.innerHTML = `📁 ${item.name}`;
        container.appendChild(folderEl);

        const children = document.createElement("div");
        children.className = "folder-children";
        (item.children || []).forEach(child => {
            renderTreeItem(
                { ...child, fullName: child.fullName || `${item.name}/${child.name}` },
                children,
                depth + 1
            );
        });
        container.appendChild(children);
    } else {
        container.appendChild(createFileElement(item.fullName || item.name));
    }
}

function createFileElement(fileName) {
    const el = document.createElement("div");
    el.className = "file-item";
    if (openFileName === fileName) el.classList.add("active");

    const icon = fileName.endsWith(".html") ? "📄"
        : fileName.endsWith(".css") ? "🎨"
        : fileName.endsWith(".js") ? "⚡"
        : "📄";

    el.innerHTML = `${icon} ${fileName}`;
    el.addEventListener("click", () => openFileInEditor(fileName));
    return el;
}

async function openFileInEditor(fileName) {
    const project = getCurrentProject();
    if (!project) return;

    try {
        const content = await readProjectFile(project, fileName);

        openFileName = fileName;
        editorDirty = false;

        $("editorFileName").textContent = fileName;
        $("fileEditor").value = content || "";
        $("fileEditor").disabled = false;
        $("saveFileBtn").disabled = false;

        updateWorkspaceState({
            openFile: fileName,
            editorContent: content || ""
        });
        saveWorkspace();

        document.querySelectorAll(".file-item").forEach(el => {
            el.classList.toggle("active", el.textContent.includes(fileName));
        });
    } catch (e) {
        alert(`Could not open ${fileName}: ${e.message}`);
    }
}

async function handleSaveFile() {
    const project = getCurrentProject();
    if (!project || !openFileName) return;

    const content = $("fileEditor").value;
    $("saveFileBtn").disabled = true;
    $("saveFileBtn").textContent = "Committing...";

    try {
        const result = await createOrUpdateFile(project, openFileName, content);

        const updated = findProjectById(project.id);
        setCurrentProject(updated);
        editorDirty = false;

        await syncManifestToGitHub(updated);
        await refreshFileExplorer();

        alert(`File committed to GitHub: ${result.action} ${openFileName}`);
    } catch (e) {
        alert(`Save failed: ${e.message}`);
    } finally {
        $("saveFileBtn").disabled = false;
        $("saveFileBtn").textContent = "Save & Commit";
    }
}

async function handleCreateProject() {
    const name = $("projectName").value.trim();
    if (!name) {
        alert("Enter project name");
        return;
    }

    $("saveProjectBtn").disabled = true;
    $("saveProjectBtn").textContent = "Creating on GitHub...";

    try {
        await createProject(name);
        renderProjects();
        closeModal();
    } catch (e) {
        alert(`Create failed: ${e.message}`);
    } finally {
        $("saveProjectBtn").disabled = false;
        $("saveProjectBtn").textContent = "Create & Open";
    }
}

async function handleSaveGitHubSettings() {
    const settings = readGitHubSettingsFromUI();

    if (!settings.githubToken) {
        alert("GitHub token is required");
        return;
    }
    if (!settings.repoOwner || !settings.repoName) {
        alert("Repository owner and name are required");
        return;
    }

    $("saveSettingsBtn").disabled = true;
    $("saveSettingsBtn").textContent = "Validating...";

    try {
        saveGitHubSettings(settings);
        await validateGitHubConnection();
        updateGitHubStatus(true, `Connected: ${settings.repoOwner}/${settings.repoName}`);
        await syncProjectsFromGitHub();
        renderProjects();
        closeSettingsModal();
        alert("GitHub settings saved and validated");
    } catch (e) {
        updateGitHubStatus(false, "Connection failed");
        alert(`GitHub validation failed: ${e.message}`);
    } finally {
        $("saveSettingsBtn").disabled = false;
        $("saveSettingsBtn").textContent = "Save Settings";
    }
}

async function handleScanProject() {
    if (!getCurrentProject()) {
        alert("Open a project first");
        return;
    }

    $("scanProjectBtn").disabled = true;
    try {
        await refreshFileExplorer();
    } catch (e) {
        alert(`Scan failed: ${e.message}`);
    } finally {
        $("scanProjectBtn").disabled = false;
    }
}

async function handleGeminiPrompt() {
    const project = getCurrentProject();
    const apiKey = $("geminiApiKey").value.trim();
    const userPrompt = $("promptInput").value.trim();

    if (!apiKey) {
        alert("Enter Gemini API Key");
        return;
    }
    if (!userPrompt) {
        alert("Enter a prompt");
        return;
    }
    if (!project) {
        alert("Open a project first");
        return;
    }

    saveProjectSettings();
    saveGeminiKey(apiKey);

    addChatMessage("user", userPrompt);
    $("promptInput").value = "";
    $("sendPromptBtn").disabled = true;
    $("sendPromptBtn").textContent = "Processing...";

    try {
        const result = await processNaturalLanguageRequest(userPrompt, project);

        if (!result.success) {
            addChatMessage("assistant", result.message || "Request failed");
            return;
        }

        let response = result.summary;
        if (result.changes?.length) {
            response += "\n\nCommitted to GitHub:\n" + result.changes
                .map(c => `• ${c.action}: ${c.fileName}`)
                .join("\n");
        }

        addChatMessage("assistant", response);
        await refreshFileExplorer();

        if (openFileName && result.changes?.some(c => c.fileName === openFileName)) {
            await openFileInEditor(openFileName);
        }
    } catch (e) {
        addChatMessage("assistant", `Error: ${e.message}`);
    } finally {
        $("sendPromptBtn").disabled = false;
        $("sendPromptBtn").textContent = "Send to AI";
    }
}

async function handlePreview() {
    const project = getCurrentProject();
    if (!project) {
        alert("Open a project first");
        return;
    }

    try {
        let html = await readProjectFile(project, "index.html");
        if (!html) {
            alert("index.html not found on GitHub");
            return;
        }

        let css = "";
        let js = "";

        try { css = await readProjectFile(project, "style.css") || ""; } catch (e) { /* optional */ }
        try { js = await readProjectFile(project, "app.js") || ""; } catch (e) { /* optional */ }

        if (css) {
            html = html.replace(
                /<link[^>]*href=["']style\.css["'][^>]*>/i,
                `<style>${css}</style>`
            );
        }

        if (js) {
            html = html.replace(
                /<script[^>]*src=["']app\.js["'][^>]*><\/script>/i,
                `<script>${js}<\/script>`
            );
        }

        const blob = new Blob([html], { type: "text/html" });
        $("previewFrame").src = URL.createObjectURL(blob);
        $("previewModal").classList.remove("hidden");

        addActivityLog("Opened website preview");
    } catch (e) {
        alert(`Preview failed: ${e.message}`);
    }
}

async function handlePublish() {
    const project = getCurrentProject();
    if (!project) return;

    try {
        const result = await PublishService.publishToGitHubPages(project);
        if (result.success) {
            alert(`${result.message}\n\n${result.instructions.join("\n")}`);
            addActivityLog("Published to GitHub Pages");
        } else {
            alert(result.message);
        }
    } catch (e) {
        alert(`Publish failed: ${e.message}`);
    }
}

async function handleDeleteProject() {
    const project = getCurrentProject();
    if (!project) return;

    const confirmed = confirm(
        `Delete "${project.name}"?\n\nThis removes the GitHub folder, metadata, chat, and activity logs.`
    );
    if (!confirmed) return;

    $("deleteProjectBtn").disabled = true;
    try {
        await deleteProject(project.id);
        hideWorkspace();
        renderProjects();
    } catch (e) {
        alert(`Delete failed: ${e.message}`);
    } finally {
        $("deleteProjectBtn").disabled = false;
    }
}

function handleBackToProjects() {
    saveWorkspace();
    saveProjectSettings();
    hideWorkspace();
}

function migrateLegacyProjects() {
    const projects = getProjects();
    let changed = false;

    const migrated = projects.map(p => {
        if (p.folderId && !p.githubPath) {
            changed = true;
            return {
                ...p,
                githubPath: getProjectGitHubPath(p.name),
                fileShas: p.fileShas || p.fileIds || {},
                folderId: undefined,
                fileIds: undefined,
                backupsFolderId: undefined
            };
        }
        return p;
    });

    if (changed) saveProjects(migrated);
}

async function initGitHubOnStartup() {
    migrateLegacyProjects();
    loadGitHubSettingsToUI();

    const settings = getGitHubSettings();
    if (!settings.githubToken) {
        updateGitHubStatus(false, "Configure GitHub Settings");
        return;
    }

    try {
        await validateGitHubConnection();
        updateGitHubStatus(true, `${settings.repoOwner}/${settings.repoName}`);
        await syncProjectsFromGitHub();
        renderProjects();
    } catch (e) {
        updateGitHubStatus(false, e.message);
        console.warn("GitHub startup validation failed:", e);
    }
}

function initApp() {
    renderProjects();

    $("createProjectBtn").addEventListener("click", openModal);
    $("settingsBtn").addEventListener("click", openSettingsModal);
    $("saveProjectBtn").addEventListener("click", handleCreateProject);
    $("saveSettingsBtn").addEventListener("click", handleSaveGitHubSettings);
    $("scanProjectBtn").addEventListener("click", handleScanProject);
    $("sendPromptBtn").addEventListener("click", handleGeminiPrompt);
    $("saveFileBtn").addEventListener("click", handleSaveFile);
    $("previewBtn").addEventListener("click", handlePreview);
    $("publishBtn").addEventListener("click", handlePublish);
    $("deleteProjectBtn").addEventListener("click", handleDeleteProject);
    $("backToProjectsBtn").addEventListener("click", handleBackToProjects);
    $("closeSettingsBtn").addEventListener("click", closeSettingsModal);
    $("closePreviewBtn").addEventListener("click", () => {
        $("previewModal").classList.add("hidden");
        $("previewFrame").src = "about:blank";
    });

    $("fileEditor").addEventListener("input", () => {
        editorDirty = true;
        updateWorkspaceState({ editorContent: $("fileEditor").value });
    });

    ["geminiApiKey", "openaiApiKey", "claudeApiKey", "modelSelect"].forEach(id => {
        const el = $(id);
        if (el) el.addEventListener("change", saveProjectSettings);
    });

    $("projectModal").addEventListener("click", (e) => {
        if (e.target === $("projectModal")) closeModal();
    });

    $("settingsModal").addEventListener("click", (e) => {
        if (e.target === $("settingsModal")) closeSettingsModal();
    });

    $("previewModal").addEventListener("click", (e) => {
        if (e.target === $("previewModal")) $("previewModal").classList.add("hidden");
    });

    const savedKey = getGeminiKey();
    if (savedKey) $("geminiApiKey").value = savedKey;

    initGitHubOnStartup().then(() => reopenLastProjectOnLoad());
}

async function reopenLastProjectOnLoad() {
    const projectId = getLastOpenedProject();
    if (!projectId) return;

    const project = findProjectById(projectId);
    if (!project) return;

    try {
        await openProject(project);
    } catch (e) {
        console.warn("Reopen failed:", e);
        renderWorkspaceUI(project);
    }
}

initApp();
