import * as vscode from 'vscode';
import type { ArchiveType } from '../models/ArchiveEntry';

const EXTENSION_TO_TYPE: Record<string, ArchiveType> = {
    '.zip': 'zip',
    '.vsix': 'vsix',
    '.crx': 'crx',
    '.asar': 'asar',
    '.tgz': 'tgz',
    '.tar': 'tar',
    '.gzip': 'gzip',
    '.gz': 'gz',
    '.br': 'br',
    '.bz2': 'bz2',
    '.7z': '7z',
};

export function detectArchiveType(filePath: string): ArchiveType | null {
    const lowerPath = filePath.toLowerCase();
    for (const [ext, type] of Object.entries(EXTENSION_TO_TYPE)) {
        if (lowerPath.endsWith(ext)) {
            return type;
        }
    }
    return null;
}

export function isArchive(filePath: string): boolean {
    return detectArchiveType(filePath) !== null;
}

export function getArchiveExtension(filePath: string): string | null {
    const lowerPath = filePath.toLowerCase();
    for (const ext of Object.keys(EXTENSION_TO_TYPE)) {
        if (lowerPath.endsWith(ext)) {
            return ext;
        }
    }
    return null;
}

// URI format: archive://{encodeURIComponent(archivePath)}/{entryPath}
export function makeArchiveUri(archivePath: string, entryPath: string): vscode.Uri {
    return vscode.Uri.from({
        scheme: 'archive',
        authority: encodeURIComponent(archivePath),
        path: '/' + entryPath,
    });
}

export function parseArchiveUri(uri: vscode.Uri): { archivePath: string; entryPath: string } {
    return {
        archivePath: decodeURIComponent(uri.authority),
        entryPath: uri.path.startsWith('/') ? uri.path.slice(1) : uri.path,
    };
}
