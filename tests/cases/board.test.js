// Board view is grouped by project (not status) — getBoardColumns() maps
// one column per project, and dropping a card sets projectId, not status.

test('getBoardColumns returns one column per project, in project order', function () {
  const cols = getBoardColumns();
  assertDeepEqual(cols.map(c => c.project.id), projects.map(p => p.id));
});

test('getBoardColumns ignores the project filter within each column (ignoreProject)', function () {
  filterProjectId = 'proj-work';
  const cols = getBoardColumns();
  const personalCol = cols.find(c => c.project.id === 'proj-personal');
  assertTrue(personalCol.tasks.length > 0, 'proj-personal column should still show its own tasks even though proj-work is the active filter');
});

test('handleBoardDrop moves the dragged task to the target column\'s project, not its status', function () {
  const t = tasks.find(x => x.projectId === 'proj-inbox');
  draggingTaskId = t.id;
  const fakeEvent = { preventDefault() {}, currentTarget: document.getElementById('board') };
  handleBoardDrop(fakeEvent, 'proj-personal');
  assertEqual(tasks.find(x => x.id === t.id).projectId, 'proj-personal');
  assertEqual(tasks.find(x => x.id === t.id).status, 'todo', 'status should be untouched by a board column drop');
});

test('handleBoardDrop is a no-op when nothing is being dragged', function () {
  draggingTaskId = null;
  const before = JSON.stringify(tasks);
  const fakeEvent = { preventDefault() {}, currentTarget: document.getElementById('board') };
  handleBoardDrop(fakeEvent, 'proj-personal');
  assertEqual(JSON.stringify(tasks), before);
});
