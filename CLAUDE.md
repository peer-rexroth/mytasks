# mytasks

A single-file task manager PWA. Everything — HTML, CSS, and JS — lives in
`mytasks.html` (~2,700 lines). There is no build step, no bundler, no
dependencies beyond a CDN Font Awesome link. Edit the file directly.

## Running it

`./start-mytasks.command` serves the directory on `http://127.0.0.1:8934` and
opens it in Chrome/Edge (Safari can't install this kind of PWA on macOS).
`./stop-mytasks.command` kills the server. A plain `file://` open also works
for quick checks, but PWA install/offline support requires the http server.

Data persists to `localStorage` by default; there's also an optional
File System Access API "linked file" sync (see `initFileSync`/`fileHandle`)
for browsers that support it (Chrome/Edge, not Safari).

## Tests

There's no lint config, but there is a test suite at `tests/`, built on the
same approach this project's history used before the suite existed: extract
the inline `<script>` block, mock just enough of the DOM
(`document.getElementById` returning cached fake elements with a settable
`innerHTML`, plus `localStorage`, `navigator`, `window`, `location`) and
`eval()` the real code in a headless JS engine (`osascript -l JavaScript` —
JavaScriptCore, no Node install needed, and none is installed in this repo's
usual dev environment). This catches real bugs that reading the code does
not — e.g. a function silently calling `renderList()` instead of the general
`render()`, breaking it when triggered from board view (`tests/cases/
render-dispatch.test.js` guards exactly this).

Run it with `./tests/run.sh` (optionally `./tests/run.sh someSubstring` to
run only tests whose name contains that substring). No install step.

Add a test by dropping a `tests/cases/*.test.js` file with `test('description',
function(){ ... })` calls — see existing files for the pattern. All app code
plus every `tests/cases/*.test.js` file get concatenated and `eval()`'d
*together* in one call, which is why a test can read/reassign `tasks`,
`projects`, and the other top-level `let` state directly by bare name, and
call any of the app's real functions — they're all sharing the same
eval'd lexical scope. `tests/harness.js` calls `resetState()` (fresh
`defaultProjects()`/`defaultTasks()` + `normalizeData()`) and clears the fake
DOM before every test, so tests never see state left over from another test
— write fixtures at the top of each test rather than relying on run order.
Helper functions declared at a test file's top level are visible to every
other test file too (same shared scope), so keep helper names distinctive
enough not to collide across files.

## Data model

```
Project { id, name, icon, locked? }
  // icon: a Font Awesome icon name from PROJECT_ICONS. Projects used to have
  // a `color` field (dot color) — replaced by icons; old saved data with
  // only `color` migrates to icon:'folder' in load().

Task {
  id, title, notes, projectId, status ('todo'|'doing'|'done'),
  priority ('high'|'medium'|'low'), dueDate, tags: [tagId],
  repeat, repeatInterval, repeatWeekdays, repeatEndDate, repeatMaxOccurrences,
  repeatOccurrenceCount, completedAt, createdAt, updatedAt,
  subtasks: [Subtask]
}

Subtask { id, text, done, subtasks: [Step] }   // one level of children
Step    { id, text, done }                      // leaf — no further nesting

Tag { id, label, color }  // color is one of CAT_COLORS' names (see below)
```

Nesting is exactly **3 levels**: task → subtask → step. Steps cannot have
their own children. `promoteStepToSubtask()`/`demoteSubtaskToStep()` and the
drag-and-drop system convert between the two levels; demoting a subtask that
already has its own steps is blocked (would need a 4th level) with a toast.

`CAT_COLORS` is now a small palette (`blue`, `teal`, `purple`) used only for
tag colors — it used to also drive project colors before projects switched to
icons; don't add project-color code back without removing the icon system,
and don't assume `CAT_COLORS` needs all 8 original hues restored.

`STATUSES`/`PRIORITIES` are `{id, label}` only — no color/bg fields. Status
and priority visuals are driven by CSS classes (`badge-status-*`,
`badge-priority-*`), not inline colors from these arrays.

## Views and where features live

There are three surfaces that can show a task's subtasks/steps, and they are
**deliberately not at feature parity**:

- **List view** (`renderList`, `#taskList`) — the primary surface. Full CRUD
  for subtasks and steps: add (inline input, Tab/Shift+Tab to
  indent/outdent between subtask-add and step-add), rename (dblclick),
  delete, drag-reorder within and **across** parents, promote/demote,
  collapse/expand (chevron, hover-revealed hierarchy buttons).
- **Drawer** (`renderDrawer`, the task detail slide-out) — same full CRUD as
  list view, plus this is the only place with a permanent (not hover-only)
  UI for it, since it's a dedicated single-task editor.
