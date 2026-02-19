import { execa } from 'execa';
import { check7zExists, command } from '../compress/compress7z';
import type { ArchiveEntry } from '../models/ArchiveEntry';

export async function parse7z(archivePath: string): Promise<Map<string, ArchiveEntry>> {
    const entries = new Map<string, ArchiveEntry>();

    await check7zExists(async () => {
        const { stdout } = await execa(command, ['l', '-ba', archivePath]);
        const lines = stdout.split('\n');

        for (const line of lines) {
            if (!line.trim() || line.startsWith('----')) continue;

            if (line.length < 53) continue;

            const date = line.slice(0, 10);
            const time = line.slice(11, 19);
            const attr = line.slice(20, 25).trim();
            const compressedStr = line.slice(26, 38).trim();
            const uncompressedStr = line.slice(39, 51).trim();
            const name = line.slice(53).trim();

            if (name && !name.startsWith('----')) {
                const isDirectory = attr.includes('D') || name.endsWith('/');
                const baseName = name.split('/').pop() || name;
                const size = parseInt(uncompressedStr, 10) || parseInt(compressedStr, 10) || 0;

                entries.set(name, {
                    path: name,
                    name: baseName,
                    isDirectory,
                    size,
                    date: new Date(`${date} ${time}`),
                });
            }
        }
    });

    return entries;
}
