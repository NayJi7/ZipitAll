import { createReadStream } from 'node:fs';
import * as tar from 'tar';
import { createGunzip } from 'node:zlib';
import type { ArchiveEntry } from '../models/ArchiveEntry';

export async function parseTar(archivePath: string): Promise<Map<string, ArchiveEntry>> {
    const entries = new Map<string, ArchiveEntry>();

    return new Promise((resolve, reject) => {
        const stream = createReadStream(archivePath).pipe(tar.t());

        stream.on('entry', (entry: tar.ReadEntry) => {
            const path = entry.path;
            const isDirectory = entry.type === 'Directory';
            const name = path.split('/').pop() || path;

            entries.set(path, {
                path,
                name: isDirectory ? name.slice(0, -1) || name : name,
                isDirectory,
                size: entry.size || 0,
                date: entry.mtime || new Date(),
                getContent: isDirectory
                    ? undefined
                    : async () => {
                          // For tar, we need to re-read the file to extract content
                          return new Promise<Uint8Array>((resolve, reject) => {
                              const chunks: Buffer[] = [];
                              const extractStream = createReadStream(archivePath).pipe(
                                  tar.x({
                                      onentry: (e: tar.ReadEntry) => {
                                          if (e.path === path) {
                                              e.on('data', (chunk) => chunks.push(chunk));
                                              e.on('end', () => resolve(Buffer.concat(chunks)));
                                          } else {
                                              e.resume();
                                          }
                                      },
                                  }),
                              );
                              extractStream.on('error', reject);
                              // Fallback timeout
                              setTimeout(() => {
                                  if (chunks.length === 0) {
                                      reject(new Error('Timeout extracting tar entry'));
                                  }
                              }, 5000);
                          });
                      },
            });

            entry.resume();
        });

        stream.on('end', () => resolve(entries));
        stream.on('error', reject);
    });
}

export async function parseTgz(archivePath: string): Promise<Map<string, ArchiveEntry>> {
    const entries = new Map<string, ArchiveEntry>();

    return new Promise((resolve, reject) => {
        const stream = createReadStream(archivePath).pipe(createGunzip()).pipe(tar.t());

        stream.on('entry', (entry: tar.ReadEntry) => {
            const path = entry.path;
            const isDirectory = entry.type === 'Directory';
            const name = path.split('/').pop() || path;

            entries.set(path, {
                path,
                name: isDirectory ? name.slice(0, -1) || name : name,
                isDirectory,
                size: entry.size || 0,
                date: entry.mtime || new Date(),
                getContent: isDirectory
                    ? undefined
                    : async () => {
                          // For tgz, we need to re-read the file to extract content
                          return new Promise<Uint8Array>((resolve, reject) => {
                              const chunks: Buffer[] = [];
                              const extractStream = createReadStream(archivePath)
                                  .pipe(createGunzip())
                                  .pipe(
                                      tar.x({
                                          onentry: (e: tar.ReadEntry) => {
                                              if (e.path === path) {
                                                  e.on('data', (chunk) => chunks.push(chunk));
                                                  e.on('end', () => resolve(Buffer.concat(chunks)));
                                              } else {
                                                  e.resume();
                                              }
                                          },
                                      }),
                                  );
                              extractStream.on('error', reject);
                              setTimeout(() => {
                                  if (chunks.length === 0) {
                                      reject(new Error('Timeout extracting tgz entry'));
                                  }
                              }, 5000);
                          });
                      },
            });

            entry.resume();
        });

        stream.on('end', () => resolve(entries));
        stream.on('error', reject);
    });
}
