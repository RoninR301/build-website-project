const PublishService = {
    async preparePublish(project) {
        if (!project?.name) {
            return { success: false, message: "No project selected" };
        }

        await validateGitHubConnection();

        const { contents } = await readProjectFiles(project);

        if (!contents["index.html"]) {
            return { success: false, message: "index.html not found in project" };
        }

        return {
            success: true,
            message: "Project ready for GitHub Pages",
            package: {
                projectName: project.name,
                githubPath: project.githubPath,
                files: contents,
                entryPoint: "index.html"
            }
        };
    },

    async publishToGitHubPages(project) {
        const prepared = await this.preparePublish(project);
        if (!prepared.success) return prepared;

        const settings = getGitHubSettings();
        const pagesUrl = `https://${settings.repoOwner}.github.io/${settings.repoName}/${settings.baseFolder}/${project.name}/`;

        return {
            success: true,
            message: "GitHub Pages URL ready",
            url: pagesUrl,
            instructions: [
                "Enable GitHub Pages in repository settings",
                `Set source to branch containing ${settings.baseFolder}/${project.name}/`,
                `Live URL: ${pagesUrl}`
            ]
        };
    }
};
