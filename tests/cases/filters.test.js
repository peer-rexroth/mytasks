// taskMatchesFilters — including the ignoreProject/ignoreStatus opts that
// board view and list view rely on to pick which axis they group by
// without the sidebar/toolbar filters collapsing everything to one column.

test('project filter excludes tasks from other projects by default', function () {
  filterProjectId = 'proj-work';
  const t = tasks.find(x => x.projectId === 'proj-personal');
  assertFalse(taskMatchesFilters(t));
});

test('ignoreProject lets a task through regardless of the project filter', function () {
  filterProjectId = 'proj-work';
  const t = tasks.find(x => x.projectId === 'proj-personal');
  assertTrue(taskMatchesFilters(t, { ignoreProject: true }));
});

test('status filter excludes non-matching status by default', function () {
  filterStatus = ['done'];
  const t = tasks.find(x => x.status === 'todo');
  assertFalse(taskMatchesFilters(t));
});

test('ignoreStatus lets a task through regardless of the status filter', function () {
  filterStatus = ['done'];
  const t = tasks.find(x => x.status === 'todo');
  assertTrue(taskMatchesFilters(t, { ignoreStatus: true }));
});

test('search query matches title, notes, subtask text, and tag labels', function () {
  tasks = [
    { id: 't1', title: 'Nothing relevant', notes: '', projectId: 'proj-inbox', status: 'todo', priority: 'medium', subtasks: [], tags: [] },
    { id: 't2', title: 'Also nothing', notes: 'mentions zebra somewhere', projectId: 'proj-inbox', status: 'todo', priority: 'medium', subtasks: [], tags: [] }
  ];
  searchQuery = 'zebra';
  assertFalse(taskMatchesFilters(tasks[0]));
  assertTrue(taskMatchesFilters(tasks[1]));
});

test('getFilteredSortedTasks always sorts done tasks after not-done tasks', function () {
  tasks = [
    { id: 't1', title: 'Done one', projectId: 'proj-inbox', status: 'done', priority: 'medium', subtasks: [], tags: [], completedAt: 1 },
    { id: 't2', title: 'Still open', projectId: 'proj-inbox', status: 'todo', priority: 'medium', subtasks: [], tags: [] }
  ];
  const sorted = getFilteredSortedTasks();
  assertEqual(sorted[sorted.length - 1].status, 'done');
});
