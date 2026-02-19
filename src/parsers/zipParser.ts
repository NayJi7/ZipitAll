import JSZip from 'jszip';
import type { ArchiveEntry } from '../models/ArchiveEntry';

export async function parseZip(buffer: Uint8Array): Promise<Map<string, ArchiveEntry>> {
    const zip = await JSZip.loadAsync(buffer);
    const entries = new Map<string, ArchiveEntry>();

    zip.forEach((relativePath, zipEntry) => {
        const isDirectory = zipEntry.dir;
        const name = relativePath.split('/').pop() || relativePath;

        entries.set(relativePath, {
            path: relativePath,
            name: isDirectory ? name.slice(0, -1) : name,
            isDirectory,
            size: 0,
            date: zipEntry.date,
            getContent: isDirectory
                ? undefined
                : async () => {
                      const content = await zipEntry.async('uint8array');
                      return content;
                  },
        });
    });

    return entries;
}

export async function getZipEntryContent(zip: JSZip, entryPath: string): Promise<Uint8Array> {
    const entry = zip.file(entryPath);
    if (!entry) {
        throw new Error(`Entry not found: ${entryPath}`);
    }
    return entry.async('uint8array');
}
