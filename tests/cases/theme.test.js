// Color scheme picker (Standard/Editor) — persistence and cross-device
// sync via the same theme/compactMode/viewMode plumbing.

test('setColorScheme updates state, the data-scheme attribute, and localStorage', function () {
  setColorScheme('editor');
  assertEqual(colorScheme, 'editor');
  assertEqual(document.documentElement.getAttribute('data-scheme'), 'editor');
  assertEqual(localStorage.getItem('mytasks_scheme'), 'editor');
});

test('load() picks up a colorScheme saved in the data blob, same as theme', function () {
  localStorage.setItem('mytasks_data_v1', JSON.stringify({
    projects: defaultProjects(), tasks: defaultTasks(), colorScheme: 'editor'
  }));
  load();
  assertEqual(colorScheme, 'editor');
  assertEqual(document.documentElement.getAttribute('data-scheme'), 'editor');
});

test('load() ignores an unrecognized colorScheme rather than crashing', function () {
  colorScheme = 'editor';
  localStorage.setItem('mytasks_data_v1', JSON.stringify({
    projects: defaultProjects(), tasks: defaultTasks(), colorScheme: 'not-a-real-scheme'
  }));
  load();
  assertEqual(colorScheme, 'editor', 'an invalid saved scheme should leave the current one alone');
});

test('save() round-trips colorScheme into the stored data blob', function () {
  setColorScheme('editor');
  const saved = JSON.parse(localStorage.getItem('mytasks_data_v1'));
  assertEqual(saved.colorScheme, 'editor');
});

test('every THEME_SCHEMES entry actually has a matching CSS block', function () {
  // A cheap guard against typos: the scheme ids the picker offers should
  // all be spelled the same way the retheme's [data-scheme="..."] selectors expect.
  const ids = THEME_SCHEMES.map(s => s.id).sort();
  assertDeepEqual(ids, ['dracula', 'editor', 'github', 'monokai', 'standard', 'vsdark']);
});
