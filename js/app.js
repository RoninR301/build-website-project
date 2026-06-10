let openFileName = null;
let editorDirty = false;

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

function hideWorkspace() {
    $("workspaceScreen").classList.add("hidden");
    $("homeScreen").classList.remove("hidden");
}

function showWorkspace() {
    $("homeScreen").classList.add("hidden");
    $("workspaceScreen").classList.remove("hidden");
}

function renderWorkspaceUI(project) {
    showWorkspace();
    $("workspaceProjectName").textContent = project.name;

    const connected = isDriveConnected() && project.folderId;
    const badge = $("workspaceFolderPath");
    badge.textContent = connected
        ? `Drive: ${project.folderId.substring(0, 12)}...`
        : "Drive Disconnected";
    badge.classList.toggle("disconnected", !connected);

    updateProjectSummaryUI(project);
    renderActivityLog(project.id);
}

function updateProjectSummaryUI(project) {
    const scan = getWorkspaceState().scanResult;
    $("projectSummary").textContent = `
Project: ${project.name}
ID: ${project.id}
Drive Folder: ${project.folderId || "None"}
Files Tracked: ${Object.keys(project.fileIds || {}).length}
Chat Messages: ${(project.chatHistory || []).length}
Build History: ${(project.buildHistory || []).length}
${scan ? `\nLast Scan: ${scan.totalFiles} files` : ""}
Status: Ready
`;
}

function renderProjects() {
    const projects = getProjects();
    const list = $("projectsList");
    list.innerHTML = "";

    if (projects.length === 0) {
        list.innerHTML = '<p class="empty-state">No projects yet. Create one to get started.</p>';
        return;
    }

    projects.forEach(project => {
        const card = document.createElement("div");
        card.className = "project-card";
        card.innerHTML = `
            <h3>${escapeHtml(project.name)}</h3>
            <p>${project.folderId ? "Google Drive linked" : "Not linked"}</p>
            <div class="meta">Updated ${new Date(project.updatedAt).toLocaleDateString()}</div>
        `;
        card.addEventListener("click", () => openProject(project));
        list.appendChild(card);
    });
}

async function refreshFileExplorer() {
    const project = getCurrentProject();
    const explorer = $("fileExplorer");
    if (!project?.folderId) {
        explorer.innerHTML = '<p class="empty-state">No Drive folder linked</p>';
        return;
    }

    try {
        const result = await scanProject(project);
        if (!result.success) {
            explorer.innerHTML = `<p class="empty-state">${result.message}</p>`;
            return;
        }

        renderFileTree(result.tree, explorer);
        updateProjectSummaryUI(getCurrentProject());
    } catch (e) {
        explorer.innerHTML = `<p class="empty-state">Error: ${e.message}</p>`;
    }
}

