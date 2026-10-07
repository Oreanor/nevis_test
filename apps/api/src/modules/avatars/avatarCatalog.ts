import { readdirSync } from 'node:fs';
import path from 'node:path';

export interface AvatarCatalog {
  /** Directory the images are served from. */
  readonly directory: string;
  /** URL path the directory is mounted at, e.g. `/avatars`. */
  readonly publicPath: string;
  /** Public URL of a person's avatar, if an image named `<personId>.<ext>` exists. */
  urlFor(personId: string): string | undefined;
}

interface AvatarCatalogOptions {
  directory: string;
  publicPath: string;
}

function listFiles(directory: string): string[] {
  try {
    return readdirSync(directory);
  } catch (error) {
    // A missing directory just means "no avatars"; anything else (e.g. permissions) is a real problem.
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return [];
    throw error;
  }
}

function indexByPersonId(files: readonly string[]): Map<string, string> {
  const fileById = new Map<string, string>();
  for (const file of files) {
    const personId = path.parse(file).name;
    const existing = fileById.get(personId);
    // e.g. anna.svg and anna.png: which one wins would depend on directory order, so refuse to guess.
    if (existing) throw new Error(`Multiple avatar files for "${personId}": ${existing}, ${file}`);
    fileById.set(personId, file);
  }
  return fileById;
}

/** Indexes the avatar directory once at startup; add images and restart to pick them up. */
export function createAvatarCatalog({ directory, publicPath }: AvatarCatalogOptions): AvatarCatalog {
  const fileById = indexByPersonId(listFiles(directory));

  return {
    directory,
    publicPath,
    urlFor: (personId) => {
      const file = fileById.get(personId);
      return file === undefined ? undefined : `${publicPath}/${file}`;
    },
  };
}
