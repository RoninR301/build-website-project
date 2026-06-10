async function processNaturalLanguageRequest(userPrompt, project) {
    const { files, contents, fileIds } = await readProjectFiles(
        project.folderId,
        { ...(project.fileIds || {}) }
    );

    const fileList = files.map(f => f.name).join(", ") || "none";
    const fileContents = Object.entries(contents)
        .map(([name, content]) => `--- ${name} ---\n${content}`)
        .join("\n\n");

    const aiPrompt = buildCodeChangePrompt(
        project,
        userPrompt,
        fileList,
        fileContents
    );

    const result = await sendToGemini(aiPrompt);

    if (!result.success) {
        return result;
    }

    const parsed = parseAIResponse(result.response);

    if (!parsed.files || parsed.files.length === 0) {
        return {
            success: true,
            summary: parsed.summary || result.response,
            changes: []
        };
    }

    const backupsFolderId = project.backupsFolderId ||
        await ensureBackupsFolder(project);

    const updatedFileIds = { ...(project.fileIds || {}) };
    const changes = [];

    for (const fileChange of parsed.files) {
        const fileName = fileChange.name || fileChange.fileName;
        if (!fileName || !fileChange.content) continue;

        const op = await createOrUpdateFile(
            project.folderId,
            fileName,
            fileChange.content,
            updatedFileIds,
            backupsFolderId,
            fileChange.action !== "create"
        );

        updatedFileIds[fileName] = op.fileId;
        changes.push({
            fileName,
            action: op.action
        });

        addBuildHistoryEntry(project.id, {
            prompt: userPrompt,
            file: fileName,
            action: op.action,
            time: new Date().toISOString()
        });
    }

    updateProject(project.id, { fileIds: updatedFileIds });
    const updated = findProjectById(project.id);
    setCurrentProject(updated);

    await syncManifestToDrive(updated);
    logGeminiRequest(userPrompt);
    logDriveSync("Files synced after AI update");

    return {
        success: true,
        summary: parsed.summary || "Changes applied successfully",
        changes
    };
}

function buildCodeChangePrompt(project, userPrompt, fileList, fileContents) {
    return `You are a Full Stack Website Builder AI inside Folder Agent workspace.
The user speaks Hindi, English, Hinglish, or mixed language. Understand their intent.

PROJECT: ${project.name}
EXISTING FILES: ${fileList}

CURRENT FILE CONTENTS:
${fileContents || "No files yet - create default website files."}

USER REQUEST: ${userPrompt}

RULES:
1. UPDATE existing files whenever possible - never create duplicates like index2.html
2. Only CREATE new files when truly required (e.g. contact.html, login.html)
3. Return valid JSON only, no markdown fences
4. Include FULL file content for each changed file
5. For style changes (background, colors, dark mode): update style.css
6. For UI elements (navbar, button, footer): update index.html and style.css if needed
7. For interactivity (dark mode toggle, animation): update app.js and style.css

RESPONSE FORMAT (JSON only):
{
  "summary": "Brief description of changes in user's language",
  "files": [
    { "name": "style.css", "action": "update", "content": "full css content" },
    { "name": "contact.html", "action": "create", "content": "full html content" }
  ]
}`;
}

function parseAIResponse(response) {
    try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {
        console.warn("JSON parse failed, treating as summary only");
    }

    return {
        summary: response,
        files: []
    };
}

function addBuildHistoryEntry(projectId, entry) {
    const project = findProjectById(projectId);
    if (!project) return;

    const buildHistory = [...(project.buildHistory || []), entry];
    updateProject(projectId, { buildHistory });
}
