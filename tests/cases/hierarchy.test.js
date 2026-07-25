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

test('demoting a subtask that has its own steps now folds them in as sub-steps', function () {
  tasks = [hierarchyFixtureTask()];
  // s2 has no steps; give it one so it's now s2-with-steps, and fold it into
  // s1 — now legal, since there's a 4th level (sub-step) to receive s2's step.
  tasks[0].subtasks[1].subtasks = [{ id: 'st2', text: 'A step on s2', done: false }];
  demoteSubtaskToStep('t1', 's2');
  const t = tasks[0];
  assertEqual(t.subtasks.length, 1);
  assertEqual(t.subtasks[0].id, 's1');
  assertEqual(t.subtasks[0].subtasks[1].id, 's2', 's2 should now be a step under s1');
  assertEqual(t.subtasks[0].subtasks[1].subtasks[0].id, 'st2', "s2's own step should travel along as its new sub-step");
});

test('promoteStepToSubtask preserves a step\'s own sub-steps instead of wiping them', function () {
  tasks = [hierarchyFixtureTask()];
  tasks[0].subtasks[0].subtasks[0].subtasks = [{ id: 'sst1', text: 'Sub-step under st1', done: false }];
  promoteStepToSubtask('t1', 's1', 'st1');
  const promoted = tasks[0].subtasks.find(x => x.id === 'st1');
  assertEqual(promoted.subtasks.length, 1, "the promoted step's own sub-step should survive as its new step");
  assertEqual(promoted.subtasks[0].id, 'sst1');
});

test('promoteSubSubtaskToStep moves a sub-step out to become its own step, right after its old parent', function () {
  tasks = [hierarchyFixtureTask()];
  tasks[0].subtasks[0].subtasks[0].subtasks = [{ id: 'sst1', text: 'Sub-step one', done: false }];
  promoteSubSubtaskToStep('t1', 's1', 'st1', 'sst1');
  const step = tasks[0].subtasks[0].subtasks;
  assertEqual(step.length, 2);
  assertEqual(step[0].subtasks.length, 0, 'st1 should have lost its sub-step');
  assertEqual(step[1].id, 'sst1', 'promoted sub-step should land right after its old parent');
});

test('demoteStepToSubSubtask folds a step into the previous one as a sub-step', function () {
  tasks = [hierarchyFixtureTask()];
  tasks[0].subtasks[0].subtasks.push({ id: 'st2', text: 'Second step under s1', done: false });
  demoteStepToSubSubtask('t1', 's1', 'st2');
  const steps = tasks[0].subtasks[0].subtasks;
  assertEqual(steps.length, 1);
  assertEqual(steps[0].id, 'st1');
  assertEqual(steps[0].subtasks[0].id, 'st2', 'st2 should now be a sub-step under st1');
});

test('demoting the first step (of a subtask) is blocked — nothing to fold it into', function () {
  tasks = [hierarchyFixtureTask()];
  demoteStepToSubSubtask('t1', 's1', 'st1');
  assertEqual(tasks[0].subtasks[0].subtasks.length, 1, 'nothing should change');
  assertIncludes(document.getElementById('toastMsg').textContent, 'below another step');
});

