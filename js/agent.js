function buildAgentContext(project, fileList, scanSummary) {
    if (!project) return "";

    return `
Project Name: ${project.name}
Drive Folder ID: ${project.folderId || "Not linked"}
Files: ${fileList || "Unknown"}
Drive Status: ${isDriveConnected() ? "Connected" : "Disconnected"}
Scan: ${scanSummary || "Not scanned"}
`;
}

function buildAgentPrompt(project, userPrompt, fileList) {
    const context = buildAgentContext(
        project,
        fileList,
        getWorkspaceState()?.scanResult
            ? `${getWorkspaceState().scanResult.totalFiles} files`
            : null
    );

    return `You are a Website Builder AI for Folder Agent workspace.

Project Context:
${context}

User Request:
${userPrompt}

Respond with a concise plan describing which files will be modified or created.
`;
}
