import * as vscode from 'vscode';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import type { ArchiveEntry, ParsedArchive, ArchiveType } from '../models/ArchiveEntry';
import { globalArchiveCache } from '../utils/cache';
import { makeArchiveUri } from '../utils/archiveUtils';
import { parseZip } from '../parsers/zipParser';
import { parseAsar } from '../parsers/asarParser';
import { parseTar, parseTgz } from '../parsers/tarParser';
import { parse7z } from '../parsers/sevenZipParser';
import { flattenEntriesForPreview } from '../utils/smartFlatten';
import {
    getLocale,
    t,
    formatFileCount,
    formatFolderCount,
    formatSize,
    type Language,
} from '../i18n';

interface TreeNode {
    name: string;
    path: string;
    isDirectory: boolean;
    size: number;
    children: TreeNode[];
}

class ArchiveDocument implements vscode.CustomDocument {
    constructor(
        public readonly uri: vscode.Uri,
        public readonly archive: ParsedArchive,
    ) {}

    dispose(): void {}
}

export class ArchiveEditorProvider implements vscode.CustomReadonlyEditorProvider<ArchiveDocument> {
    static readonly viewType = 'vscode-archive.archivePreview';
    private static currentPanel: vscode.WebviewPanel | undefined;
    private static currentDocument: ArchiveDocument | undefined;
    private static openedFileEditors: vscode.TextEditor[] = [];
    private static context: vscode.ExtensionContext | undefined;

    static initialize(context: vscode.ExtensionContext): void {
        ArchiveEditorProvider.context = context;
    }

    static closeCurrentPreview(): void {
        if (ArchiveEditorProvider.currentPanel) {
            ArchiveEditorProvider.currentPanel.dispose();
            ArchiveEditorProvider.currentPanel = undefined;
            ArchiveEditorProvider.currentDocument = undefined;
        }
        ArchiveEditorProvider.openedFileEditors = [];
    }

    async openCustomDocument(
        uri: vscode.Uri,
        _openContext: vscode.CustomDocumentOpenContext,
        _token: vscode.CancellationToken,
    ): Promise<ArchiveDocument> {
        const stats = await fs.stat(uri.fsPath);
        const config = vscode.workspace.getConfiguration('vscode-archive.preview');
        const maxSizeMB = config.get<number>('maxArchiveSizeMB', 100);
        const maxSizeBytes = maxSizeMB * 1024 * 1024;

        if (stats.size > maxSizeBytes) {
            const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
            const lang = getLocale();
            const answer = await vscode.window.showWarningMessage(
                `${t('archiveTooLarge', lang).replace('{0}', sizeMB).replace('{1}', String(maxSizeMB))} ${t('archiveTooLargeDetail', lang)}`,
                t('openAnyway', lang),
                t('cancel', lang),
            );
            if (answer !== t('openAnyway', lang)) {
                throw new Error('User cancelled opening large archive');
            }
        }

        const archive = await this.parseArchive(uri.fsPath);
        globalArchiveCache.set(uri.fsPath, archive);
        return new ArchiveDocument(uri, archive);
    }

