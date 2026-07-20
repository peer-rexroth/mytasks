// Board view is grouped by project (not status) — getBoardColumns() maps
// one column per visible project, and dropping a card sets projectId, not
// status. proj-deleted is a real project (see visibleProjects() in
// delete-project.test.js) but intentionally gets no column.

test('getBoardColumns returns one column per visible project, in order', function () {
  const cols = getBoardColumns();
  assertDeepEqual(cols.map(c => c.project.id), visibleProjects().map(p => p.id));
});

test('getBoardColumns ignores the project filter within each column (ignoreProject)', function () {
  tasks = [{ id: 't1', title: 'Personal task', projectId: 'proj-personal', status: 'todo', priority: 'medium', subtasks: [], tags: [] }];
  filterProjectId = 'proj-work';
  const cols = getBoardColumns();
  const personalCol = cols.find(c => c.project.id === 'proj-personal');
  assertTrue(personalCol.tasks.length > 0, 'proj-personal column should still show its own tasks even though proj-work is the active filter');
});

test('getBoardColumns drops the column entirely for a project in allTasksHiddenProjectIds', function () {
  allTasksHiddenProjectIds = ['proj-personal'];
  const cols = getBoardColumns();
  assertFalse(cols.some(c => c.project.id === 'proj-personal'), 'a hidden project should get no column at all, not just an empty one');
});

test('getBoardColumns keeps other columns when one project is hidden', function () {
  allTasksHiddenProjectIds = ['proj-personal'];
  const cols = getBoardColumns();
  assertTrue(cols.some(c => c.project.id === 'proj-work'), 'other projects should be unaffected');
});

test('handleBoardDrop moves the dragged task to the target column\'s project, not its status', function () {
  tasks = [{ id: 't1', title: 'Inbox task', projectId: 'proj-inbox', status: 'todo', priority: 'medium', subtasks: [], tags: [] }];
  const t = tasks.find(x => x.projectId === 'proj-inbox');
  draggingTaskId = t.id;
  const fakeEvent = { preventDefault() {}, currentTarget: document.getElementById('board') };
  handleBoardDrop(fakeEvent, 'proj-personal');
  assertEqual(tasks.find(x => x.id === t.id).projectId, 'proj-personal');
  assertEqual(tasks.find(x => x.id === t.id).status, 'todo', 'status should be untouched by a board column drop');
});

test('getVisibleTasksForCollapse uses the same ignoreProject axis as getBoardColumns, so collapse-all reaches every visible column', function () {
  tasks = [
    { id: 't1', title: 'Personal task', projectId: 'proj-personal', status: 'todo', priority: 'medium', subtasks: [], tags: [] },
    { id: 't2', title: 'Work task', projectId: 'proj-work', status: 'todo', priority: 'medium', subtasks: [], tags: [] }
  ];
  viewMode = 'board';
  filterProjectId = 'proj-work';
  const visible = getVisibleTasksForCollapse();
  assertTrue(visible.some(t => t.id === 't1'), 'a task in a non-filtered project column should still be reachable by collapse-all, since board view shows every column regardless of the project filter');
});

test('getVisibleTasksForCollapse excludes tasks whose column is hidden in board view', function () {
  tasks = [{ id: 't1', title: 'Personal task', projectId: 'proj-personal', status: 'todo', priority: 'medium', subtasks: [], tags: [] }];
  viewMode = 'board';
  allTasksHiddenProjectIds = ['proj-personal'];
  const visible = getVisibleTasksForCollapse();
  assertFalse(visible.some(t => t.id === 't1'), 'collapse-all should not touch tasks whose column is not even rendered');
});

test('handleBoardDrop is a no-op when nothing is being dragged', function () {
  draggingTaskId = null;
  const before = JSON.stringify(tasks);
  const fakeEvent = { preventDefault() {}, currentTarget: document.getElementById('board') };
  handleBoardDrop(fakeEvent, 'proj-personal');
  assertEqual(JSON.stringify(tasks), before);
});
