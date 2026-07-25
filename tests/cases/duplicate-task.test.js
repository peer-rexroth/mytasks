// duplicateTask() — carries over the fields that make sense to copy
// (priority, project, repeat settings, subtasks/steps) and resets the ones
// that shouldn't survive a copy (status, dueDate, completedAt).

test('duplicateTask copies tags onto the new task', function () {
  tasks = [{ id: 't1', title: 'Original', projectId: 'proj-inbox', status: 'todo', priority: 'medium', subtasks: [], tags: ['deep-work'] }];
  duplicateTask('t1');
  assertEqual(tasks.length, 2);
  const copy = tasks.find(t => t.id !== 't1');
  assertDeepEqual(copy.tags, ['deep-work']);
});

test('duplicateTask gives the copy its own tags array, not a shared reference with the original', function () {
  tasks = [{ id: 't1', title: 'Original', projectId: 'proj-inbox', status: 'todo', priority: 'medium', subtasks: [], tags: ['deep-work'] }];
  duplicateTask('t1');
  const copy = tasks.find(t => t.id !== 't1');
  copy.tags.push('urgent');
  assertDeepEqual(tasks.find(t => t.id === 't1').tags, ['deep-work'], 'mutating the copy\'s tags should not affect the original');
});

test('duplicateTask clones subtasks, steps, and sub-steps, independent of the original', function () {
  tasks = [{
    id: 't1', title: 'Original', projectId: 'proj-inbox', status: 'todo', priority: 'medium', tags: [],
    subtasks: [{ id: 's1', text: 'Sub', done: false, subtasks: [{ id: 'st1', text: 'Step', done: false, subtasks: [{ id: 'sst1', text: 'Sub-step', done: false }] }] }]
  }];
  duplicateTask('t1');
  const copy = tasks.find(t => t.id !== 't1');
  assertEqual(copy.subtasks[0].subtasks[0].subtasks[0].text, 'Sub-step');
  assertTrue(copy.subtasks[0].id !== 's1' && copy.subtasks[0].subtasks[0].id !== 'st1' && copy.subtasks[0].subtasks[0].subtasks[0].id !== 'sst1', 'the copy should get fresh ids at every level');
  copy.subtasks[0].subtasks[0].subtasks[0].done = true;
  assertFalse(tasks.find(t => t.id === 't1').subtasks[0].subtasks[0].subtasks[0].done, 'mutating the copy\'s nested sub-step should not affect the original');
});