    async resolveCustomEditor(
        document: ArchiveDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken,
    ): Promise<void> {
        const config = vscode.workspace.getConfiguration('vscode-archive.preview');
        const previewEnabled = config.get<boolean>('enabled', true);

        if (!previewEnabled) {
            webviewPanel.dispose();
            const lang = getLocale();
            vscode.window
                .showInformationMessage(
                    `${t('previewDisabled', lang)}. ${t('previewDisabledDetail', lang)}`,
                    t('openSettings', lang),
                )
                .then((selection) => {
                    if (selection === t('openSettings', lang)) {
                        vscode.commands.executeCommand(
                            'workbench.action.openSettings',
                            'vscode-archive.preview.enabled',
                        );
                    }
                });
            return;
        }

        const oldPanel = ArchiveEditorProvider.currentPanel;
        ArchiveEditorProvider.currentPanel = webviewPanel;
        ArchiveEditorProvider.currentDocument = document;

        if (oldPanel && oldPanel !== webviewPanel) {
            oldPanel.dispose();
        }

        await this.closeFileEditors();

        webviewPanel.onDidDispose(() => {
            if (ArchiveEditorProvider.currentPanel === webviewPanel) {
                ArchiveEditorProvider.currentPanel = undefined;
                ArchiveEditorProvider.currentDocument = undefined;
            }
        });

        webviewPanel.webview.options = { enableScripts: true };

        // Apply smart flatten for preview if enabled
        const smartFlattenEnabled = vscode.workspace
            .getConfiguration('vscode-archive')
            .get<boolean>('smartFlatten', true);
        let entriesToDisplay = document.archive.entries;
        if (smartFlattenEnabled) {
            const archiveNameWithoutExt = path.basename(
                document.uri.fsPath,
                path.extname(document.uri.fsPath),
            );
            entriesToDisplay = flattenEntriesForPreview(
                document.archive.entries,
                archiveNameWithoutExt,
            );
        }

        const tree = this.buildTree(entriesToDisplay);
        const archiveName = path.basename(document.uri.fsPath);
        const fileCount = [...entriesToDisplay.values()].filter((e) => !e.isDirectory).length;
        const dirCount = [...entriesToDisplay.values()].filter((e) => e.isDirectory).length;

        const lang = getLocale();
        webviewPanel.webview.html = this.getHtml(
            webviewPanel.webview,
            archiveName,
            fileCount,
            dirCount,
            document.archive.archiveSize,
            tree,
            lang,
        );

        webviewPanel.webview.onDidReceiveMessage(async (message) => {
            if (message.type === 'openFile') {
                const config = vscode.workspace.getConfiguration('vscode-archive.preview');
                const filePreviewEnabled = config.get<boolean>('filePreviewEnabled', true);

                if (!filePreviewEnabled) {
                    const hasSeenWarning = ArchiveEditorProvider.context?.globalState.get<boolean>(
                        'filePreviewDisabledWarningSeen',
                        false,
                    );

                    if (!hasSeenWarning) {
                        const lang = getLocale();
                        vscode.window
                            .showInformationMessage(
                                `${t('filePreviewDisabled', lang)}. ${t('filePreviewDisabledDetail', lang)}`,
                                t('openSettings', lang),
                                t('dontTellAgain', lang),
                            )
                            .then((selection) => {
                                if (selection === t('openSettings', lang)) {
                                    vscode.commands.executeCommand(
                                        'workbench.action.openSettings',
                                        'vscode-archive.preview.filePreviewEnabled',
                                    );
                                } else if (selection === t('dontTellAgain', lang)) {
                                    ArchiveEditorProvider.context?.globalState.update(
                                        'filePreviewDisabledWarningSeen',
                                        true,
                                    );
                                }
                            });
                    }
                    return;
                }

                const entryPath: string = message.path;
                const entry = document.archive.entries.get(entryPath);

                if (entry && !entry.isDirectory) {
                    const maxSizeMB = config.get<number>('maxFileSizeMB', 10);
                    const maxSizeBytes = maxSizeMB * 1024 * 1024;

                    if (entry.size > maxSizeBytes) {
                        const sizeMB = (entry.size / 1024 / 1024).toFixed(1);
                        const answer = await vscode.window.showWarningMessage(
                            `${t('fileTooLarge', lang).replace('{0}', sizeMB).replace('{1}', String(maxSizeMB))} ${t('fileTooLargeDetail', lang)}`,
                            t('openAnyway', lang),
                            t('cancel', lang),
                        );
                        if (answer !== t('openAnyway', lang)) {
                            return;
                        }
                    }
                }

                const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'];
                const ext = path.extname(entryPath).toLowerCase();
                const uri = makeArchiveUri(document.uri.fsPath, entryPath);

                if (imageExts.includes(ext)) {
                    const { ArchiveImagePreviewProvider } = await import(
                        './ArchiveImagePreviewProvider'
                    );
                    await ArchiveImagePreviewProvider.createPreview(uri, path.basename(entryPath));
                } else {
                    try {
                        const { ArchiveImagePreviewProvider } = await import(
                            './ArchiveImagePreviewProvider'
                        );
                        ArchiveImagePreviewProvider.closePreview();
                        const doc = await vscode.workspace.openTextDocument(uri);
                        const editor = await vscode.window.showTextDocument(doc, {
                            viewColumn: vscode.ViewColumn.Two,
                            preview: true,
                            preserveFocus: false,
                        });
                        ArchiveEditorProvider.openedFileEditors.push(editor);
                    } catch (error) {
                        vscode.window.showErrorMessage(
                            t('cannotOpenFile', lang).replace('{0}', String(error)),
                        );
                    }
                }
            } else if (message.type === 'extractFile') {
                const entry = document.archive.entries.get(message.path);
                if (!entry) return;

                if (entry.isDirectory) {
                    const folderName = entry.name;
                    const targetUri = await vscode.window.showOpenDialog({
                        canSelectFiles: false,
                        canSelectFolders: true,
                        canSelectMany: false,
                        openLabel: t('selectFolderToExtract', lang),
                    });
                    if (!targetUri || targetUri.length === 0) return;

                    const destFolder = vscode.Uri.joinPath(targetUri[0], folderName);
                    await vscode.workspace.fs.createDirectory(destFolder);

                    let extractedCount = 0;
                    for (const [filePath, fileEntry] of document.archive.entries) {
                        if (
                            filePath.startsWith(entry.path + '/') &&
                            !fileEntry.isDirectory &&
                            fileEntry.getContent
                        ) {
                            const relativePath = filePath.slice(entry.path.length + 1);
                            const targetFile = vscode.Uri.joinPath(destFolder, relativePath);
                            await vscode.workspace.fs.createDirectory(
                                vscode.Uri.joinPath(targetFile, '..'),
                            );
                            const content = await fileEntry.getContent();
                            await vscode.workspace.fs.writeFile(targetFile, content);
                            extractedCount++;
                        }
                    }
                    vscode.window.showInformationMessage(
                        t('extractedFolder', lang)
                            .replace('{0}', folderName)
                            .replace('{1}', String(extractedCount)),
                    );
                } else {
                    if (!entry.getContent) return;
                    const targetUri = await vscode.window.showSaveDialog({
                        defaultUri: vscode.Uri.file(
                            path.join(path.dirname(document.uri.fsPath), entry.name),
                        ),
                    });
                    if (targetUri) {
                        const content = await entry.getContent();
                        await vscode.workspace.fs.writeFile(targetUri, content);
                        vscode.window.showInformationMessage(
                            t('extractedFile', lang).replace('{0}', entry.name),
                        );
                    }
                }
            } else if (message.type === 'extractArchive') {
                const { decompress } = await import('../decompress');
                const archivePath = document.uri.fsPath;
                const dest = path.resolve(
                    archivePath,
                    `../${path.basename(archivePath, path.extname(archivePath))}`,
                );
                try {
                    await decompress(archivePath, dest);
                    vscode.window.showInformationMessage(
                        t('archiveExtractedTo', lang).replace('{0}', dest),
                    );
                } catch (error: any) {
                    vscode.window.showErrorMessage(
                        t('failedToExtractArchive', lang).replace('{0}', String(error)),
                    );
                }
            } else if (message.type === 'extractSelection') {
                const paths: string[] = message.paths;
                if (paths.length === 0) return;

                const targetUri = await vscode.window.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: false,
                    openLabel: t('selectFolderToExtract', lang),
                });
                if (!targetUri || targetUri.length === 0) return;

                const destFolder = targetUri[0];
                let extractedCount = 0;

                for (const entryPath of paths) {
                    const entry = document.archive.entries.get(entryPath);
                    if (!entry) continue;

                    if (entry.isDirectory) {
                        for (const [filePath, fileEntry] of document.archive.entries) {
                            if (
                                filePath.startsWith(entryPath + '/') &&
                                !fileEntry.isDirectory &&
                                fileEntry.getContent
                            ) {
                                const relativePath = filePath.slice(entryPath.lastIndexOf('/') + 1);
                                const targetFile = vscode.Uri.joinPath(destFolder, relativePath);
                                await vscode.workspace.fs.createDirectory(
                                    vscode.Uri.joinPath(targetFile, '..'),
                                );
                                const content = await fileEntry.getContent();
                                await vscode.workspace.fs.writeFile(targetFile, content);
                                extractedCount++;
                            }
                        }
                    } else if (entry.getContent) {
                        const targetFile = vscode.Uri.joinPath(destFolder, entry.name);
                        const content = await entry.getContent();
                        await vscode.workspace.fs.writeFile(targetFile, content);
                        extractedCount++;
                    }
                }
                vscode.window.showInformationMessage(
                    t('extractedSelection', lang)
                        .replace('{0}', String(extractedCount))
                        .replace('{1}', destFolder.fsPath),
                );
            }
        });
    }

    private async closeFileEditors(): Promise<void> {
        for (const editor of ArchiveEditorProvider.openedFileEditors) {
            try {
                await vscode.window.showTextDocument(editor.document, {
                    viewColumn: vscode.ViewColumn.Two,
                    preview: false,
                });
                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            } catch {}
        }
        ArchiveEditorProvider.openedFileEditors = [];
        const { ArchiveImagePreviewProvider } = await import('./ArchiveImagePreviewProvider');
        ArchiveImagePreviewProvider.closePreview();
    }

    private async parseArchive(archivePath: string): Promise<ParsedArchive> {
        const ext = path.extname(archivePath).toLowerCase();
        const stats = await fs.stat(archivePath);

        let entries: Map<string, ArchiveEntry>;

        if (ext === '.zip' || ext === '.vsix' || ext === '.crx') {
            const buffer = await fs.readFile(archivePath);
            entries = await parseZip(buffer);
        } else if (ext === '.asar') {
            entries = parseAsar(archivePath);
        } else if (ext === '.tar') {
            entries = await parseTar(archivePath);
        } else if (ext === '.tgz') {
            entries = await parseTgz(archivePath);
        } else if (ext === '.7z') {
            entries = await parse7z(archivePath);
        } else {
            entries = new Map();
        }

        return {
            entries,
            archivePath,
            type: ext.slice(1) as ArchiveType,
            archiveSize: stats.size,
            parsedAt: new Date(),
        };
    }

    private buildTree(entries: Map<string, ArchiveEntry>): TreeNode[] {
        const root: TreeNode[] = [];
        const dirMap = new Map<string, TreeNode>();

        const sortedEntries = [...entries.entries()].sort(([a], [b]) => a.localeCompare(b));

        for (const [entryPath, entry] of sortedEntries) {
            const parts = entryPath.split('/').filter(Boolean);
            let currentLevel = root;
            let currentPath = '';

            for (let i = 0; i < parts.length; i++) {
                currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
                const isLast = i === parts.length - 1;
                const isDir = isLast ? entry.isDirectory : true;

                let existing = dirMap.get(currentPath);
                if (!existing) {
                    existing = {
                        name: parts[i],
                        path: currentPath,
                        isDirectory: isDir,
                        size: isLast ? entry.size : 0,
                        children: [],
                    };
                    dirMap.set(currentPath, existing);
                    currentLevel.push(existing);
                }
                currentLevel = existing.children;
            }
        }

        const sortTree = (nodes: TreeNode[]) => {
            nodes.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name);
            });
            for (const node of nodes) {
                if (node.children.length > 0) sortTree(node.children);
            }
        };
        sortTree(root);

        return root;
    }

    private getHtml(
        _webview: vscode.Webview,
        archiveName: string,
        fileCount: number,
        dirCount: number,
        totalSize: number,
        tree: TreeNode[],
        lang: Language,
    ): string {
        const nonce = getNonce();
        const sizeStr = formatSize(totalSize, lang);
        const treeJson = JSON.stringify(tree);
        const ext = path.extname(archiveName).slice(1).toUpperCase();
        const i18n = {
            filterPlaceholder: t('filterPlaceholder', lang),
            extractFile: t('extractFile', lang),
            extractFolder: t('extractFolder', lang),
            extractSelection: t('extractSelection', lang),
            noEntries: t('noEntries', lang),
            bytes: t('bytes', lang),
            kb: t('kb', lang),
            mb: t('mb', lang),
            gb: t('gb', lang),
        };

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
    <style nonce="${nonce}">
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:var(--vscode-font-family);font-size:15px;color:var(--vscode-foreground);background:var(--vscode-editor-background)}
        .container{max-width:1000px;margin:0 auto;padding:28px 32px}

        .header{display:flex;align-items:center;gap:18px;padding:20px 24px;margin-bottom:20px;background:var(--vscode-sideBar-background);border:1px solid var(--vscode-widget-border, var(--vscode-panel-border));border-radius:8px}
        .header-icon{width:44px;height:44px;border-radius:10px;background:var(--vscode-badge-background);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .header-icon svg{width:22px;height:22px;fill:var(--vscode-badge-foreground)}
        .header-body{flex:1;min-width:0}
        .header-title{font-size:16px;font-weight:600;letter-spacing:-0.01em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .header-meta{display:flex;align-items:center;gap:8px;margin-top:4px;font-size:13px;color:var(--vscode-descriptionForeground)}
        .header-meta .sep{opacity:0.4}
        .badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;letter-spacing:0.04em;background:var(--vscode-badge-background);color:var(--vscode-badge-foreground)}
        .header-actions{display:flex;align-items:center;gap:8px;margin-left:auto}
        .header-btn{display:flex;align-items:center;gap:6px;padding:6px 12px;background:var(--vscode-button-background);color:var(--vscode-button-foreground);border:none;border-radius:4px;font-size:13px;font-weight:600;cursor:pointer;transition:opacity 0.15s, transform 0.1s}
        .header-btn:hover{opacity:0.9;transform:translateY(-1px)}
        .header-btn:active{transform:translateY(0)}
        .header-btn svg{width:14px;height:14px;fill:currentColor}

        .search{position:relative;margin-bottom:16px}
        .search svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;fill:var(--vscode-input-placeholderForeground);pointer-events:none}
        .search input{width:100%;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border, transparent);padding:8px 12px 8px 36px;font-size:14px;font-family:inherit;border-radius:6px;outline:none;transition:border-color 0.15s}
        .search input:focus{border-color:var(--vscode-focusBorder)}
        .search input::placeholder{color:var(--vscode-input-placeholderForeground)}

        .selection-bar{display:flex;align-items:center;gap:12px;padding:8px 12px;background:var(--vscode-list-activeSelectionBackground);color:var(--vscode-list-activeSelectionForeground);border-radius:6px;height:0;opacity:0;overflow:hidden;transition:height 0.2s,opacity 0.2s,margin 0.2s;pointer-events:none;margin-bottom:0}
        .selection-bar.visible{height:auto;opacity:1;overflow:visible;pointer-events:auto;margin-bottom:12px}
        .selection-bar span{flex:1;font-size:13px}

        .tree{user-select:none;position:relative;min-height:200px;padding-bottom:100px}
        .tree::before{content:'';position:absolute;top:0;bottom:0;left:8px;width:1px;background:transparent;pointer-events:none}
        .row{display:flex;align-items:center;height:34px;margin:0 8px;padding:0 8px;border-radius:6px;cursor:pointer;transition:background 0.08s;position:relative}
        .row:hover{background:var(--vscode-list-hoverBackground)}
        .row.selected{background:var(--vscode-list-activeSelectionBackground);color:var(--vscode-list-activeSelectionForeground)}

        .indent{display:inline-block;width:26px;flex-shrink:0;position:relative;pointer-events:none}
        .indent::before{content:'';position:absolute;left:12px;top:-17px;bottom:-17px;width:1px;background:var(--vscode-tree-indentGuidesStroke, rgba(128,128,128,0.15))}

        .chevron{width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;opacity:0.7;transition:transform 0.12s ease}
        .chevron svg{width:12px;height:12px;fill:currentColor}
        .chevron.open{transform:rotate(90deg)}
        .chevron.leaf{visibility:hidden}

        .icon{width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:8px}
        .icon svg{width:18px;height:18px}

        .label{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px}
        .label .ext{opacity:0.5}

        .size{font-size:13px;color:var(--vscode-descriptionForeground);margin-left:16px;flex-shrink:0;font-variant-numeric:tabular-nums}

        .extract{display:inline-flex;margin-left:6px;flex-shrink:0;background:var(--vscode-button-background);border:none;color:var(--vscode-button-foreground);cursor:pointer;width:26px;height:26px;border-radius:5px;align-items:center;justify-content:center;opacity:0;transition:opacity 0.15s, transform 0.1s}
        .extract svg{width:14px;height:14px;fill:currentColor}
        .row:hover .extract{opacity:0.7}
        .extract:hover{opacity:1;transform:scale(1.05)}

        .children{display:none;overflow:hidden}
        .children.open{display:block}

        .empty{padding:48px 24px;text-align:center;color:var(--vscode-descriptionForeground);font-size:14px}
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <div class="header-icon"><svg viewBox="0 0 16 16"><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zM9.5 4V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5H9.5z"/><path d="M6.5 7.5a.5.5 0 0 1 .5.5v1.5H8.5a.5.5 0 0 1 0 1H7V12a.5.5 0 0 1-1 0v-1.5H4.5a.5.5 0 0 1 0-1H6V8a.5.5 0 0 1 .5-.5z"/></svg></div>
        <div class="header-body">
            <div class="header-title">${escapeHtml(archiveName)}</div>
            <div class="header-meta">
                <span class="badge">${ext}</span>
                <span class="sep">\u00B7</span>
                <span>${formatFileCount(fileCount, lang)}</span>
                <span class="sep">\u00B7</span>
                <span>${formatFolderCount(dirCount, lang)}</span>
                <span class="sep">\u00B7</span>
                <span>${sizeStr}</span>
            </div>
        </div>
        <div class="header-actions">
            <button class="header-btn" id="extractArchive" title="${escapeHtml(t('extractArchive', lang))}">
                <svg viewBox="0 0 16 16"><path d="M8 12l-4-4h2.5V2h3v6H12L8 12z"/><path d="M2 14h12v1H2z"/></svg>
                ${escapeHtml(t('extractArchive', lang))}
            </button>
        </div>
    </div>
    <div class="search">
        <svg viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zm-.82 4.74a6 6 0 1 1 1.06-1.06l3.04 3.04a.75.75 0 1 1-1.06 1.06l-3.04-3.04z"/></svg>
        <input type="text" id="search" placeholder="${escapeHtml(i18n.filterPlaceholder)}" spellcheck="false" />
    </div>
    <div class="selection-bar" id="selectionBar">
        <span id="selectionCount">0 selected</span>
        <button class="header-btn" id="extractSelection">
            <svg viewBox="0 0 16 16"><path d="M8 12l-4-4h2.5V2h3v6H12L8 12z"/><path d="M2 14h12v1H2z"/></svg>
            ${escapeHtml(t('extractSelection', lang))}
        </button>
    </div>
    <div class="tree" id="tree"></div>
