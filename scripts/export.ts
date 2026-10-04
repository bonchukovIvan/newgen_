import { writeFile } from 'node:fs/promises';
import { z } from 'zod';
import { siteSchema } from '../lib/validation/site';
import { exportSite } from '../lib/export';
async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const {projectId, site} = z.object({projectId: z.string().regex(/^[a-zA-Z0-9-]+$/), site: siteSchema}).parse(JSON.parse(input));
  const result = await exportSite(projectId, site);
  const archive = result.directory + '.zip';
  await writeFile(archive, result.zip);
  process.stdout.write(JSON.stringify({directory: result.directory, archive}));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
