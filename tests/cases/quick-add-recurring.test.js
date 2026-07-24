// quickAddTask, and the recurring-task advance/skip logic.

test('quickAddTask adds a task from the input and clears it', function () {
  const before = tasks.length;
  const input = document.getElementById('quickAddInput');
  input.value = 'Buy milk';
  quickAddTask({ key: 'Enter', target: input });
  assertEqual(tasks.length, before + 1);
  assertEqual(tasks[0].title, 'Buy milk', 'new task should be unshifted to the front');
  assertEqual(input.value, '');
});

test('quickAddTask ignores non-Enter keys', function () {
  const before = tasks.length;
  const input = document.getElementById('quickAddInput');
  input.value = 'Should not be added';
  quickAddTask({ key: 'a', target: input });
  assertEqual(tasks.length, before);
});

// Tab is a no-op here rather than falling through to the browser's default
// focus-to-next-tabbable-element behavior — this is a single-purpose field
// with no adjacent field to tab into, so leaving it should require a click
// or Escape, not an incidental Tab press.
test('quickAddTask swallows Tab, preventing default so focus stays put', function () {
  const input = document.getElementById('quickAddInput');
  input.value = 'Still typing';
  let prevented = false;
  quickAddTask({ key: 'Tab', target: input, preventDefault(){ prevented = true; } });
  assertTrue(prevented, 'Tab should be preventDefault-ed instead of left to the browser');
  assertEqual(input.value, 'Still typing', 'the draft text should be untouched');
});

test('quickAddTask ignores blank input', function () {
  const before = tasks.length;
  const input = document.getElementById('quickAddInput');
  input.value = '   ';
  quickAddTask({ key: 'Enter', target: input });
  assertEqual(tasks.length, before);
});

test('quickAddTask assigns the active project filter instead of always Inbox', function () {
  filterProjectId = 'proj-work';
  const input = document.getElementById('quickAddInput');
  input.value = 'Scoped to Work';
  quickAddTask({ key: 'Enter', target: input });
  assertEqual(tasks[0].projectId, 'proj-work');
});

test('advanceRecurring moves a daily task forward by its interval and clears done subtasks and steps', function () {
  tasks = [{
    id: 't1', title: 'Daily', projectId: 'proj-inbox', status: 'todo', priority: 'medium', tags: [],
    dueDate: '2026-01-01', repeat: 'daily', repeatInterval: 1, repeatOccurrenceCount: 0,
    subtasks: [{ id: 's1', text: 'step', done: true, subtasks: [{ id: 'st1', text: 'nested step', done: true }] }]
  }];
  const result = advanceRecurring('t1');
  assertFalse(result.ended);
  assertEqual(tasks[0].dueDate, '2026-01-02');
  assertEqual(tasks[0].repeatOccurrenceCount, 1);
  assertFalse(tasks[0].subtasks[0].done, 'completed subtasks should reset for the new occurrence');
  assertFalse(tasks[0].subtasks[0].subtasks[0].done, 'completed steps nested under a subtask should reset too, not just the subtask itself');
});

test('advanceRecurring ends the series once repeatMaxOccurrences is reached', function () {
  tasks = [{
    id: 't1', title: 'One-shot repeat', projectId: 'proj-inbox', status: 'todo', priority: 'medium', tags: [],
    dueDate: '2026-01-01', repeat: 'daily', repeatInterval: 1, repeatOccurrenceCount: 0, repeatMaxOccurrences: 1,
    subtasks: []
  }];
  const result = advanceRecurring('t1');
  assertTrue(result.ended);
  assertEqual(tasks[0].repeat, 'none');
});

test('advanceRecurring().undo restores the previous dueDate, repeat, and subtask/step state', function () {
  tasks = [{
    id: 't1', title: 'Daily', projectId: 'proj-inbox', status: 'todo', priority: 'medium', tags: [],
    dueDate: '2026-01-01', repeat: 'daily', repeatInterval: 1, repeatOccurrenceCount: 0,
    subtasks: [{ id: 's1', text: 'step', done: true, subtasks: [{ id: 'st1', text: 'nested step', done: true }] }]
  }];
  const result = advanceRecurring('t1');
  result.undo();
  assertEqual(tasks[0].dueDate, '2026-01-01');
  assertEqual(tasks[0].repeatOccurrenceCount, 0);
  assertTrue(tasks[0].subtasks[0].done, 'undo should restore the subtask done-state too');
  assertTrue(tasks[0].subtasks[0].subtasks[0].done, 'undo should restore the nested step done-state too, not share a mutated reference with the live task');
});