</div>
<script nonce="${nonce}">
const vscode = acquireVsCodeApi();
const data = ${treeJson};
const i18n = ${JSON.stringify(i18n)};

const SVG_CHEVRON = '<svg viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';
const SVG_FOLDER = '<svg viewBox="0 0 16 16"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h2.764c.958 0 1.76.56 2.311 1.184C7.985 3.648 8.48 4 9 4h4.5A1.5 1.5 0 0 1 15 5.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9z" fill="var(--vscode-symbolIcon-folderForeground, #dcb67a)"/></svg>';
const SVG_FOLDER_OPEN = '<svg viewBox="0 0 16 16"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h2.764c.958 0 1.76.56 2.311 1.184C7.985 3.648 8.48 4 9 4h4.5A1.5 1.5 0 0 1 15 5.5v.5H2.5A1.5 1.5 0 0 0 1 7.5v-4zM1 7.5A1.5 1.5 0 0 1 2.5 6H15v6.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-5z" fill="var(--vscode-symbolIcon-folderForeground, #dcb67a)"/></svg>';
const SVG_FILE = '<svg viewBox="0 0 16 16"><path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0H4zM9.5 4V1l3.5 3h-3a.5.5 0 0 1-.5-.5z" fill="var(--vscode-symbolIcon-fileForeground, #c5c5c5)"/></svg>';
const SVG_EXTRACT = '<svg viewBox="0 0 16 16"><path d="M8 12l-4-4h2.5V2h3v6H12L8 12z"/><path d="M2 14h12v1H2z"/></svg>';

