const test = require("node:test");
const assert = require("node:assert");
const { convert, parseDate } = require("../convert.js");
const f = require("./fixtures.js");

// Karakeep's import file format, transcribed from its source
// (packages/shared/import-export/exporters.ts, zExportSchema, main, October 2026).
// Checked by hand here because the tests use no library.
function checkKarakeepFile(file) {
  const errs = [];
  const isStr = (v) => typeof v === "string";
  const isStrOrNull = (v) => v === null || isStr(v);
  if (!file || !Array.isArray(file.bookmarks)) errs.push("bookmarks is not an array");
  if (file.lists !== undefined && !Array.isArray(file.lists)) errs.push("lists is not an array");
  (file.bookmarks || []).forEach((b, i) => {
    const at = "bookmark " + i + ": ";
    if (typeof b.createdAt !== "number" || !Number.isFinite(b.createdAt)) errs.push(at + "createdAt");
    if (!isStrOrNull(b.title)) errs.push(at + "title");
    if (!Array.isArray(b.tags) || !b.tags.every(isStr)) errs.push(at + "tags");
    if (b.lists !== undefined && (!Array.isArray(b.lists) || !b.lists.every(isStr))) errs.push(at + "lists");
    const c = b.content;
    if (c !== null) {
      if (c.type === "link") { if (!isStr(c.url)) errs.push(at + "content.url"); }
      else if (c.type === "text") { if (!isStr(c.text)) errs.push(at + "content.text"); }
      else errs.push(at + "content.type");
    }
    if (!isStrOrNull(b.note)) errs.push(at + "note");
    if (b.archived !== undefined && typeof b.archived !== "boolean") errs.push(at + "archived");
  });
  (file.lists || []).forEach((l, i) => {
    const at = "list " + i + ": ";
    for (const k of ["id", "name", "icon"]) if (!isStr(l[k])) errs.push(at + k);
    for (const k of ["description", "query", "parentId"]) if (!isStrOrNull(l[k])) errs.push(at + k);
    if (l.type !== "manual" && l.type !== "smart") errs.push(at + "type");
  });
  return errs;
}

const roundTrip = (out) => JSON.parse(JSON.stringify(out));

test("a recent export keeps tags, dates, archived, starred and annotations", () => {
  const r = convert(JSON.stringify(f.recent));
  const out = roundTrip(r.output);
  assert.deepStrictEqual(checkKarakeepFile(out), []);
  assert.strictEqual(out.bookmarks.length, 2);
  const [a, b] = out.bookmarks;
  assert.deepStrictEqual(a.content, { type: "link", url: "https://example.org/reading-list" });
  assert.strictEqual(a.title, "Reading list tools compared");
  assert.deepStrictEqual(a.tags, ["tools", "reading"]);
  assert.strictEqual(a.createdAt, Date.UTC(2024, 2, 1, 7, 15, 0) / 1000);
  assert.strictEqual(a.archived, true);
  assert.deepStrictEqual(a.lists, ["wallabag-starred"]);
  assert.strictEqual(a.note, "> the second option keeps notes\nCheck this later\n\n> line one\n> line two");
  assert.strictEqual(b.archived, false);
  assert.deepStrictEqual(b.lists, []);
  assert.strictEqual(b.note, null);
  assert.strictEqual(b.title, "Café notes & recipes");
  assert.strictEqual(b.content.url, "https://example.com/cafe?x=1&y=2");
  assert.strictEqual(b.createdAt, Date.UTC(2024, 2, 5, 23, 0, 0) / 1000);
  assert.deepStrictEqual(out.lists, [{ id: "wallabag-starred", name: "Starred in wallabag", description: null,
    icon: "⭐", type: "manual", query: null, parentId: null }]);
  assert.deepStrictEqual(r.stats, { read: 2, written: 2, archived: 1, starred: 1, withNotes: 1, tags: 2, skipped: 0 });
  assert.deepStrictEqual(r.problems, []);
});

test("an old export with true/false flags, string ids, null annotations and tag objects", () => {
  const r = convert(JSON.stringify(f.old));
  const out = roundTrip(r.output);
  assert.deepStrictEqual(checkKarakeepFile(out), []);
  const [a, b] = out.bookmarks;
  assert.strictEqual(a.archived, false);
  assert.deepStrictEqual(a.lists, ["wallabag-starred"]);
  assert.deepStrictEqual(a.tags, ["mediapart", "blog"]);
  assert.strictEqual(a.note, null);
  assert.strictEqual(a.createdAt, Date.UTC(2016, 8, 8, 9, 55, 58) / 1000);
  assert.strictEqual(b.title, null, "an empty title becomes null, Karakeep then uses the page title");
  assert.strictEqual(b.archived, true);
  assert.deepStrictEqual(b.tags, ["blog"], "tag objects are read and duplicates dropped");
  assert.strictEqual(b.createdAt, Date.UTC(2016, 8, 8, 9, 57, 16) / 1000, "falls back to updated_at");
  assert.strictEqual(r.stats.tags, 2);
});

test("a title longer than Karakeep accepts is cut to 1000 characters", () => {
  const r = convert(JSON.stringify([Object.assign({}, f.recent[1], { title: "x".repeat(1500) })]));
  assert.strictEqual(r.output.bookmarks[0].title.length, 1000);
});

test("no starred article means no list", () => {
  const r = convert(JSON.stringify([f.recent[1]]));
  assert.deepStrictEqual(r.output.lists, []);
  assert.deepStrictEqual(checkKarakeepFile(roundTrip(r.output)), []);
});

test("entries without a web address or a readable date are skipped and named", () => {
  const r = convert(JSON.stringify(f.broken));
  assert.strictEqual(r.output.bookmarks.length, 1);
  assert.strictEqual(r.output.bookmarks[0].content.url, "https://example.org/fine");
  assert.deepStrictEqual(r.problems, [
    'Skipped "No address": no web address.',
    'Skipped "Script address": no web address.',
    'Skipped "No date": its date could not be read.',
    "Skipped entry 4: not an article.",
  ]);
  assert.strictEqual(r.stats.skipped, 4);
});

test("files that are not a wallabag JSON export are refused with a message", () => {
  assert.throws(() => convert("<!DOCTYPE NETSCAPE-Bookmark-file-1>"), /not valid JSON/);
  assert.throws(() => convert('{"bookmarks": []}'), /should be a list of articles/);
  const r = convert("[]");
  assert.strictEqual(r.output.bookmarks.length, 0);
});

test("dates: offsets with and without a colon, and Z", () => {
  assert.strictEqual(parseDate("2016-09-08T11:55:58+0200"), parseDate("2016-09-08T11:55:58+02:00"));
  assert.strictEqual(parseDate("2016-09-08T09:55:58Z"), Date.UTC(2016, 8, 8, 9, 55, 58) / 1000);
  assert.strictEqual(parseDate("not a date"), null);
  assert.strictEqual(parseDate(null), null);
});

test("the schema check itself rejects a wrong file", () => {
  const errs = checkKarakeepFile({ bookmarks: [{ createdAt: "1", title: 3, tags: [1], content: { type: "x" },
    note: 0, archived: 1 }], lists: [{ id: 1, type: "other" }] });
  assert.ok(errs.length >= 8, errs.join(", "));
});
