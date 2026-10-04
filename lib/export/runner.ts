import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Site } from '@/lib/validation/site';
import {assertInternalLinks} from '@/lib/validation/site';
import type {ExportFormat} from './formats';

/** Rendering runs outside the RSC bundle but uses the exact preview components. */
export async function exportSite(projectId: string, site: Site, format: ExportFormat='node') {
  assertInternalLinks(site);
  const result = await new Promise<{directory: string; archive: string}>((resolve, reject) => {
    const child = spawn(process.execPath, ['--import', 'tsx', 'scripts/export.ts'], {
      cwd: process.cwd(), env: process.env, stdio: ['pipe', 'pipe', 'pipe'],
    });
    let output = '', errors = '';
    const timeout = setTimeout(() => { child.kill('SIGTERM'); reject(new Error('Export timed out')); }, 120000);
    child.stdout.on('data', (data: Buffer) => { output += data.toString(); });
    child.stderr.on('data', (data: Buffer) => { errors = (errors + data.toString()).slice(-4000); });
    child.on('error', error => { clearTimeout(timeout); reject(error); });
    child.on('close', code => {
      clearTimeout(timeout);
      if (code !== 0) return reject(new Error(`Export failed: ${errors}`));
      try { resolve(JSON.parse(output)); } catch { reject(new Error('Invalid export result')); }
    });
    child.stdin.on('error', () => { /* close/error handlers report worker failures */ });
    child.stdin.end(JSON.stringify({projectId, site, format}));
  });
  const root = path.resolve(process.env.EXPORT_DIR || 'generated-sites') + path.sep;
  if (!result.archive.startsWith(root)) throw new Error('Invalid export destination');
  return {directory: result.directory, zip: await readFile(result.archive)};
}