const EXT_COLORS = {
    js:'#f1e05a',ts:'#3178c6',tsx:'#3178c6',jsx:'#f1e05a',
    json:'#a8b1c2',md:'#519aba',css:'#563d7c',scss:'#c6538c',
    html:'#e34c26',svg:'#ffb13b',png:'#a074c4',jpg:'#a074c4',
    py:'#3572a5',rs:'#dea584',go:'#00add8',rb:'#701516',
    yml:'#cb171e',yaml:'#cb171e',toml:'#9c4121',xml:'#0060ac',
    sh:'#89e051',bash:'#89e051',lock:'#6a737d',
    map:'#6a737d',txt:'#6a737d',gitignore:'#6a737d',
};

function getFileColor(name) {
    const dot = name.lastIndexOf('.');
    if (dot === -1) return null;
    return EXT_COLORS[name.slice(dot + 1).toLowerCase()] || null;
}

function formatSize(b) {
    if (!b) return '';
    const u = [i18n.bytes, i18n.kb, i18n.mb, i18n.gb];
    let i = 0, s = b;
    while (s >= 1024 && i < u.length - 1) { s /= 1024; i++; }
    return s.toFixed(i ? 1 : 0) + ' ' + u[i];
}

function splitExt(name) {
    const dot = name.lastIndexOf('.');
    if (dot <= 0) return [name, ''];
    return [name.slice(0, dot), name.slice(dot)];
}

