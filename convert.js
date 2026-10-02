"use strict";
// Turns a wallabag JSON export into a file in Karakeep's own export format,
// which Karakeep's import dialog reads under the source "Karakeep".

const STARRED_LIST = {
  id: "wallabag-starred",
  name: "Starred in wallabag",
  description: null,
  icon: "⭐",
  type: "manual",
  query: null,
  parentId: null,
};

// wallabag writes offsets as "+0200"; not every browser parses that form.
function parseDate(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const fixed = value.trim().replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
  const ms = Date.parse(fixed);
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
}

// Recent exports write 0/1, older ones true/false.
function flag(value) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function tagList(tags) {
  if (!Array.isArray(tags)) return [];
  const out = [];
  for (const t of tags) {
    const label = typeof t === "string" ? t : t && typeof t.label === "string" ? t.label : "";
    const clean = label.trim();
    if (clean && !out.includes(clean)) out.push(clean);
  }
  return out;
}

function noteFrom(annotations) {
  if (!Array.isArray(annotations)) return null;
  const parts = [];
  for (const a of annotations) {
    if (!a || typeof a !== "object") continue;
    const quote = typeof a.quote === "string" ? a.quote.trim() : "";
    const text = typeof a.text === "string" ? a.text.trim() : "";
    const lines = [];
    if (quote) lines.push(quote.split("\n").map((l) => "> " + l).join("\n"));
    if (text) lines.push(text);
    if (lines.length) parts.push(lines.join("\n"));
  }
  return parts.length ? parts.join("\n\n") : null;
}

function label(entry, index) {
  const t = entry && typeof entry.title === "string" && entry.title.trim();
  return t ? '"' + t.slice(0, 80) + '"' : "entry " + (index + 1);
}

function convert(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new Error("This file is not valid JSON. Export from wallabag with the JSON format.");
  }
  if (!Array.isArray(data)) {
    throw new Error("This does not look like a wallabag JSON export: it should be a list of articles.");
  }
  const bookmarks = [];
  const problems = [];
  const stats = { read: data.length, written: 0, archived: 0, starred: 0, withNotes: 0, tags: 0, skipped: 0 };
  const tagSet = new Set();

  data.forEach((entry, i) => {
    if (!entry || typeof entry !== "object") {
      stats.skipped++;
      problems.push("Skipped " + label(entry, i) + ": not an article.");
      return;
    }
    const url = typeof entry.url === "string" ? entry.url.trim() : "";
    if (!/^https?:\/\//i.test(url)) {
      stats.skipped++;
      problems.push("Skipped " + label(entry, i) + ": no web address.");
      return;
    }
    const createdAt = parseDate(entry.created_at) ?? parseDate(entry.updated_at);
    if (createdAt === null) {
      stats.skipped++;
      problems.push("Skipped " + label(entry, i) + ": its date could not be read.");
      return;
    }
    const tags = tagList(entry.tags);
    tags.forEach((t) => tagSet.add(t));
    const archived = flag(entry.is_archived);
    const starred = flag(entry.is_starred);
    const note = noteFrom(entry.annotations);
    // Karakeep refuses titles longer than 1000 characters.
    const title = typeof entry.title === "string" && entry.title.trim() ? entry.title.trim().slice(0, 1000) : null;
    bookmarks.push({
      createdAt,
      title,
      tags,
      lists: starred ? [STARRED_LIST.id] : [],
      content: { type: "link", url },
      note,
      archived,
    });
    stats.written++;
    if (archived) stats.archived++;
    if (starred) stats.starred++;
    if (note) stats.withNotes++;
  });
  stats.tags = tagSet.size;
  const lists = stats.starred ? [Object.assign({}, STARRED_LIST)] : [];
  return { output: { bookmarks, lists }, stats, problems };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { convert, parseDate, flag, tagList, noteFrom };
}
