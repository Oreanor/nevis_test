import { defineConfig } from 'tsdown';

export default defineConfig({
  // server: long-running Node process; handler: the same app for serverless platforms (Vercel).
  entry: ['src/server.ts', 'src/handler.ts'],
  outDir: 'dist',
  clean: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  fixedExtension: false,
  dts: false,
  // The shared workspace package ships TypeScript source, so it is bundled; npm dependencies stay external.
  deps: { alwaysBundle: ['@nevis/shared'] },
});
