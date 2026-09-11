import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Test-only path helpers.
 *
 * A few suites assert on the *text* of source files rather than importing them
 * (checking that a screen still renders a required string, for example). Those
 * assertions used to build paths from each test file's own directory, so moving
 * a test broke it in a way the type checker could not see. Resolving from the
 * repository root instead keeps them location-independent.
 */

/** Repository root, derived from this file's own location. */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Read a source file by its repository-relative path. */
export function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf-8');
}
