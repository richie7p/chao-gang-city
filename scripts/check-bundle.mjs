import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import assert from "node:assert/strict";
const root = ".vercel/output/static/assets";
// Transfer budgets: ordinary chunks <=200 KiB gzip; Rapier's embedded WASM
// <=850 KiB and exclusively loaded after the visitor starts the experiment.
const sizes = readdirSync(root).filter(f => f.endsWith(".js")).map(file => {
  const content = readFileSync(join(root, file));
  const gzip = gzipSync(content).length;
  const limit = file.startsWith("physics-wasm-") ? 850 * 1024 : 200 * 1024;
  assert.ok(gzip <= limit, `${file}: ${gzip} gzip bytes exceeds ${limit}`);
  return { file, raw: content.length, gzip };
});
assert.ok(sizes.length > 0, "No client JS was found");
function walk(dir) { return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]); }
const server = walk(".vercel/output/functions").filter(f => /\.(?:mjs|js)$/.test(f));
for (const file of server) {
  assert.ok(!/(?:three-core|physics-wasm|react-three|three__|react-three__|three\.mjs|@react-three|dimforge)/.test(file), `Browser renderer leaked into SSR: ${file}`);
}
console.log(JSON.stringify({ chunks: sizes, serverFiles: server.length }, null, 2));
