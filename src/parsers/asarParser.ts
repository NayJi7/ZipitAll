import asar from 'asar';
import type { ArchiveEntry } from '../models/ArchiveEntry';

export function parseAsar(archivePath: string): Map<string, ArchiveEntry> {
    const entries = new Map<string, ArchiveEntry>();

    const files = asar.listPackage(archivePath);

    for (const filePath of files) {
        const isDirectory = filePath.endsWith('/');
        const cleanPath = isDirectory ? filePath.slice(0, -1) : filePath;
        const name = cleanPath.split('/').pop() || cleanPath;

        entries.set(cleanPath, {
            path: cleanPath,
            name,
            isDirectory,
            size: 0,
            date: new Date(),
            getContent: isDirectory
                ? undefined
                : async () => {
                      const content = asar.extractFile(archivePath, cleanPath);
                      return content;
                  },
        });
    }

    return entries;
}