- **Board view** (`boardCardHtml`, `renderBoard`) — intentionally lighter.
  Subtasks support toggle/rename/add (mirroring list view), but steps are
  strictly read + toggle-done only — no rename/delete/drag for steps on a
  card. There is also **no drag-and-drop** for subtasks/steps within a
  card. Reason: `.board-card` is itself
  `draggable="true"` for column-to-column moves; nesting another
  `draggable="true"` row inside it is unreliable across browsers. Card
  height is also a real constraint (kanban columns want roughly uniform
  card heights), which is why steps collapse by default there.

  Board columns are **projects**, not status (`getBoardColumns()` maps over
  `projects`, one column each). Status is a per-card badge instead, and
  dragging a card to a different column sets `projectId` (`handleBoardDrop`),
  not `status`. `taskMatchesFilters(t, opts)` has both `opts.ignoreProject`
  and `opts.ignoreStatus` for this reason: whichever field is the current
  grouping axis gets ignored by the filter (so selecting it in the sidebar/
  toolbar can't collapse the board down to one column), while the *other*
  one still filters within columns normally. Board view passes
  `{ignoreProject:true}`; list view passes no opts (both filters fully
  apply there).

When adding a subtask/step feature, decide deliberately whether it belongs in
all three surfaces or just list view + drawer — don't assume parity.

## Shared state that spans views

A handful of module-level variables are intentionally shared across list,
board, and drawer renders, so toggling something in one view is reflected in
the others:

- `collapsedTaskIds` / `collapsedSubIds` — Sets of task/subtask ids whose
  children are collapsed. Read by both `renderList()` and `boardCardHtml()`.
  Any function that mutates these must call the general `render()`, not
  `renderList()` or `renderBoard()` specifically — this exact mistake (calling
  the wrong one) has caused several real "the button does nothing" bugs.
- `inlineAddSubtaskTaskId` / `inlineAddParentSubId` — which task/subtask
  currently has an open "add" input, and drives both which input renders and
  whether a container force-expands regardless of collapse state. Collapsing
  a task/subtask clears these if they pointed at it, to avoid a stale "still
  adding" flag holding a container open after the user tries to collapse it.
- `draggedItem` — `{type: 'subtask'|'step', subId, stepId?}`, one unified
  drag state for both subtask- and step-level drag-and-drop (list view +
  drawer only, not board — see above). Drop-target semantics: dropping on a
  **subtask row** reorders at top level (or, if dragging a step, moves it
  into that subtask as a step); dropping on a **step row** inserts into that
  step's parent subtask (promoting/demoting as needed).
- `drawerExpandedSubIds` — drawer-only, independent from `collapsedSubIds`,
  since the drawer's steps-panel-per-subtask UI has different default
  expand/collapse behavior than list view's chevrons.

Board view specifically does **not** honor `collapsedTaskIds` for hiding a
card's entire subtask list unless it also has its own way to un-collapse it
(it does, via its own chevron + the global collapse-all button) — a task
collapsed from list view must never get permanently stuck hidden on a board
card with no way back.

## Loading data from anywhere other than `load()`

`normalizeData()` holds all the schema-migration/default-filling logic
(subtask `subtasks: []`, project `icon` fallback, tag cleanup, repeat/date
defaults, etc.) and is called by `load()` after reading from `localStorage`.
**Anything else that assigns to `projects`/`tasks` from an external source
must also call `normalizeData()` before `render()`** — `applyImport()` (both
replace and merge modes) does this; the bug this fixed was importing an
older `.json` export whose schema predated steps/project-icons and crashing
on render because nothing had migrated it. If you add another data-loading
path (e.g. a new sync mechanism), route it through `normalizeData()` too.

## Conventions from this project's history

- Font Awesome 6.5 (`fa-solid`/`fa-regular`) via CDN, used throughout.
- New buttons should get `this.blur()` in their `onclick` (or rely on the
  global click listener that blurs any clicked `<button>`) so a lingering
  focus ring doesn't reappear on the next keypress.
- `button:focus:not(:focus-visible) { outline: none; }` is global — focus
  rings only show for real keyboard navigation, not post-click.
- Custom checkboxes are `<div role="checkbox" tabindex="0">`, not real
  `<input>`s, so there's an accessibility "echo" in the global keydown
  handler: if a `role="checkbox"`/`role="button"` div has focus, Space/Enter
  re-clicks it. That block runs *before* `handleListKeyNav`/
  `handleBoardKeyNav`, so it silently swallows Space/Enter whenever a
  checkbox happens to still be focused from a prior click — which is the
  normal case, since clicking a `tabindex="0"` div focuses it. The global
  click listener blurs `[role="checkbox"]` elements (alongside `<button>`s)
  specifically to prevent this; don't remove that without re-checking
  Space-to-collapse and Enter-to-open still work in list/board view.
- Commit messages in this repo tend to explain *why*, and call out when a
  fix was verified by execution (not just by reading), since that's the
  actual verification method available here.
