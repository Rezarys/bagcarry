// Loads the page's scripts the way a browser does (one shared global scope) and drives the
// file input with a stub document, to catch name clashes and wiring errors without a browser.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const f = require("./fixtures.js");

const dir = path.join(__dirname, "..");
const src = (name) => fs.readFileSync(path.join(dir, name), "utf8");

function load() {
  const els = {};
  const node = (props) => ({ textContent: "", className: "", children: [], handlers: {}, disabled: false,
    addEventListener(t, fn) { this.handlers[t] = fn; }, appendChild(c) { this.children.push(c); }, ...props });
  const el = (id) => (els[id] ||= node({ id, value: "", files: [] }));
  const document = { getElementById: el, createElement: (tag) => node({ tag }), body: { appendChild() {} } };
  const ctx = vm.createContext({ document, JSON, Math, Date, Number, Object, Array, Set, Promise, setTimeout, console, String });
  const html = src("index.html");
  const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
  assert.deepStrictEqual(scripts, ["convert.js", "app.js"]);
  for (const s of scripts) vm.runInContext(src(s), ctx, { filename: s });
  for (const id of Object.keys(els)) assert.ok(html.includes('id="' + id + '"'), id + " is in the page");
  return els;
}

test("the page scripts load together and summarise an export", async () => {
  const els = load();
  const text = JSON.stringify(f.recent.concat(f.broken.slice(0, 1)));
  els.file.files = [{ name: "wallabag.json", text: async () => text }];
  await els.file.handlers.change();
  assert.match(els.status.textContent, /^Done\./);
  assert.strictEqual(els.save.disabled, false);
  const items = els.list.children[0].children.map((li) => li.textContent);
  assert.strictEqual(items[0], "2 of 3 article(s) ready to import");
  assert.strictEqual(items[3], '1 starred (they go into a list named "Starred in wallabag")');
  assert.strictEqual(els.list.children[1].textContent, 'Skipped "No address": no web address.');
});

test("a file that is not an export shows the message and no download", async () => {
  const els = load();
  els.file.files = [{ name: "bookmarks.html", text: async () => "<!DOCTYPE NETSCAPE-Bookmark-file-1>" }];
  await els.file.handlers.change();
  assert.match(els.status.textContent, /not valid JSON/);
  assert.strictEqual(els.status.className, "error");
  assert.strictEqual(els.save.disabled, true);
});
