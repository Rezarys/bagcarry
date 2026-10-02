"use strict";
(function () {
  const $ = (id) => document.getElementById(id);
  let lastOutput = null;

  function status(msg, isError) {
    const el = $("status");
    el.textContent = msg;
    el.className = isError ? "error" : "";
  }

  function download() {
    if (!lastOutput) return;
    const blob = new Blob([JSON.stringify(lastOutput)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "karakeep-import-from-wallabag.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function show(result) {
    const s = result.stats;
    const ul = document.createElement("ul");
    const lines = [
      s.written + " of " + s.read + " article(s) ready to import",
      s.tags + " distinct tag(s)",
      s.archived + " archived",
      s.starred + " starred (they go into a list named \"Starred in wallabag\")",
      s.withNotes + " with annotations (copied into the bookmark's note)",
    ];
    for (const line of lines) {
      const li = document.createElement("li");
      li.textContent = line;
      ul.appendChild(li);
    }
    $("list").appendChild(ul);
    for (const p of result.problems.slice(0, 50)) {
      const w = document.createElement("p");
      w.className = "error";
      w.textContent = p;
      $("list").appendChild(w);
    }
    if (result.problems.length > 50) {
      const w = document.createElement("p");
      w.className = "error";
      w.textContent = (result.problems.length - 50) + " more skipped.";
      $("list").appendChild(w);
    }
  }

  async function pick() {
    const f = ($("file").files || [])[0];
    if (!f) return;
    $("list").textContent = "";
    $("save").disabled = true;
    lastOutput = null;
    status("Reading...", false);
    try {
      const result = convert(await f.text());
      show(result);
      if (result.stats.written > 0) {
        lastOutput = result.output;
        $("save").disabled = false;
        status("Done. Download the file, then import it in Karakeep as described above.", false);
      } else {
        status("No article could be converted.", true);
      }
    } catch (err) {
      status(err && err.message ? err.message : "The file could not be read.", true);
    }
  }

  $("file").addEventListener("change", pick);
  $("save").addEventListener("click", download);
  $("clear").addEventListener("click", () => {
    $("file").value = "";
    $("list").textContent = "";
    $("save").disabled = true;
    lastOutput = null;
    status("Cleared.", false);
  });
})();
