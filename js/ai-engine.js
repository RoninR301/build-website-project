async function processNaturalLanguageRequest(userPrompt, project) {
    const { files, contents } = await readProjectFiles(project);

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

    logAIRequest(userPrompt);

    const result = await sendToGemini(aiPrompt);

    if (!result.success) {
        return result;
    }

    logAIResponse(result.response.substring(0, 100));

    const parsed = parseAIResponse(result.response);

    if (!parsed.files || parsed.files.length === 0) {
        return {
            success: true,
            summary: parsed.summary || result.response,
            changes: []
        };
    }

    const changes = [];

    for (const fileChange of parsed.files) {
        const fileName = fileChange.name || fileChange.fileName;
        if (!fileName || !fileChange.content) continue;

        const op = await createOrUpdateFile(
            project,
            fileName,
            fileChange.content,
            fileChange.action !== "create"
        );

        changes.push({
            fileName,
            action: op.action,
            commit: op.commit
        });

        addBuildHistoryEntry(project.id, {
            prompt: userPrompt,
            file: fileName,
            action: op.action,
            commit: op.commit,
            time: new Date().toISOString()
        });
    }

    const updated = findProjectById(project.id);
    setCurrentProject(updated);

    await syncManifestToGitHub(updated);

    return {
        success: true,
        summary: parsed.summary || "Changes committed to GitHub",
        changes
    };
}

function buildCodeChangePrompt(project, userPrompt, fileList, fileContents) {
    return `You are a Full Stack Website Builder AI inside Folder Agent workspace.
The user speaks Hindi, English, Hinglish, or mixed language. Understand their intent.

PROJECT: ${project.name}
GITHUB PATH: ${project.githubPath || getProjectGitHubPath(project.name)}
EXISTING FILES: ${fileList}

CURRENT FILE CONTENTS:
${fileContents || "No files yet."}

USER REQUEST: ${userPrompt}

RULES:
1. This is an UPDATE request — modify existing files whenever possible
2. NEVER create duplicates like index2.html, style2.css, app-new.js
3. Return valid JSON only, no markdown fences
4. Include FULL file content for each changed file
5. Background/color changes → update style.css
6. Navbar, button, footer → update index.html (+ style.css if needed)
7. Dark mode, animation, interactivity → update app.js + style.css
8. New pages (contact, login) → create only when required inside this project

RESPONSE FORMAT (JSON only):
{
  "summary": "Brief description in user's language",
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
        console.warn("JSON parse failed:", e);
    }

    return { summary: response, files: [] };
}

function addBuildHistoryEntry(projectId, entry) {
    const project = findProjectById(projectId);
    if (!project) return;

    const buildHistory = [...(project.buildHistory || []), entry];
    updateProject(projectId, { buildHistory });
}
