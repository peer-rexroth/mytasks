// Subtask <-> step promote/demote, and the collapse state shared across
// list/board/drawer renders.

function hierarchyFixtureTask() {
  return {
    id: 't1', title: 'Parent', projectId: 'proj-inbox', status: 'todo', priority: 'medium', tags: [],
    subtasks: [
      { id: 's1', text: 'Subtask one', done: false, subtasks: [{ id: 'st1', text: 'Step under s1', done: false }] },
      { id: 's2', text: 'Subtask two', done: false, subtasks: [] }
    ]
  };
}

test('promoteStepToSubtask moves a step out to become its own subtask, right after its old parent', function () {
  tasks = [hierarchyFixtureTask()];
  promoteStepToSubtask('t1', 's1', 'st1');
  const t = tasks[0];
  assertEqual(t.subtasks.length, 3);
  assertEqual(t.subtasks[0].subtasks.length, 0, 's1 should have lost its step');
  assertEqual(t.subtasks[1].id, 'st1', 'promoted step should land right after its old parent');
  assertDeepEqual(t.subtasks[1].subtasks, []);
});

test('demoteSubtaskToStep folds a subtask into the previous one as a step', function () {
  tasks = [hierarchyFixtureTask()];
  demoteSubtaskToStep('t1', 's2');
  const t = tasks[0];
  assertEqual(t.subtasks.length, 1);
  assertEqual(t.subtasks[0].id, 's1');
  assertEqual(t.subtasks[0].subtasks[1].id, 's2', 's2 should now be a step under s1');
});

test('demoting the first subtask is blocked — nothing to fold it into', function () {
  tasks = [hierarchyFixtureTask()];
  demoteSubtaskToStep('t1', 's1');
  assertEqual(tasks[0].subtasks.length, 2, 'nothing should change');
  assertIncludes(document.getElementById('toastMsg').textContent, 'below another subtask');
});

test('demoting a subtask that already has its own steps is blocked', function () {
  tasks = [hierarchyFixtureTask()];
  // s2 has no steps; give it one so it's now s2-with-steps, and try to fold
  // it into s1 (which would need a 4th nesting level).
  tasks[0].subtasks[1].subtasks = [{ id: 'st2', text: 'A step on s2', done: false }];
  demoteSubtaskToStep('t1', 's2');
  assertEqual(tasks[0].subtasks.length, 2, 'nothing should change');
  assertIncludes(document.getElementById('toastMsg').textContent, 'own steps');
});

test('collapsedTaskIds is read by both renderList and boardCardHtml (shared, not view-local)', function () {
  tasks = [hierarchyFixtureTask()];
  collapsedTaskIds.add('t1');
  renderList();
  const listHtml = document.getElementById('taskList').innerHTML;
  const boardHtml = boardCardHtml(tasks[0]);
  // Whatever the exact markup, a collapsed task's steps/subtask rows should
  // not render as expanded content in either surface — spot check that the
  // nested step text is absent from both when collapsed.
  assertNotIncludes(listHtml, 'Step under s1');
  assertNotIncludes(boardHtml, 'Step under s1');
});
