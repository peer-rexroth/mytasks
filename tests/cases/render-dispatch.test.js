// Guards against the exact bug class flagged in CLAUDE.md: a function that
// mutates shared view state (collapsedTaskIds/collapsedSubIds) but calls
// renderList() instead of the general render(), so the change silently
// does nothing when the user is on board view.

function dispatchFixtureTask(){
  return { id: 't1', title: 'Fixture task', projectId: 'proj-inbox', status: 'todo', priority: 'medium', subtasks: [], tags: [] };
}

test('toggleTaskCollapse re-renders board view when viewMode is board', function () {
  tasks = [dispatchFixtureTask()];
  viewMode = 'board';
  render();
  document.getElementById('board').innerHTML = '';
  toggleTaskCollapse(tasks[0].id);
  assertTrue(document.getElementById('board').innerHTML.length > 0, 'render() should have repainted #board, not just #taskList');
});

test('toggleSubCollapse re-renders board view when viewMode is board', function () {
  tasks = [dispatchFixtureTask()];
  viewMode = 'board';
  tasks[0].subtasks = [{ id: 's1', text: 'Sub', done: false, subtasks: [{ id: 'st1', text: 'Step', done: false }] }];
  render();
  document.getElementById('board').innerHTML = '';
  toggleSubCollapse('s1');
  assertTrue(document.getElementById('board').innerHTML.length > 0, 'render() should have repainted #board, not just #taskList');
});

test('toggleTaskDone re-renders whichever view is active', function () {
  tasks = [dispatchFixtureTask()];
  viewMode = 'board';
  render();
  document.getElementById('board').innerHTML = '';
  toggleTaskDone(tasks[0].id);
  assertTrue(document.getElementById('board').innerHTML.length > 0);
  assertEqual(tasks[0].status, 'done');
});
