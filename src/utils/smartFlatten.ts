import fs from 'node:fs/promises';
import path from 'node:path';
import type { ArchiveEntry } from '../models/ArchiveEntry';

/**
 * Check if entries should be flattened and return flattened entries if applicable This is the preview/virtual version
 * that doesn't touch the filesystem
 *
 * @param entries Map of archive entries
 * @param archiveName Archive filename (without extension)
 * @returns Flattened entries map, or original if flattening not applicable
 */
export function flattenEntriesForPreview(
    entries: Map<string, ArchiveEntry>,
    archiveName: string,
): Map<string, ArchiveEntry> {
    const allPaths = [...entries.keys()];

    if (allPaths.length === 0) {
        return entries;
    }

    const rootPaths = allPaths.filter((p) => !p.includes('/'));

    if (rootPaths.length !== 1) {
        return entries;
    }

    const rootPath = rootPaths[0];
    const rootEntry = entries.get(rootPath);

    if (!rootEntry?.isDirectory || rootEntry.name !== archiveName) {
        return entries;
    }

    const flattened = new Map<string, ArchiveEntry>();
    const prefix = rootPath + '/';

    for (const [path, entry] of entries) {
        if (path === rootPath) {
            continue;
        }

        const newPath = path.startsWith(prefix) ? path.slice(prefix.length) : path;
        const newName = newPath.split('/').pop() || newPath;

        flattened.set(newPath, {
            ...entry,
            path: newPath,
            name: newName,
        });
    }

    return flattened;
}

/**
 * Check and perform smart flattening if applicable
 *
 * @param extractedPath Path to the extracted directory
 * @param archiveName Archive filename (without extension)
 * @returns Whether flattening was performed
 */
export async function checkAndFlatten(
    extractedPath: string,
    archiveName: string,
): Promise<boolean> {
    try {
        // Read contents of the extracted directory
        const entries = await fs.readdir(extractedPath, { withFileTypes: true });

        // Must have exactly one entry and it must be a directory
        if (entries.length !== 1 || !entries[0].isDirectory()) {
            return false;
        }

        const folderName = entries[0].name;

        // Folder name must match archive name
        if (folderName !== archiveName) {
            return false;
        }

        // Perform flattening operation
        await flattenFolder(extractedPath, folderName);
        return true;
    } catch (error) {
        console.warn('Failed to check or flatten extracted folder:', error);
        return false;
    }
}

/**
 * Perform folder flattening operation Move subfolder contents to parent directory, then remove empty subfolder
 */
async function flattenFolder(parentPath: string, folderName: string): Promise<void> {
    const folderPath = path.join(parentPath, folderName);
    const tempPath = path.join(parentPath, `._${folderName}_temp`);

    try {
        // 1. Rename original folder to temporary name
        await fs.rename(folderPath, tempPath);

        // 2. Read all contents from temporary folder
        const items = await fs.readdir(tempPath, { withFileTypes: true });

        // 3. Move all contents to parent directory

        const movePromises = items.map(async (item) => {
            const sourcePath = path.join(tempPath, item.name);
            const targetPath = path.join(parentPath, item.name);
            return fs.rename(sourcePath, targetPath);
        });

        await Promise.all(movePromises);

        // 4. Remove empty temporary folder
        await fs.rmdir(tempPath);
    } catch (error) {
        // If error occurs, try to restore original folder name
        try {
            await fs.rename(tempPath, folderPath);
        } catch {
            // If restoration fails, there's nothing more we can do
        }
        throw error;
    }
}
