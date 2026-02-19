import type { ParsedArchive } from '../models/ArchiveEntry';

interface CacheEntry {
    archive: ParsedArchive;
    lastAccessed: number;
}

export class ArchiveCache {
    private cache: Map<string, CacheEntry>;
    private maxSize: number;

    constructor(maxSize = 5) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }

    get(key: string): ParsedArchive | undefined {
        const entry = this.cache.get(key);
        if (entry) {
            entry.lastAccessed = Date.now();
            return entry.archive;
        }
        return undefined;
    }

    set(key: string, archive: ParsedArchive): void {
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            this.evictLRU();
        }
        this.cache.set(key, {
            archive,
            lastAccessed: Date.now(),
        });
    }

    has(key: string): boolean {
        return this.cache.has(key);
    }

    clear(): void {
        this.cache.clear();
    }

    private evictLRU(): void {
        let oldestKey: string | undefined;
        let oldestTime = Infinity;
        for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }
}

export const globalArchiveCache = new ArchiveCache(5);
