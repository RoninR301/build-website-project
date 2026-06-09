function buildAgentContext(
project
) {

if (!project) {

    return "";
}

return `

Project Name:
${project.name}

Folder:
${getFolderPath(project.id) || "Not Connected"}

Project Summary:
${projectSummary.textContent}
`;
}

function buildAgentPrompt(
project,
userPrompt
) {

const context =
buildAgentContext(
    project
);

return `

You are a Website Builder AI.

Project Context:

${context}

User Request:

${userPrompt}

Respond with a plan only.
`;
}