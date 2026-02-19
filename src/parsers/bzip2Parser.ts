import { execa } from 'execa';
import type { ArchiveEntry } from '../models/ArchiveEntry';

export async function parseBz2(filePath: string): Promise<ArchiveEntry> {
    const name =
        filePath
            .split('/')
            .pop()
            ?.replace(/\.bz2$/i, '') || 'file';

    return {
        path: name,
        name,
        isDirectory: false,
        size: 0,
        date: new Date(),
        getContent: async () => {
            const { stdout } = await execa('bzip2', ['-dc', filePath]);
            return Buffer.from(stdout);
        },
    };
}

export async function parseBr(filePath: string): Promise<ArchiveEntry> {
    const name = filePath.split('/').pop()?.replace(/\.br$/i, '') || 'file';

    return {
        path: name,
        name,
        isDirectory: false,
        size: 0,
        date: new Date(),
        getContent: async () => {
            const { stdout } = await execa('brotli', ['-dc', filePath]);
            return Buffer.from(stdout);
        },
    };
}
