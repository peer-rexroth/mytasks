// File System Access sync paths (linkFile/reconnectFile/initFileSync,
// fileSyncWrite's cross-tab merge branch) assign to tasks/projects from an
// external .json file, same as applyImport() — CLAUDE.md's rule "anything
// that assigns projects/tasks from an external source must also call
// normalizeData()" applies here too. reconnectFile() is the most tractable
// of the four to mock (just fileHandle.requestPermission/getFile, no File
// System Access picker or IndexedDB needed) and stands in for the same
// fix applied to linkFile(), initFileSync(), and fileSyncWrite().

test('reconnectFile() migrates old-schema data instead of leaving it unnormalized', async function () {
  // Old export predating steps/project-icons: no subtasks array, no icon.
  // Start from an empty local library — reconnectFile() now merges rather
  // than overwrites, so a pre-existing local 't1'/'proj-inbox' would just
  // win the merge and this test wouldn't actually exercise the incoming
  // file's data at all.
  projects = []; tasks = [];
  const oldSchemaJson = JSON.stringify({
    projects: [{ id: 'proj-inbox', name: 'Inbox', locked: true }],
    tasks: [{ id: 't1', title: 'From a reconnected file', projectId: 'proj-inbox', subtasks: [{ id: 's1', text: 'legacy step' }] }]
  });
  fileHandle = {
    name: 'test.json',
    requestPermission: async () => 'granted',
    getFile: async () => ({ text: async () => oldSchemaJson })
  };
  await reconnectFile();
  assertEqual(projById('proj-inbox').icon, 'folder', 'project should get the default icon backfilled');
  assertDeepEqual(tasks[0].subtasks[0].subtasks, [], 'subtask should get its own subtasks array backfilled');
  assertEqual(tasks[0].priority, 'medium', 'task should get the default priority backfilled');
});

test('reconnectFile() does nothing when there is no linked file handle', async function () {
  fileHandle = null;
  const tasksBefore = JSON.stringify(tasks);
  await reconnectFile();
  assertEqual(JSON.stringify(tasks), tasksBefore);
});
