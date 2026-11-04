import { readdir, mkdir, rm, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const defaultRoot = fileURLToPath(new URL('../', import.meta.url));
const directories = new Set(['a-kuara','agenda','approved-orientacao','assets','blog','ceramicageopoetica','coletivo-mulheres-de-barro','contato','galeria','galeria-kuara','mentorias','newsletter','politicas-sociais','privacidade','termos-de-uso']);
const extensions = new Set(['.html','.css','.js','.xml','.webmanifest','.svg','.png','.jpg','.jpeg','.webp','.gif','.avif','.ico','.woff','.woff2','.ttf','.mp4','.webm','.pdf']);
const namedFiles = new Set(['_headers','_redirects','robots.txt','content-metadata.json','instagram-feed.json','instagram-coletivo-feed.json']);

export async function build(root = defaultRoot) {
  const output = path.join(root, 'dist');
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  async function copyDirectory(source, destination, top = false) {
    for (const entry of await readdir(source, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      if (top && !directories.has(entry.name) && !extensions.has(path.extname(entry.name)) && !namedFiles.has(entry.name)) continue;
      const from = path.join(source, entry.name), to = path.join(destination, entry.name);
      // Never follow a link into private files outside the public source tree.
      if (entry.isSymbolicLink()) throw new Error(`Public build refuses symbolic link: ${path.relative(root, from)}`);
      if (entry.isDirectory()) {
        if (top && !directories.has(entry.name)) continue;
        await mkdir(to, { recursive: true });
        await copyDirectory(from, to);
      } else if (entry.isFile() && (extensions.has(path.extname(entry.name)) || (top && namedFiles.has(entry.name)))) {
        await copyFile(from, to);
      }
    }
  }
  await copyDirectory(root, output, true);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await build();
  console.log('Static site built in dist using a public-file allowlist.');
}
