// normalizeData() / load() — schema defaults and migration.

test('project missing icon defaults to folder', function () {
  projects = [{ id: 'p1', name: 'Old' }];
  tasks = [];
  normalizeData();
  assertEqual(projById('p1').icon, 'folder');
});

test('missing proj-inbox is recreated at the front, locked', function () {
  projects = [{ id: 'p1', name: 'Only', icon: 'folder' }];
  tasks = [];
  normalizeData();
  assertEqual(projects[0].id, 'proj-inbox');
  assertTrue(projects[0].locked, 'proj-inbox should be locked');
});

test('task with unknown projectId is reassigned to proj-inbox', function () {
  tasks = [{ id: 't1', title: 'Orphan', projectId: 'does-not-exist' }];
  normalizeData();
  assertEqual(tasks[0].projectId, 'proj-inbox');
});

test('task missing priority/status get medium/todo defaults', function () {
  tasks = [{ id: 't1', title: 'Bare', projectId: 'proj-inbox' }];
  normalizeData();
  assertEqual(tasks[0].priority, 'medium');
  assertEqual(tasks[0].status, 'todo');
});

test('subtask missing its own subtasks array gets one', function () {
  tasks = [{ id: 't1', title: 'T', projectId: 'proj-inbox', subtasks: [{ id: 's1', text: 'step-holder', done: false }] }];
  normalizeData();
  assertDeepEqual(tasks[0].subtasks[0].subtasks, []);
});

test('unknown tag ids are dropped, known ones kept', function () {
  tasks = [{ id: 't1', title: 'T', projectId: 'proj-inbox', tags: ['deep-work', 'not-a-real-tag'] }];
  normalizeData();
  assertDeepEqual(tasks[0].tags, ['deep-work']);
});

test('completedAt backfills from updatedAt for already-done tasks', function () {
  tasks = [{ id: 't1', title: 'Done long ago', projectId: 'proj-inbox', status: 'done', updatedAt: 12345 }];
  normalizeData();
  assertEqual(tasks[0].completedAt, 12345);
});

test('completedAt stays null for not-done tasks', function () {
  tasks = [{ id: 't1', title: 'Still open', projectId: 'proj-inbox', status: 'todo', updatedAt: 12345 }];
  normalizeData();
  assertEqual(tasks[0].completedAt, null);
});

test('load() migrates old-schema data read from localStorage', function () {
  // Simulates data saved before steps/project-icons existed: no subtasks
  // array on a subtask, no project icon, no tags array on the task.
  const oldData = {
    projects: [{ id: 'proj-inbox', name: 'Inbox', locked: true }],
    tasks: [{ id: 't1', title: 'Legacy task', projectId: 'proj-inbox', subtasks: [{ id: 's1', text: 'old step' }] }]
  };
  localStorage.setItem('mytasks_data_v1', JSON.stringify(oldData));
  load();
  assertEqual(projById('proj-inbox').icon, 'folder');
  assertDeepEqual(tasks[0].subtasks[0].subtasks, []);
  assertDeepEqual(tasks[0].tags, []);
});