test('demoting a step that already has its own sub-steps is blocked', function () {
  tasks = [hierarchyFixtureTask()];
  tasks[0].subtasks[0].subtasks.push({ id: 'st2', text: 'Second step under s1', done: false, subtasks: [{ id: 'sst1', text: 'Existing sub-step', done: false }] });
  demoteStepToSubSubtask('t1', 's1', 'st2');
  assertEqual(tasks[0].subtasks[0].subtasks.length, 2, 'nothing should change');
  assertIncludes(document.getElementById('toastMsg').textContent, 'own sub-steps');
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

test('collapsedSubSubIds hides a sub-step in list view when its parent step is collapsed', function () {
  tasks = [hierarchyFixtureTask()];
  tasks[0].subtasks[0].subtasks[0].subtasks = [{ id: 'sst1', text: 'Sub-step under st1', done: false }];
  collapsedSubSubIds.add('st1');
  renderList();
  assertNotIncludes(document.getElementById('taskList').innerHTML, 'Sub-step under st1');
});

test('renderDrawer renders a 4-levels-deep task (task/subtask/step/sub-step) without throwing, showing the sub-step when its panel is expanded', function () {
  tasks = [hierarchyFixtureTask()];
  tasks[0].subtasks[0].subtasks[0].subtasks = [{ id: 'sst1', text: 'Sub-step under st1', done: false }];
  activeTaskId = 't1';
  drawerExpandedSubIds.add('s1');
  drawerExpandedStepIds.add('st1');
  renderDrawer();
  assertIncludes(document.getElementById('drawer').innerHTML, 'Sub-step under st1');
});

// Drag-and-drop — handleHierarchyDrop (Subtask<->Step, cross-parent) and
// handleSubstepDrop (Sub-step, same-parent-only — see CLAUDE.md).
function fakeDragEvent(clientY, height) {
  return { preventDefault(){}, stopPropagation(){}, clientY,
    currentTarget: { classList: { remove(){} }, getBoundingClientRect: () => ({ top: 0, height }) } };
}

test('handleHierarchyDrop lets a subtask-with-its-own-steps be dragged onto a step row (its steps become sub-steps)', function () {
  tasks = [hierarchyFixtureTask()];
  tasks[0].subtasks[1].subtasks = [{ id: 'st2', text: 'A step on s2', done: false }];
  draggedItem = { type: 'subtask', subId: 's2' };
  handleHierarchyDrop(fakeDragEvent(30, 40), 't1', 'step', 's1', 'st1');
  const t = tasks[0];
  assertEqual(t.subtasks.length, 1, 's2 should have been folded into s1 as a step');
  const steps = t.subtasks[0].subtasks;
  const movedStep = steps.find(x => x.id === 's2');
  assertTrue(!!movedStep, 's2 should now be a step under s1');
  assertEqual(movedStep.subtasks[0].id, 'st2', "s2's own step should travel along as its new sub-step");
});

test('handleHierarchyDrop preserves a dragged step\'s own sub-steps when reordering it among other steps', function () {
  tasks = [hierarchyFixtureTask()];
  tasks[0].subtasks[0].subtasks[0].subtasks = [{ id: 'sst1', text: 'Sub-step under st1', done: false }];
  tasks[0].subtasks[0].subtasks.push({ id: 'st2', text: 'Second step under s1', done: false });
  draggedItem = { type: 'step', subId: 's1', stepId: 'st1' };
  handleHierarchyDrop(fakeDragEvent(30, 40), 't1', 'step', 's1', 'st2');
  const movedStep = tasks[0].subtasks[0].subtasks.find(x => x.id === 'st1');
  assertEqual(movedStep.subtasks.length, 1, "st1's own sub-step should survive being dragged/reordered");
  assertEqual(movedStep.subtasks[0].id, 'sst1');
});

test('handleSubstepDrop reorders sub-steps within their own parent step', function () {
  tasks = [hierarchyFixtureTask()];
  tasks[0].subtasks[0].subtasks[0].subtasks = [
    { id: 'sst1', text: 'First', done: false },
    { id: 'sst2', text: 'Second', done: false }
  ];
  draggedSubstep = { taskId: 't1', subId: 's1', stepId: 'st1', substepId: 'sst2' };
  handleSubstepDrop(fakeDragEvent(10, 40), 't1', 's1', 'st1', 'sst1');
  const subSteps = tasks[0].subtasks[0].subtasks[0].subtasks;
  assertEqual(subSteps[0].id, 'sst2', 'sst2 dropped on the top half of sst1 should land before it');
  assertEqual(subSteps[1].id, 'sst1');
});

test('handleSubstepDrop does nothing when the target sub-step belongs to a different step (same-parent-only)', function () {
  tasks = [hierarchyFixtureTask()];
  tasks[0].subtasks[0].subtasks[0].subtasks = [{ id: 'sst1', text: 'Under st1', done: false }];
  tasks[0].subtasks[0].subtasks.push({ id: 'st2', text: 'Second step', done: false, subtasks: [{ id: 'sst2', text: 'Under st2', done: false }] });
  draggedSubstep = { taskId: 't1', subId: 's1', stepId: 'st1', substepId: 'sst1' };
  handleSubstepDrop(fakeDragEvent(10, 40), 't1', 's1', 'st2', 'sst2');
  assertEqual(tasks[0].subtasks[0].subtasks[0].subtasks.length, 1, 'sst1 should still be under st1');
  assertEqual(tasks[0].subtasks[0].subtasks[1].subtasks.length, 1, 'sst2 should still be under st2, untouched');
});