let selectedPaths = new Set();
let lastSelectedIndex = -1;
let flatNodes = [];

function flattenNodes(nodes, depth = 0, result = []) {
    for (const node of nodes) {
        result.push({ ...node, depth });
        if (node.isDirectory && node.children) {
            flattenNodes(node.children, depth + 1, result);
        }
    }
    return result;
}

function renderTree(nodes, container, depth) {
    for (const node of nodes) {
        const row = document.createElement('div');
        row.className = 'row';
        row.dataset.path = node.path;
        row.dataset.index = flatNodes.findIndex(n => n.path === node.path);

        let indentHtml = '';
        for (let i = 0; i < depth; i++) indentHtml += '<span class="indent"></span>';

        const chevCls = node.isDirectory ? 'chevron' : 'chevron leaf';
        const fileColor = !node.isDirectory ? getFileColor(node.name) : null;
        const fileSvg = fileColor
            ? SVG_FILE.replace('fill="var(--vscode-symbolIcon-fileForeground, #c5c5c5)"', 'fill="' + fileColor + '"')
            : SVG_FILE;
        const iconSvg = node.isDirectory ? SVG_FOLDER : fileSvg;

        const [base, ext] = node.isDirectory ? [node.name, ''] : splitExt(node.name);
        const sizeHtml = !node.isDirectory && node.size ? '<span class="size">' + formatSize(node.size) + '</span>' : '';
        const extractTitle = node.isDirectory ? i18n.extractFolder : i18n.extractFile;
        const extractHtml = '<button class="extract" title="' + extractTitle + '" data-path="' + escapeH(node.path) + '">' + SVG_EXTRACT + '</button>';

        row.innerHTML = indentHtml
            + '<span class="' + chevCls + '">' + SVG_CHEVRON + '</span>'
            + '<span class="icon">' + iconSvg + '</span>'
            + '<span class="label">' + escapeH(base) + (ext ? '<span class="ext">' + escapeH(ext) + '</span>' : '') + '</span>'
            + sizeHtml + extractHtml;

        container.appendChild(row);

        const extractBtn = row.querySelector('.extract');

        if (extractBtn) {
            extractBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                vscode.postMessage({ type: 'extractFile', path: node.path });
            });
        }

        row.addEventListener('click', (e) => {
            if (e.target.closest('.extract')) return;

            const index = parseInt(row.dataset.index);

            if (e.shiftKey && lastSelectedIndex !== -1) {
                // Shift+Click: select range (clear previous selection)
                selectedPaths.clear();
                const start = Math.min(lastSelectedIndex, index);
                const end = Math.max(lastSelectedIndex, index);
                for (let i = start; i <= end; i++) {
                    const n = flatNodes[i];
                    if (n) {
                        selectedPaths.add(n.path);
                    }
                }
                updateSelectionUI();
            } else {
                // Normal click: clear selection and select only this item
                selectedPaths.clear();
                selectedPaths.add(node.path);
                lastSelectedIndex = index;
                updateSelectionUI();

                if (node.isDirectory) {
                    const kids = row.nextElementSibling;
                    if (kids && kids.classList.contains('children')) {
                        const chev = row.querySelector('.chevron');
                        const iconEl = row.querySelector('.icon');
                        const open = kids.classList.toggle('open');
                        chev.classList.toggle('open', open);
                        iconEl.innerHTML = open ? SVG_FOLDER_OPEN : SVG_FOLDER;
                    }
                } else {
                    vscode.postMessage({ type: 'openFile', path: node.path });
                }
            }
        });

        if (node.isDirectory && node.children.length > 0) {
            const kids = document.createElement('div');
            kids.className = 'children';
            renderTree(node.children, kids, depth + 1);
            container.appendChild(kids);

            const chev = row.querySelector('.chevron');
            const iconEl = row.querySelector('.icon');
            chev.addEventListener('click', (e) => {
                e.stopPropagation();
                const open = kids.classList.toggle('open');
                chev.classList.toggle('open', open);
                iconEl.innerHTML = open ? SVG_FOLDER_OPEN : SVG_FOLDER;
            });
        }
    }
}

