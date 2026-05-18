import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync } from 'fs';

// Create dist directory
try {
  mkdirSync('dist', { recursive: true });
} catch (e) {
  // Directory might already exist
}

// Copy index.html to dist
copyFileSync('index.html', 'dist/index.html');

// Bundle the speed-insights.js file
await esbuild.build({
  entryPoints: ['speed-insights.js'],
  bundle: true,
  outfile: 'dist/speed-insights.js',
  format: 'esm',
  minify: true,
  platform: 'browser',
});

// Bundle the analytics.js file
await esbuild.build({
  entryPoints: ['analytics.js'],
  bundle: true,
  outfile: 'dist/analytics.js',
  format: 'esm',
  minify: true,
  platform: 'browser',
});

console.log('Build complete! Output in dist/');
