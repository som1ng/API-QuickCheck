import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

for (const file of ['official-model-claims.json', 'probe-policy.json']) {
  const source = join(root, 'agent_workspace', 'baselines', file);
  const destination = join(root, 'src', 'content', 'baselines', file);
  await writeFile(destination, await readFile(source, 'utf8'), 'utf8');
  process.stdout.write(`synced ${file}\n`);
}
