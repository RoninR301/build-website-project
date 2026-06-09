const activityLogs = [];

function addActivityLog(
    message
) {

    const log = {

        id:
        Date.now(),

        message,

        time:
        new Date()
        .toLocaleTimeString()

    };

    activityLogs.push(
        log
    );

    saveActivityLogs();

    return log;
}

function getActivityLogs() {

    return activityLogs;
}

function clearActivityLogs() {

    activityLogs.length = 0;

    localStorage.removeItem(
        "activity_logs"
    );
}

function saveActivityLogs() {

    localStorage.setItem(
        "activity_logs",
        JSON.stringify(
            activityLogs
        )
    );
}

function loadActivityLogs() {

    const savedLogs =
    localStorage.getItem(
        "activity_logs"
    );

    if (!savedLogs) {
        return;
    }

    try {

        const logs =
        JSON.parse(
            savedLogs
        );

        activityLogs.length = 0;

        logs.forEach(
            log => {

                activityLogs.push(
                    log
                );

            }
        );

    } catch (
        error
    ) {

        console.error(
            error
        );

    }
}

function buildActivitySummary() {

    if (
        activityLogs.length === 0
    ) {

        return `
No Activity Yet
`;
    }

    let output =

`ACTIVITY LOG

`;

    activityLogs.forEach(
        log => {

            output +=
`
[${log.time}]

${log.message}

`;
        }
    );

    return output;
}

function logProjectOpened(
    projectName
) {

    addActivityLog(
        "Project Opened: " +
        projectName
    );
}

function logProjectScanned() {

    addActivityLog(
        "Project Scanned"
    );
}

function logPromptSent(
    prompt
) {

    addActivityLog(
        "Prompt Sent: " +
        prompt
    );
}

function logBuildCompleted() {

    addActivityLog(
        "Build Completed"
    );
}

loadActivityLogs();