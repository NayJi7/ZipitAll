import type { ArchiveEntry } from '../models/ArchiveEntry';

export async function parseGzip(
    buffer: Uint8Array,
    originalFileName: string,
): Promise<ArchiveEntry> {
    const name = originalFileName.replace(/\.(gz|gzip)$/i, '');

    return {
        path: name,
        name,
        isDirectory: false,
        size: buffer.length,
        date: new Date(),
        getContent: async () => buffer,
    };
}
