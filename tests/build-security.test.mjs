import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { build } from '../scripts/build.mjs';

test('public build excludes config, backups, server files and nested private files', async () => {
 const root = await mkdtemp(path.join(tmpdir(),'kuara-build-test-'));
 try {
  for (const folder of ['assets','netlify','backups','scripts']) await mkdir(path.join(root,folder));
  for (const name of ['index.html','_headers','robots.txt','assets/photo.webp','assets/.env','assets/key.pem','assets/backup.sql','assets/config.json','netlify/secret.js','backups/index.html','scripts/private.js','package.json','.env','credentials.txt']) await writeFile(path.join(root,name),'test fixture');
  await build(root);
  assert.deepEqual((await readdir(path.join(root,'dist'))).sort(),['_headers','assets','index.html','robots.txt']);
  assert.deepEqual(await readdir(path.join(root,'dist/assets')),['photo.webp']);
 } finally { await rm(root,{recursive:true,force:true}); }
});
test('public symlinks fail the build instead of exposing their target', async () => {
 const root = await mkdtemp(path.join(tmpdir(),'kuara-link-test-'));
 try {
  await mkdir(path.join(root,'assets'));
  await writeFile(path.join(root,'private.txt'),'synthetic secret');
  await symlink(path.join(root,'private.txt'),path.join(root,'assets/photo.jpg'));
  await assert.rejects(build(root),/refuses symbolic link/);
 } finally { await rm(root,{recursive:true,force:true}); }
});
