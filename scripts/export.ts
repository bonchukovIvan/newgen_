import { writeFile } from 'node:fs/promises';
import { z } from 'zod';
import { siteSchema } from '../lib/validation/site';
import { exportSite } from '../lib/export';
import {exportFormats} from '../lib/export/formats';
async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const {projectId, site, format} = z.object({projectId: z.string().regex(/^[a-zA-Z0-9-]+$/), site: siteSchema, format:z.enum(exportFormats).default('node')}).parse(JSON.parse(input));
  const result = await exportSite(projectId, site, format);
  const archive = result.directory + '.zip';
  await writeFile(archive, result.zip);
  process.stdout.write(JSON.stringify({directory: result.directory, archive}));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
