import * as vscode from 'vscode';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { archiveTreeDataProvider } from '../providers/ArchiveTreeDataProvider';
import { globalArchiveCache } from '../utils/cache';
import { makeArchiveUri } from '../utils/archiveUtils';
import { parseZip } from '../parsers/zipParser';
import { parseAsar } from '../parsers/asarParser';
import { ArchiveImagePreviewProvider } from '../providers/ArchiveImagePreviewProvider';
import type { ArchiveEntry, ArchiveType } from '../models/ArchiveEntry';
import { getLocale, t } from '../i18n';

let currentArchivePath: string | undefined;

async function loadArchiveEntries(archivePath: string): Promise<Map<string, ArchiveEntry> | null> {
    const ext = path.extname(archivePath).toLowerCase();

    if (ext === '.zip' || ext === '.vsix' || ext === '.crx') {
        const buffer = await fs.readFile(archivePath);
        return parseZip(buffer);
    } else if (ext === '.asar') {
        return parseAsar(archivePath);
    }

    return null;
}

export async function previewArchive(uri: vscode.Uri): Promise<void> {
    const config = vscode.workspace.getConfiguration('vscode-archive.preview');
    if (!config.get<boolean>('enabled', true)) {
        return;
    }

    const archivePath = uri.fsPath;
    currentArchivePath = archivePath;
    const stats = await fs.stat(archivePath);
    const lang = getLocale();

    const maxSize = config.get<number>('maxArchiveSize', 104857600);
    if (stats.size > maxSize) {
        vscode.window.showWarningMessage(
            t('archiveTooLargeBytes', lang)
                .replace('{0}', String(stats.size))
                .replace('{1}', String(maxSize)),
        );
        return;
    }

    const ext = path.extname(archivePath).toLowerCase();

    try {
        const entries = await loadArchiveEntries(archivePath);
        if (!entries) {
            vscode.window.showInformationMessage(
                t('previewNotSupported', lang).replace('{0}', ext),
            );
            return;
        }

        globalArchiveCache.set(archivePath, {
            entries,
            archivePath,
            type: ext.slice(1) as ArchiveType,
            archiveSize: stats.size,
            parsedAt: new Date(),
        });

        archiveTreeDataProvider.setArchive(archivePath);
        vscode.commands.executeCommand('archiveExplorer.focus');
    } catch (error) {
        vscode.window.showErrorMessage(
            t('failedToPreviewArchive', lang).replace('{0}', String(error)),
        );
    }
}

export async function openArchiveEntry(entry: ArchiveEntry): Promise<void> {
    if (!currentArchivePath) {
        return;
    }

    const config = vscode.workspace.getConfiguration('vscode-archive.preview');
    const maxFileSize = config.get<number>('maxFileSize', 10485760);
    const lang = getLocale();

    if (entry.size > maxFileSize) {
        vscode.window.showWarningMessage(
            t('fileTooLargeBytes', lang)
                .replace('{0}', String(entry.size))
                .replace('{1}', String(maxFileSize)),
        );
        return;
    }

    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
    const ext = path.extname(entry.name).toLowerCase();
    const uri = makeArchiveUri(currentArchivePath, entry.path);

    if (imageExtensions.includes(ext)) {
        ArchiveImagePreviewProvider.createPreview(uri, entry.name);
    } else {
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc);
    }
}
