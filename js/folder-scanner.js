async function scanProjectById(projectId) {
    const project = findProjectById(projectId);
    if (!project) {
        return { success: false, message: "Project not found" };
    }
    return scanProject(project);
}

function runProjectScan(projectId) {
    const project = findProjectById(projectId);
    if (!project) return "Project not found";
    return buildScanSummaryText({ success: false, message: "Use async scan" });
}
