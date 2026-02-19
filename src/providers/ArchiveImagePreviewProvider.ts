import * as vscode from 'vscode';

export class ArchiveImagePreviewProvider {
    private static currentPanel: vscode.WebviewPanel | undefined;

    static async createPreview(uri: vscode.Uri, title: string): Promise<vscode.WebviewPanel> {
        if (ArchiveImagePreviewProvider.currentPanel) {
            ArchiveImagePreviewProvider.currentPanel.dispose();
        }

        const panel = vscode.window.createWebviewPanel(
            'archiveImagePreview',
            title,
            vscode.ViewColumn.Two,
            { enableScripts: true },
        );

        ArchiveImagePreviewProvider.currentPanel = panel;

        panel.onDidDispose(() => {
            ArchiveImagePreviewProvider.currentPanel = undefined;
        });

        try {
            const content = await vscode.workspace.fs.readFile(uri);
            const base64 = Buffer.from(content).toString('base64');
            const mime = getMimeType(title);
            const dataUri = `data:${mime};base64,${base64}`;

            panel.webview.html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            margin: 0;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            background-color: var(--vscode-editor-background);
                        }
                        img {
                            max-width: 100%;
                            max-height: 100vh;
                            object-fit: contain;
                        }
                    </style>
                </head>
                <body>
                    <img src="${dataUri}" alt="${title}">
                </body>
                </html>
            `;
        } catch (error) {
            panel.webview.html = `
                <!DOCTYPE html>
                <html>
                <body style="display:flex;justify-content:center;align-items:center;height:100vh;color:var(--vscode-foreground);">
                    Failed to load image: ${error}
                </body>
                </html>
            `;
        }

        return panel;
    }

    static closePreview(): void {
        if (ArchiveImagePreviewProvider.currentPanel) {
            ArchiveImagePreviewProvider.currentPanel.dispose();
            ArchiveImagePreviewProvider.currentPanel = undefined;
        }
    }
}

function getMimeType(filename: string): string {
    const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
    const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.ico': 'image/x-icon',
    };
    return mimeTypes[ext] || 'image/png';
}
