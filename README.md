# bagcarry

Open in a recent browser, nothing to install: https://rezarys.github.io/bagcarry/

A one-page tool that turns a wallabag JSON export into a file that Karakeep's import dialog reads, keeping tags, dates, archived state, starred articles and annotations. The file is read in your browser and never leaves it.

Not affiliated with the wallabag or Karakeep projects. Their names are used here only to say which files this reads and writes.

## Why

Karakeep has no wallabag import; the request is https://github.com/karakeep-app/karakeep/issues/687. The way round shared in https://github.com/karakeep-app/karakeep/discussions/581 converts the export into a browser bookmarks file with a Ruby script. That keeps the address, title, date and tags. A browser bookmarks file has no place for an archived state, a list or a note, so which articles you archived, which you starred and what you highlighted are lost.

This page writes Karakeep's own export format instead, read from Karakeep's source (`packages/shared/import-export/exporters.ts`, main branch, October 2026). That format carries an archived flag, lists and a note per bookmark.

## How to use it

1. In wallabag, open "All articles", then use the export icon in the top bar and choose JSON (wallabag's own documentation: "go to All articles, then export these articles as json").
2. Open https://rezarys.github.io/bagcarry/ and choose that file.
3. The page shows how many articles, tags, archived and starred articles and annotations it found, and lists any article it had to skip.
4. Download the converted file.
5. In Karakeep, open Settings, then "Import / Export", and use the import button of the card named "Karakeep" with the converted file.

No warranty: check a few articles after importing.

## What is carried over

| wallabag | Karakeep |
|---|---|
| url | bookmark address |
| title | title |
| created_at (updated_at if missing) | date added |
| tags | tags |
| is_archived | archived |
| is_starred | the list "Starred in wallabag" |
| annotations | the bookmark's note: each highlighted passage as a quote, then your comment |

Not carried over: the article text saved by wallabag (Karakeep fetches each page again itself), reading progress, preview pictures. An article without a web address, or whose date cannot be read, is skipped and named on the page. Karakeep merges bookmarks that share an address when it imports, and puts everything it imports under one new list.

## Status and limits

- Tested on example files written for the tests after wallabag's own test exports (`tests/fixtures/Import/wallabag-v2.json`): flags written as 0/1 and as true/false, ids as numbers and as strings, annotations missing, empty or filled, dates with an offset like `+0200`.
- The output is checked in the tests against Karakeep's import file format as written in its source. It has not been imported into a running Karakeep, the page has not been tried in a real browser, and no real export has been converted. Please open an issue if it does not work for you, but do not attach or paste your real export: give the wallabag version and the error shown.
- The whole export is read into memory. An export with the text of thousands of articles may be slow.

## Possible later tool

Keep the saved text of articles whose page is gone, 3 USD, one time, not built yet: for each article whose address no longer answers, add a text bookmark holding the article as wallabag saved it. Nothing is charged now and no date is promised. If you want it, say so on https://github.com/Rezarys/bagcarry/issues/1 (free GitHub account needed). Not part of this repository and not covered by its license.

## Privacy

The file is read in your browser, and nothing in this page's code sends it anywhere. The page also sets a Content-Security-Policy (default-src 'none', connect-src 'none', form-action 'none') as a second guard. It is delivered with the page itself, so it only guards the code you were served. No cookies, no browser storage, no analytics, no third-party code.

## Development

Plain HTML, CSS and JavaScript, no build step, no library. Tests use Node's built-in test runner: `node --test tests/*.test.js`.

Built with AI assistance, tested with automated tests, not reviewed line by line.

## License

MIT, Younes Z.
