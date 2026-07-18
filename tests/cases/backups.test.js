// Automatic daily backup snapshots — a local safety net distinct from the
// linked-file sync (which mirrors live state, not history). One snapshot
// per calendar day, capped at MAX_BACKUPS, restorable via restoreBackup().

test('save() takes a backup snapshot on the first save of the day', function () {
  localStorage.removeItem(BACKUPS_KEY);
  tasks = [{ id: 't1', title: 'Snapshot me', projectId: 'proj-inbox', status: 'todo', priority: 'medium', subtasks: [], tags: [] }];
  save();
  const backups = getBackups();
  assertEqual(backups.length, 1);
  assertEqual(backups[0].date, todayStr());
  assertEqual(backups[0].tasks[0].title, 'Snapshot me');
});

test('save() does not take a second snapshot the same day', function () {
  localStorage.removeItem(BACKUPS_KEY);
  save();
  tasks = [{ id: 't2', title: 'Changed after first snapshot', projectId: 'proj-inbox', status: 'todo', priority: 'medium', subtasks: [], tags: [] }];
  save();
  const backups = getBackups();
  assertEqual(backups.length, 1, 'still just one snapshot for today');
  assertNotIncludes(JSON.stringify(backups[0].tasks), 'Changed after first snapshot', 'the snapshot should be from the first save, not overwritten by the second');
});

test('backups are capped at MAX_BACKUPS, oldest dropped first', function () {
  const seeded = [];
  for(let i = 1; i <= MAX_BACKUPS; i++){
    seeded.push({ date: `2020-01-0${i}`, savedAt: i, projects: [], tasks: [] });
  }
  localStorage.setItem(BACKUPS_KEY, JSON.stringify(seeded));
  assertEqual(getBackups().length, MAX_BACKUPS);
  save(); // today's snapshot should push it over the cap
  const backups = getBackups();
  assertEqual(backups.length, MAX_BACKUPS, 'cap should still hold after adding a new one');
  assertEqual(backups[0].date, '2020-01-02', 'oldest (01-01) should have been dropped');
  assertEqual(backups[backups.length-1].date, todayStr());
});

test('getBackups() returns an empty array when storage is empty or corrupt', function () {
  localStorage.removeItem(BACKUPS_KEY);
  assertDeepEqual(getBackups(), []);
  localStorage.setItem(BACKUPS_KEY, 'not valid json{{{');
  assertDeepEqual(getBackups(), []);
});

test('restoreBackup() replaces current data and migrates old-schema snapshots', function () {
  // Simulates a snapshot taken before steps/project-icons existed.
  localStorage.setItem(BACKUPS_KEY, JSON.stringify([
    { date: '2020-01-01', savedAt: 1, projects: [{ id: 'proj-inbox', name: 'Inbox', locked: true }],
      tasks: [{ id: 'old1', title: 'From an old snapshot', projectId: 'proj-inbox', subtasks: [{ id: 's1', text: 'legacy step' }] }] }
  ]));
  tasks = [{ id: 'current1', title: 'Current unsaved task', projectId: 'proj-inbox', status: 'todo', priority: 'medium', subtasks: [], tags: [] }];
  restoreBackup('2020-01-01');
  // restoreBackup opens a confirm modal rather than restoring immediately.
  assertTrue(!!modalTarget && typeof modalTarget.action === 'function', 'should stage the restore behind a confirmation');
  modalTarget.action();
  assertEqual(tasks[0].id, 'old1');
  assertEqual(tasks[0].priority, 'medium', 'old-schema task should get defaults backfilled');
  assertDeepEqual(tasks[0].subtasks[0].subtasks, [], 'legacy subtask should get its own subtasks array backfilled');
  assertEqual(projById('proj-inbox').icon, 'folder');
  assertTrue(!!globalThis.__lastBlob, 'current data should be backed up to a file before restoring');
});

test('restoreBackup() does nothing for a date with no matching snapshot', function () {
  localStorage.setItem(BACKUPS_KEY, JSON.stringify([]));
  const before = modalTarget;
  restoreBackup('1999-01-01');
  assertEqual(modalTarget, before, 'no confirm modal should be staged for a missing backup');
});
