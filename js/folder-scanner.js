function scanProject(
projectId
) {

const folderPath =
getFolderPath(projectId);

if (!folderPath) {

    return {
        success: false,
        message:
        "No Folder Connected"
    };
}

return {

    success: true,

    projectId,

    folderPath,

    summary: {

        totalFiles: 0,

        htmlFiles: 0,

        cssFiles: 0,

        jsFiles: 0

    }
};

}

function buildProjectSummary(
scanResult
) {

if (
    !scanResult.success
) {

    return `

Project Scan Failed

Reason:
${scanResult.message}
`;
}

return `

Project Scan Complete

Folder:
${scanResult.folderPath}

Total Files:
${scanResult.summary.totalFiles}

HTML Files:
${scanResult.summary.htmlFiles}

CSS Files:
${scanResult.summary.cssFiles}

JS Files:
${scanResult.summary.jsFiles}
`;
}

function runProjectScan(
projectId
) {

const result =
scanProject(
    projectId
);

return buildProjectSummary(
    result
);

}