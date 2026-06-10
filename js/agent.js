function buildAgentContext(project, fileList, scanSummary) {
    if (!project) return "";

    return `
Project Name: ${project.name}
GitHub Path: ${project.githubPath || getProjectGitHubPath(project.name)}
Files: ${fileList || "Unknown"}
GitHub Status: Connected
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
