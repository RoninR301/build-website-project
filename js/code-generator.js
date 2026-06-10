const generatedFiles = [];

function clearGeneratedFiles() {

    generatedFiles.length = 0;

}

function addGeneratedFile(
    fileName,
    content
) {

    generatedFiles.push({
        fileName,
        content
    });

}

function getGeneratedFiles() {

    return generatedFiles;

}

function generateIndexHtml(
    title = "My Website"
) {

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport"
content="width=device-width,initial-scale=1">

<title>${title}</title>

<link rel="stylesheet"
href="style.css">

</head>

<body>

<header>

<h1>${title}</h1>

</header>

<main>

<section>

<h2>Welcome</h2>

<p>
Website Generated Successfully
</p>

</section>

</main>

<script src="app.js"></script>

</body>
</html>`;
}

function generateStyleCss() {

    return `body {

font-family: Arial, sans-serif;

margin: 0;

padding: 20px;

}

header {

padding: 20px;

border-bottom: 1px solid #ccc;

}

h1 {

margin: 0;

}`;
}

function generateAppJs() {

    return `console.log(
"Website Ready"
);`;
}

function generateProjectFiles(
    prompt
) {

    clearGeneratedFiles();

    addGeneratedFile(
        "index.html",
        generateIndexHtml(
            prompt
        )
    );

    addGeneratedFile(
        "style.css",
        generateStyleCss()
    );

    addGeneratedFile(
        "app.js",
        generateAppJs()
    );

    return getGeneratedFiles();
}

function buildGeneratedFilesSummary() {

    const files =
    getGeneratedFiles();

    let output =

`GENERATED FILES

`;

    files.forEach(
        file => {

            output +=
`
${file.fileName}
`;
        }
    );

    return output;
}