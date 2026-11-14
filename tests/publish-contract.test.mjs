import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("public edits are revalidated and admin reads are not cached", async () => {
  const api = await source("app/api/admin/data/route.ts");
  const admin = await source("app/manage-portal-7x/page.tsx");
  assert.match(api, /revalidatePath\(path\)/);
  assert.match(api, /\["content", "contentBatch", "service"\]/);
  assert.match(api, /Cache-Control["']?:\s*["']no-store/);
  assert.match(admin, /fetch\(`\/api\/admin\/data\?q=.*cache: "no-store"/s);
});

test("publish success requires the public endpoint to confirm the saved value", async () => {
  const admin = await source("app/manage-portal-7x/page.tsx");
  assert.match(admin, /fetch\("\/api\/site-config",\s*\{\s*cache: "no-store"/s);
  assert.match(admin, /published\.content\?\.\[key\] !== String\(change\.value/);
  assert.match(admin, /发布成功：前台已读取到最新内容/);
  assert.match(admin, /发布失败：\$\{reason\}/);
});

test("rich editor preserves optional selection-level typography controls", async () => {
  const editor = await source("app/components/rich-editor.tsx");
  const renderer = await source("app/components/rich-content.tsx");
  assert.match(editor, /command\("fontName"/);
  assert.match(editor, /span\.style\.fontSize = `\$\{parsed\}px`/);
  assert.match(editor, /command\("foreColor"/);
  assert.match(renderer, /"fontFamily"[\s\S]*"fontSize"/);
  assert.match(renderer, /if \(face && face\.length <= 120/);
  assert.match(editor, /当前选区样式/);
  assert.match(editor, /readSelectionStyle\(root, current\)/);
  assert.match(editor, /fontWeight: distinctValue/);
  assert.match(editor, /underline: distinctBoolean/);
  assert.match(editor, /混合样式/);
  assert.match(editor, /aria-pressed=/);
});
