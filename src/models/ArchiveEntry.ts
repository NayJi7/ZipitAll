export interface ArchiveEntry {
    path: string;
    name: string;
    isDirectory: boolean;
    size: number;
    date: Date;
    getContent?: () => Promise<Uint8Array>;
}

export interface ParsedArchive {
    entries: Map<string, ArchiveEntry>;
    archivePath: string;
    type: ArchiveType;
    archiveSize: number;
    parsedAt: Date;
}

export type ArchiveType =
    | 'zip'
    | 'vsix'
    | 'crx'
    | 'asar'
    | 'tar'
    | 'tgz'
    | 'gzip'
    | 'gz'
    | 'br'
    | 'bz2'
    | '7z';

export const ARCHIVE_WITH_STRUCTURE: readonly ArchiveType[] = [
    'zip',
    'vsix',
    'crx',
    'asar',
    'tar',
    'tgz',
    '7z',
];

export const SINGLE_FILE_COMPRESSION: readonly ArchiveType[] = ['gzip', 'gz', 'br', 'bz2'];

export const SUPPORTED_EXTENSIONS: readonly string[] = [
    '.zip',
    '.vsix',
    '.crx',
    '.asar',
    '.tgz',
    '.tar',
    '.gzip',
    '.gz',
    '.br',
    '.bz2',
    '.7z',
];
