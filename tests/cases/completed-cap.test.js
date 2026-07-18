// capCompleted() — "Cap completed tasks shown to 3, with an expand toggle"
// and "Always show the most recently completed tasks, not just
// first-in-sort".

function makeDone(id, completedAt) {
  return { id, title: id, projectId: 'proj-inbox', status: 'done', priority: 'medium', subtasks: [], tags: [], completedAt };
}
function makeOpen(id) {
  return { id, title: id, projectId: 'proj-inbox', status: 'todo', priority: 'medium', subtasks: [], tags: [] };
}

test('capCompleted shows all completed tasks when at or under the cap', function () {
  const list = [makeOpen('o1'), makeDone('d1', 10), makeDone('d2', 20)];
  const result = capCompleted(list, false);
  assertEqual(result.hiddenCount, 0);
  assertEqual(result.tasks.filter(t => t.status === 'done').length, 2);
});

test('capCompleted hides everything past the cap and reports how many', function () {
  const list = [makeOpen('o1'), makeDone('d1', 10), makeDone('d2', 20), makeDone('d3', 30), makeDone('d4', 40), makeDone('d5', 50)];
  const result = capCompleted(list, false);
  assertEqual(result.doneTotal, 5);
  assertEqual(result.hiddenCount, 2);
  assertEqual(result.tasks.filter(t => t.status === 'done').length, 3);
});

test('capCompleted keeps the MOST RECENTLY completed, not the first N in sort order', function () {
  // Sort order here is oldest-completed-first, deliberately the opposite
  // of what should be kept, to catch a regression to "first-in-sort".
  const list = [makeOpen('o1'), makeDone('oldest', 1), makeDone('mid', 2), makeDone('newer', 3), makeDone('newest', 4)];
  const result = capCompleted(list, false);
  const keptIds = result.tasks.filter(t => t.status === 'done').map(t => t.id).sort();
  assertDeepEqual(keptIds, ['mid', 'newer', 'newest']);
});

test('expanded=true shows every completed task regardless of the cap', function () {
  const list = [makeDone('d1', 1), makeDone('d2', 2), makeDone('d3', 3), makeDone('d4', 4)];
  const result = capCompleted(list, true);
  assertEqual(result.hiddenCount, 0);
  assertEqual(result.tasks.length, 4);
});