function renderFileTree(tree, container) {
    container.innerHTML = "";

    if (!tree || tree.length === 0) {
        container.innerHTML = '<p class="empty-state">No files found</p>';
        return;
    }

    tree.forEach(item => {
        if (item.type === "folder") {
            const folderEl = document.createElement("div");
            folderEl.className = "folder-item";
            folderEl.innerHTML = `📁 ${item.name}`;
            container.appendChild(folderEl);

            const children = document.createElement("div");
            children.className = "folder-children";
            item.children.forEach(child => {
                children.appendChild(createFileElement(child.fullName || child.name));
            });
            container.appendChild(children);
        } else {
            container.appendChild(createFileElement(item.fullName || item.name));
        }
    });
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
    if (!project?.folderId) return;

    try {
        const content = await readProjectFile(
            project.folderId,
            fileName,
            project.fileIds || {}
        );

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

    try {
        await ensureDriveConnection();

        const backupsFolderId = project.backupsFolderId ||
            await ensureBackupsFolder(project);

        const result = await createOrUpdateFile(
            project.folderId,
            openFileName,
            content,
            project.fileIds || {},
            backupsFolderId
        );

        const fileIds = { ...(project.fileIds || {}) };
        fileIds[openFileName] = result.fileId;
        updateProject(project.id, { fileIds });

        const updated = findProjectById(project.id);
        setCurrentProject(updated);
        editorDirty = false;

        await syncManifestToDrive(updated);
        await refreshFileExplorer();

        addActivityLog(`Saved ${openFileName} via editor`);
    } catch (e) {
        alert(`Save failed: ${e.message}`);
    }
}

async function handleCreateProject() {
    const name = $("projectName").value.trim();
    if (!name) {
        alert("Enter project name");
        return;
    }

    $("saveProjectBtn").disabled = true;
    $("saveProjectBtn").textContent = "Creating...";

    try {
        await ensureDriveConnection();
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

async function handleDriveConnect() {
    try {
        await ensureDriveConnection();
        alert("Google Drive Connected");
        if (getCurrentProject()) {
            renderWorkspaceUI(getCurrentProject());
        }
    } catch (e) {
        alert("Drive connection failed: " + e.message);
    }
}

async function handleScanProject() {
    const project = getCurrentProject();
    if (!project) {
        alert("Open a project first");
        return;
    }

    $("scanProjectBtn").disabled = true;
    try {
        await ensureDriveConnection();
        await refreshFileExplorer();
    } catch (e) {
        alert("Scan failed: " + e.message);
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
        await ensureDriveConnection();

        if (!project.folderId) {
            throw new Error("Project has no Drive folder");
        }

        const result = await processNaturalLanguageRequest(userPrompt, project);

        if (!result.success) {
            addChatMessage("assistant", result.message || "Request failed");
            return;
        }

        let response = result.summary;
        if (result.changes?.length) {
            response += "\n\nChanges:\n" + result.changes
                .map(c => `• ${c.action}: ${c.fileName}`)
                .join("\n");
        }

        addChatMessage("assistant", response);
        await refreshFileExplorer();

        if (openFileName && result.changes?.some(c => c.fileName === openFileName)) {
            await openFileInEditor(openFileName);
        }
    } catch (e) {
        addChatMessage("assistant", "Error: " + e.message);
    } finally {
        $("sendPromptBtn").disabled = false;
        $("sendPromptBtn").textContent = "Send to AI";
    }
}

async function handlePreview() {
    const project = getCurrentProject();
    if (!project?.folderId) {
        alert("Open a project with Drive folder first");
        return;
    }

    try {
        let html = await readProjectFile(
            project.folderId,
            "index.html",
            project.fileIds || {}
        );

        if (!html) {
            alert("index.html not found");
            return;
        }

        let css = "";
        let js = "";

        try {
            css = await readProjectFile(project.folderId, "style.css", project.fileIds) || "";
        } catch (e) { /* optional */ }

        try {
            js = await readProjectFile(project.folderId, "app.js", project.fileIds) || "";
        } catch (e) { /* optional */ }

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
        const url = URL.createObjectURL(blob);

        $("previewFrame").src = url;
        $("previewModal").classList.remove("hidden");

        addActivityLog("Opened website preview");
    } catch (e) {
        alert("Preview failed: " + e.message);
    }
}

async function handlePublish() {
    const project = getCurrentProject();
    if (!project) return;

    const result = await PublishService.preparePublish(project);
    if (result.success) {
        alert(`Publish package ready!\n\nFiles: ${Object.keys(result.package.files).join(", ")}\n\nNext: ${result.nextSteps.join("\n")}`);
        addActivityLog("Publish package prepared");
    } else {
        alert(result.message);
    }
}

async function handleDeleteProject() {
    const project = getCurrentProject();
    if (!project) return;

    const confirmed = confirm(
        `Delete "${project.name}"?\n\nThis removes project metadata, Drive folder, chat history, and workspace state.`
    );
    if (!confirmed) return;

    await deleteProject(project.id);
    hideWorkspace();
    renderProjects();
}

function handleBackToProjects() {
    saveWorkspace();
    saveProjectSettings();
    hideWorkspace();
}

function initApp() {
    renderProjects();

    $("createProjectBtn").addEventListener("click", openModal);
    $("saveProjectBtn").addEventListener("click", handleCreateProject);
    $("connectDriveBtn").addEventListener("click", handleDriveConnect);
    $("scanProjectBtn").addEventListener("click", handleScanProject);
    $("sendPromptBtn").addEventListener("click", handleGeminiPrompt);
    $("saveFileBtn").addEventListener("click", handleSaveFile);
    $("previewBtn").addEventListener("click", handlePreview);
    $("publishBtn").addEventListener("click", handlePublish);
    $("deleteProjectBtn").addEventListener("click", handleDeleteProject);
    $("backToProjectsBtn").addEventListener("click", handleBackToProjects);
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
        if (el) {
            el.addEventListener("change", saveProjectSettings);
        }
    });

    $("projectModal").addEventListener("click", (e) => {
        if (e.target === $("projectModal")) closeModal();
    });

    $("previewModal").addEventListener("click", (e) => {
        if (e.target === $("previewModal")) {
            $("previewModal").classList.add("hidden");
        }
    });

    const savedKey = getGeminiKey();
    if (savedKey) {
        $("geminiApiKey").value = savedKey;
    }

    reopenLastProjectOnLoad();
}

async function reopenLastProjectOnLoad() {
    const projectId = getLastOpenedProject();
    if (!projectId) return;

    const project = findProjectById(projectId);
    if (!project) return;

    try {
        if (isDriveConnected() || getDriveToken()) {
            setDriveToken(getDriveToken());
        }
        await openProject(project);
    } catch (e) {
        console.warn("Reopen failed:", e);
        renderWorkspaceUI(project);
    }
}

initApp();
