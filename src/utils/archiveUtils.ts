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

const ENTRY_SEPARATOR = '!/';

export function makeArchiveUri(archivePath: string, entryPath: string): vscode.Uri {
    return vscode.Uri.from({
        scheme: 'archive',
        path: archivePath + ENTRY_SEPARATOR + entryPath,
    });
}

export function parseArchiveUri(uri: vscode.Uri): { archivePath: string; entryPath: string } {
    const fullPath = uri.path;
    const sepIndex = fullPath.indexOf(ENTRY_SEPARATOR);
    if (sepIndex === -1) {
        return { archivePath: fullPath, entryPath: '' };
    }
    return {
        archivePath: fullPath.slice(0, sepIndex),
        entryPath: fullPath.slice(sepIndex + ENTRY_SEPARATOR.length),
    };
}
