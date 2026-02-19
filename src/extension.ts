import path from 'node:path';

import type { Uri } from 'vscode';
import vscode from 'vscode';

import { logger } from './logger';
import { registerCompressCommand } from './utils/compressionUtils';
import { archiveFileSystemProvider } from './providers/ArchiveFileSystemProvider';
import { ArchiveEditorProvider } from './providers/ArchiveEditorProvider';
import { globalArchiveCache } from './utils/cache';

export async function handleCompress(uri: Uri, format: string) {
    const { compress } = await import('./compress');
    const sourcePath = uri.fsPath;
    const archivePath = `${sourcePath}.${format}`;
    try {
        await compress(sourcePath, archivePath);
    } catch (error: any) {
        vscode.window.showErrorMessage(error);
    }
}

export function activate(context: vscode.ExtensionContext) {
    const decompressCmd = vscode.commands.registerCommand(
        'vscode-archive.decompress',
        async (archiveUri: Uri) => {
            const { decompress } = await import('./decompress');
            const archivePath = archiveUri.fsPath;
            const dest = path.resolve(
                archivePath,
                `../${path.basename(archivePath, path.extname(archivePath))}`,
            );
            try {
                await decompress(archivePath, dest);
            } catch (error: any) {
                vscode.window.showErrorMessage(error);
            }
        },
    );

    context.subscriptions.push(decompressCmd);

    // 注册所有压缩命令
    registerCompressCommand(context, 'vscode-archive.compressToZip', 'zip');
    registerCompressCommand(context, 'vscode-archive.compressToAsar', 'asar');
    registerCompressCommand(context, 'vscode-archive.compressToGzip', 'gzip');
    registerCompressCommand(context, 'vscode-archive.compressToBr', 'br');
    registerCompressCommand(context, 'vscode-archive.compressToTar', 'tar');
    registerCompressCommand(context, 'vscode-archive.compressToTgz', 'tgz');
    registerCompressCommand(context, 'vscode-archive.compressToVsix', 'vsix');
    registerCompressCommand(context, 'vscode-archive.compressToBz2', 'bz2');
    registerCompressCommand(context, 'vscode-archive.compressTo7z', '7z');

    const fsProvider = vscode.workspace.registerFileSystemProvider(
        'archive',
        archiveFileSystemProvider,
        { isReadonly: true },
    );
    context.subscriptions.push(fsProvider);

    const editorProvider = vscode.window.registerCustomEditorProvider(
        ArchiveEditorProvider.viewType,
        new ArchiveEditorProvider(),
        { webviewOptions: { retainContextWhenHidden: true } },
    );
    context.subscriptions.push(editorProvider);

    ArchiveEditorProvider.initialize(context);
}

export function deactivate() {
    logger.dispose();
    globalArchiveCache.clear();
}
