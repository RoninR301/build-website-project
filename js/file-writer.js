const writeTasks = [];

function createWriteTask(
fileName,
content
) {

const task = {

    id:
    Date.now() +
    Math.random(),

    fileName,

    content,

    fileType:
    getFileType(
        fileName
    ),

    createdAt:
    new Date()
    .toISOString()
};

writeTasks.push(
    task
);

return task;

}

function getFileType(
fileName
) {

if (
    fileName.endsWith(
        ".html"
    )
) {
    return "HTML";
}

if (
    fileName.endsWith(
        ".css"
    )
) {
    return "CSS";
}

if (
    fileName.endsWith(
        ".js"
    )
) {
    return "JS";
}

return "FILE";

}

function getWriteTasks() {

return writeTasks;

}

function getWriteTaskCount() {

return writeTasks.length;

}

function clearWriteTasks() {

writeTasks.length = 0;

}

function removeWriteTask(
taskId
) {

const index =
writeTasks.findIndex(
    task =>
    task.id === taskId
);

if (
    index === -1
) {
    return;
}

writeTasks.splice(
    index,
    1
);

}

function createProjectFiles() {

clearWriteTasks();

createWriteTask(
    "index.html",
    ""
);

createWriteTask(
    "style.css",
    ""
);

createWriteTask(
    "app.js",
    ""
);

return getWriteTasks();

}

function buildWriteSummary() {

const tasks =
getWriteTasks();

if (
    tasks.length === 0
) {

    return `

No Write Tasks
`;
}

let output =

`
Write Queue

Total Tasks:
${tasks.length}

`;

tasks.forEach(
    task => {

        output +=

`
${task.fileName}
(${task.fileType})

`;
}
);

return output;

}

function generateDefaultProject() {

createProjectFiles();

return buildWriteSummary();

}