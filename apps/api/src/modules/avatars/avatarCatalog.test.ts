import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { createAvatarCatalog } from './avatarCatalog';

let directory: string | undefined;

afterEach(() => {
  if (directory) rmSync(directory, { recursive: true, force: true });
  directory = undefined;
});

describe('createAvatarCatalog', () => {
  it('maps person ids to public URLs of existing images', () => {
    directory = mkdtempSync(path.join(tmpdir(), 'avatars-'));
    writeFileSync(path.join(directory, 'anna.svg'), '<svg/>');

    const catalog = createAvatarCatalog({ directory, publicPath: '/avatars' });

    expect(catalog.urlFor('anna')).toBe('/avatars/anna.svg');
    expect(catalog.urlFor('james')).toBeUndefined();
  });

  it('treats a missing directory as "no avatars"', () => {
    const catalog = createAvatarCatalog({
      directory: path.join(tmpdir(), 'does-not-exist-123'),
      publicPath: '/a',
    });
    expect(catalog.urlFor('anna')).toBeUndefined();
  });

  it('does not hide other filesystem errors', () => {
    directory = mkdtempSync(path.join(tmpdir(), 'avatars-'));
    const notADirectory = path.join(directory, 'file.txt');
    writeFileSync(notADirectory, 'x');

    expect(() => createAvatarCatalog({ directory: notADirectory, publicPath: '/a' })).toThrow();
  });

  it('refuses ambiguous avatars (two files for one person)', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'avatars-'));
    directory = dir;
    writeFileSync(path.join(dir, 'anna.svg'), '<svg/>');
    writeFileSync(path.join(dir, 'anna.png'), 'png');

    expect(() => createAvatarCatalog({ directory: dir, publicPath: '/a' })).toThrow(
      'Multiple avatar files for "anna"',
    );
  });
});
