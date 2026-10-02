"use strict";
// Example exports written after wallabag's own test exports
// (tests/fixtures/Import/wallabag-v2.json and wallabag-v2-read.json):
// older exports write flags as true/false and ids as strings,
// recent ones write 0/1 and numbers; annotations may be null.

const recent = [
  {
    id: 612,
    title: "Reading list tools compared",
    url: "https://example.org/reading-list",
    is_archived: 1,
    is_starred: 1,
    created_at: "2024-03-01T09:15:00+0200",
    updated_at: "2024-03-02T10:00:00+0200",
    tags: ["tools", "reading"],
    annotations: [
      { text: "Check this later", quote: "the second option keeps notes", ranges: [] },
      { text: "", quote: "line one\nline two", ranges: [] },
    ],
    content: "<p>Saved text</p>",
    domain_name: "example.org",
  },
  {
    id: 608,
    title: "Café notes & recipes",
    url: "https://example.com/cafe?x=1&y=2",
    is_archived: 0,
    is_starred: 0,
    created_at: "2024-03-05T18:00:00-0500",
    updated_at: "2024-03-05T18:00:00-0500",
    tags: [],
    annotations: [],
    content: "",
  },
];

const old = [
  {
    id: "23",
    title: "Old export entry",
    url: "http://example.net/old",
    is_archived: false,
    is_starred: true,
    created_at: "2016-09-08T11:55:58+0200",
    updated_at: "2016-09-08T11:57:16+0200",
    tags: ["mediapart", "blog"],
    annotations: null,
  },
  {
    id: "21",
    title: "",
    url: "https://example.net/untitled",
    is_archived: true,
    is_starred: false,
    created_at: "",
    updated_at: "2016-09-08T11:57:16+0200",
    tags: [{ label: "blog" }, { label: " blog " }],
  },
];

const broken = [
  { id: 1, title: "No address", url: "", created_at: "2024-01-01T00:00:00+0000" },
  { id: 2, title: "Script address", url: "javascript:alert(1)", created_at: "2024-01-01T00:00:00+0000" },
  { id: 3, title: "No date", url: "https://example.org/nodate", created_at: "soon", updated_at: null },
  "not an article",
  { id: 4, title: "Fine", url: "https://example.org/fine", created_at: "2024-01-01T00:00:00+0000" },
];

module.exports = { recent, old, broken };
