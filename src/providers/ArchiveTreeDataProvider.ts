import * as vscode from 'vscode';
import type { ArchiveEntry } from '../models/ArchiveEntry';
import { globalArchiveCache } from '../utils/cache';

export class ArchiveTreeDataProvider implements vscode.TreeDataProvider<ArchiveTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<ArchiveTreeItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private currentArchivePath: string | undefined;

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    setArchive(archivePath: string): void {
        this.currentArchivePath = archivePath;
        this.refresh();
    }

    getTreeItem(element: ArchiveTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ArchiveTreeItem): Promise<ArchiveTreeItem[]> {
        if (!this.currentArchivePath) {
            return [];
        }

        const archive = globalArchiveCache.get(this.currentArchivePath);
        if (!archive) {
            return [];
        }

        const items: ArchiveTreeItem[] = [];
        const seen = new Set<string>();

        const parentPath = element?.entry.path || '';

        for (const [path, entry] of archive.entries) {
            if (parentPath === '') {
                const topLevel = path.split('/')[0];
                if (!seen.has(topLevel)) {
                    seen.add(topLevel);
                    items.push(new ArchiveTreeItem(entry, topLevel !== path));
                }
            } else if (path.startsWith(parentPath + '/') && path !== parentPath) {
                const relative = path.slice(parentPath.length + 1);
                const nextLevel = relative.split('/')[0];
                if (!seen.has(nextLevel)) {
                    seen.add(nextLevel);
                    const isDir = relative.includes('/') || entry.isDirectory;
                    items.push(new ArchiveTreeItem(entry, isDir));
                }
            }
        }

        return items.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.entry.name.localeCompare(b.entry.name);
        });
    }
}

export class ArchiveTreeItem extends vscode.TreeItem {
    constructor(
        public readonly entry: ArchiveEntry,
        public readonly isDirectory: boolean,
    ) {
        super(
            entry.name,
            isDirectory
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None,
        );

        this.tooltip = `${entry.name} (${entry.size} bytes)`;
        this.description = entry.size > 0 ? `${entry.size} bytes` : '';

        if (!isDirectory) {
            this.command = {
                command: 'vscode-archive.openEntry',
                title: 'Open File',
                arguments: [entry],
            };
        }
    }
}

export const archiveTreeDataProvider = new ArchiveTreeDataProvider();
