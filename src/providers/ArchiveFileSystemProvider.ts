import * as vscode from 'vscode';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import type { ArchiveEntry, ParsedArchive } from '../models/ArchiveEntry';
import type { ArchiveType } from '../models/ArchiveEntry';
import { globalArchiveCache } from '../utils/cache';
import { parseArchiveUri } from '../utils/archiveUtils';
import { parseZip } from '../parsers/zipParser';
import { parseAsar } from '../parsers/asarParser';

export class ArchiveFileSystemProvider implements vscode.FileSystemProvider {
    private _onDidChangeFile = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    readonly onDidChangeFile = this._onDidChangeFile.event;

    stat(uri: vscode.Uri): vscode.FileStat {
        const { archivePath, entryPath } = parseArchiveUri(uri);

        if (!entryPath) {
            return {
                type: vscode.FileType.Directory,
                ctime: Date.now(),
                mtime: Date.now(),
                size: 0,
            };
        }

        const archive = globalArchiveCache.get(archivePath);
        if (!archive) {
            throw vscode.FileSystemError.FileNotFound(uri);
        }

        const entry = archive.entries.get(entryPath);
        if (!entry) {
            throw vscode.FileSystemError.FileNotFound(uri);
        }

        return {
            type: entry.isDirectory ? vscode.FileType.Directory : vscode.FileType.File,
            ctime: entry.date.getTime(),
            mtime: entry.date.getTime(),
            size: entry.size,
        };
    }

    async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
        const { archivePath, entryPath } = parseArchiveUri(uri);

        let archive = globalArchiveCache.get(archivePath);
        if (!archive) {
            archive = await this.loadArchive(archivePath);
            globalArchiveCache.set(archivePath, archive);
        }

        const entries: [string, vscode.FileType][] = [];
        const seen = new Set<string>();

        for (const [path, entry] of archive.entries) {
            if (entryPath === '') {
                const topLevel = path.split('/')[0];
                if (!seen.has(topLevel)) {
                    seen.add(topLevel);
                    const isDir = entry.isDirectory || topLevel !== path;
                    entries.push([
                        topLevel,
                        isDir ? vscode.FileType.Directory : vscode.FileType.File,
                    ]);
                }
            } else if (path.startsWith(entryPath + '/')) {
                const relative = path.slice(entryPath.length + 1);
                const nextLevel = relative.split('/')[0];
                if (!seen.has(nextLevel)) {
                    seen.add(nextLevel);
                    const isDir = relative.includes('/') || entry.isDirectory;
                    entries.push([
                        nextLevel,
                        isDir ? vscode.FileType.Directory : vscode.FileType.File,
                    ]);
                }
            }
        }

        return entries;
    }

    async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        const { archivePath, entryPath } = parseArchiveUri(uri);

        let archive = globalArchiveCache.get(archivePath);
        if (!archive) {
            archive = await this.loadArchive(archivePath);
            globalArchiveCache.set(archivePath, archive);
        }

        const entry = archive.entries.get(entryPath);
        if (!entry) {
            throw vscode.FileSystemError.FileNotFound(uri);
        }

        if (entry.isDirectory) {
            throw vscode.FileSystemError.FileIsADirectory(uri);
        }

        if (entry.getContent) {
            return entry.getContent();
        }

        throw vscode.FileSystemError.Unavailable('Cannot read file content');
    }

    watch(): vscode.Disposable {
        return new vscode.Disposable(() => {});
    }

    writeFile(): void {
        throw vscode.FileSystemError.NoPermissions('Archive is read-only');
    }

    delete(): void {
        throw vscode.FileSystemError.NoPermissions('Archive is read-only');
    }

    rename(): void {
        throw vscode.FileSystemError.NoPermissions('Archive is read-only');
    }

    createDirectory(): void {
        throw vscode.FileSystemError.NoPermissions('Archive is read-only');
    }

    private async loadArchive(archivePath: string): Promise<ParsedArchive> {
        const ext = path.extname(archivePath).toLowerCase();
        const stats = await fs.stat(archivePath);

        let entries: Map<string, ArchiveEntry>;

        if (ext === '.zip' || ext === '.vsix' || ext === '.crx') {
            const buffer = await fs.readFile(archivePath);
            entries = await parseZip(buffer);
        } else if (ext === '.asar') {
            entries = parseAsar(archivePath);
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
}

export const archiveFileSystemProvider = new ArchiveFileSystemProvider();
