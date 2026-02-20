import * as assert from 'assert';
import { ArchiveCache } from '../../src/utils/cache';
import { detectArchiveType, isArchive } from '../../src/utils/archiveUtils';
import type { ParsedArchive } from '../../src/models/ArchiveEntry';

describe('Archive Utils Test', () => {
    it('detectArchiveType should detect ZIP files', () => {
        assert.strictEqual(detectArchiveType('test.zip'), 'zip');
        assert.strictEqual(detectArchiveType('test.vsix'), 'vsix');
        assert.strictEqual(detectArchiveType('test.asar'), 'asar');
    });

    it('isArchive should return true for supported files', () => {
        assert.strictEqual(isArchive('test.zip'), true);
        assert.strictEqual(isArchive('test.tar.gz'), true);
        assert.strictEqual(isArchive('test.txt'), false);
    });
});

describe('Archive Cache Test', () => {
    it('ArchiveCache should store and retrieve archives', () => {
        const cache = new ArchiveCache(2);
        const mockArchive: ParsedArchive = {
            entries: new Map(),
            archivePath: '/test/archive.zip',
            type: 'zip',
            archiveSize: 100,
            parsedAt: new Date(),
        };

        cache.set('key1', mockArchive);
        assert.strictEqual(cache.has('key1'), true);
        assert.strictEqual(cache.get('key1'), mockArchive);
    });

    it('ArchiveCache should evict oldest entry when full', () => {
        const cache = new ArchiveCache(2);
        const mockArchive: ParsedArchive = {
            entries: new Map(),
            archivePath: '/test/archive.zip',
            type: 'zip',
            archiveSize: 100,
            parsedAt: new Date(),
        };

        cache.set('key1', mockArchive);
        cache.set('key2', mockArchive);
        cache.set('key3', mockArchive);

        assert.strictEqual(cache.has('key1'), false);
        assert.strictEqual(cache.has('key2'), true);
        assert.strictEqual(cache.has('key3'), true);
    });
});