function updateSelectionUI() {
    const bar = document.getElementById('selectionBar');
    const count = document.getElementById('selectionCount');

    if (selectedPaths.size > 0) {
        bar.classList.add('visible');
        count.textContent = selectedPaths.size + ' selected';
    } else {
        bar.classList.remove('visible');
    }

    document.querySelectorAll('.row').forEach(row => {
        const path = row.dataset.path;
        if (selectedPaths.has(path)) {
            row.classList.add('selected');
        } else {
            row.classList.remove('selected');
        }
    });
}

function escapeH(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

flatNodes = flattenNodes(data);
const treeEl = document.getElementById('tree');
if (data.length === 0) {
    treeEl.innerHTML = '<div class="empty">' + i18n.noEntries + '</div>';
} else {
    renderTree(data, treeEl, 0);
}

document.getElementById('search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const rows = treeEl.querySelectorAll('.row');
    const kids = treeEl.querySelectorAll('.children');

    if (!q) {
        rows.forEach(el => el.style.display = '');
        kids.forEach(el => { el.classList.remove('open'); el.style.display = ''; });
        treeEl.querySelectorAll('.chevron').forEach(el => el.classList.remove('open'));
        return;
    }

    kids.forEach(el => { el.classList.add('open'); el.style.display = ''; });
    treeEl.querySelectorAll('.chevron').forEach(el => el.classList.add('open'));
    rows.forEach(el => {
        el.style.display = (el.dataset.path || '').toLowerCase().includes(q) ? '' : 'none';
    });
});

document.getElementById('extractArchive').addEventListener('click', () => {
    vscode.postMessage({ type: 'extractArchive' });
});

document.getElementById('extractSelection').addEventListener('click', () => {
    if (selectedPaths.size > 0) {
        vscode.postMessage({ type: 'extractSelection', paths: Array.from(selectedPaths) });
    }
});

treeEl.addEventListener('click', (e) => {
    if (e.target === treeEl || (!e.target.closest('.row') && !e.target.closest('.children'))) {
        selectedPaths.clear();
        lastSelectedIndex = -1;
        updateSelectionUI();
    }
});
</script>
</body>
</html>`;
    }
}

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
