// Concatenates src/ parts into index.html (standalone) and dist/super-biyik.html (artifact body: no doctype/head/body tags).
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const parts = readdirSync(join(root, 'src')).filter(f => /^\d\d_/.test(f)).sort();
const html = parts.map(f => readFileSync(join(root, 'src', f), 'utf8')).join('');
writeFileSync(join(root, 'index.html'), html);
mkdirSync(join(root, 'dist'), { recursive: true });
const body = html.split('\n').filter(l => !/^(<!DOCTYPE html>|<html lang="tr">|<head>|<\/head>|<body>|<\/body>|<\/html>|<meta )/.test(l)).join('\n');
writeFileSync(join(root, 'dist', 'super-biyik.html'), body);
console.log('built index.html from', parts.join(', '));
