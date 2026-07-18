// Import / export / merge — regression coverage for "Fix import not
// migrating old-schema data" and the replace-mode auto-backup.

test('mergeData adds new tasks and updates newer-changed existing ones', function () {
  tasks = [{ id: 't1', title: 'Original', projectId: 'proj-inbox', updatedAt: 100 }];
  const { added, updated } = mergeData({
    tasks: [
      { id: 't1', title: 'Edited elsewhere', projectId: 'proj-inbox', updatedAt: 200 },
      { id: 't2', title: 'Brand new', projectId: 'proj-inbox', updatedAt: 100 }
    ]
  });
  assertEqual(added, 1);
  assertEqual(updated, 1);
  assertEqual(tasks.find(t => t.id === 't1').title, 'Edited elsewhere');
  assertTrue(!!tasks.find(t => t.id === 't2'), 'new task should have been added');
});

test('mergeData ignores an incoming task that is older than the local copy', function () {
  tasks = [{ id: 't1', title: 'Local newer', projectId: 'proj-inbox', updatedAt: 500 }];
  mergeData({ tasks: [{ id: 't1', title: 'Stale import', projectId: 'proj-inbox', updatedAt: 100 }] });
  assertEqual(tasks[0].title, 'Local newer');
});

test('applyImport replace mode backs up current data before overwriting', function () {
  tasks = [{ id: 'old', title: 'Will be replaced', projectId: 'proj-inbox' }];
  pendingImportData = { projects: defaultProjects(), tasks: [{ id: 'new', title: 'Imported', projectId: 'proj-inbox' }] };
  applyImport('replace');
  assertTrue(!!globalThis.__lastBlob, 'downloadBackup should construct a Blob before replacing');
  assertIncludes(globalThis.__lastBlob.parts[0], 'Will be replaced', 'the backup blob should contain the pre-replace data');
  assertEqual(tasks.length, 1);
  assertEqual(tasks[0].id, 'new');
});

test('applyImport replace mode migrates old-schema import data instead of crashing', function () {
  // Old export predating steps/project-icons: no subtasks array, no icon.
  pendingImportData = {
    projects: [{ id: 'proj-inbox', name: 'Inbox', locked: true }],
    tasks: [{ id: 't1', title: 'From an old export', projectId: 'proj-inbox', subtasks: [{ id: 's1', text: 'legacy step' }] }]
  };
  applyImport('replace');
  assertEqual(projById('proj-inbox').icon, 'folder');
  assertDeepEqual(tasks[0].subtasks[0].subtasks, []);
});

test('exportLibrary downloads a JSON blob containing the current projects and tasks', function () {
  tasks = [{ id: 't1', title: 'Exported task', projectId: 'proj-inbox' }];
  exportLibrary();
  const payload = JSON.parse(globalThis.__lastBlob.parts[0]);
  assertEqual(payload.tasks[0].title, 'Exported task');
});
