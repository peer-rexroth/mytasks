// UI size slider (topbar magnifying-glass popover) — a continuous CSS zoom
// on <html> (80%-150%, 5% steps), persisted/synced the same way theme/
// compactMode/colorScheme already are.

test('clampUiScale rounds to the nearest step and clamps to [MIN,MAX]', function () {
  assertEqual(clampUiScale(103), 105, 'rounds to the nearest 5% step');
  assertEqual(clampUiScale(50), UI_SCALE_MIN, 'clamps below the minimum');
  assertEqual(clampUiScale(999), UI_SCALE_MAX, 'clamps above the maximum');
  assertEqual(clampUiScale('not-a-number'), UI_SCALE_DEFAULT, 'falls back to the default on garbage input');
});

test('setUiScale updates state, applies the zoom style, and localStorage', function () {
  setUiScale(120);
  assertEqual(uiScale, 120);
  assertEqual(document.documentElement.style.zoom, 1.2);
  assertEqual(localStorage.getItem('mytasks_uiscale'), '120');
});

test('setUiScale clamps an out-of-range or off-step value before storing it', function () {
  setUiScale(999);
  assertEqual(uiScale, UI_SCALE_MAX);
  setUiScale(101);
  assertEqual(uiScale, 100);
});

test('load() picks up a uiScale saved in the data blob, same as colorScheme', function () {
  localStorage.setItem('mytasks_data_v1', JSON.stringify({
    projects: defaultProjects(), tasks: defaultTasks(), uiScale: 130
  }));
  load();
  assertEqual(uiScale, 130);
  assertEqual(document.documentElement.style.zoom, 1.3);
});

test('load() ignores a non-numeric uiScale rather than crashing', function () {
  uiScale = 120;
  localStorage.setItem('mytasks_data_v1', JSON.stringify({
    projects: defaultProjects(), tasks: defaultTasks(), uiScale: 'huge'
  }));
  load();
  assertEqual(uiScale, 120, 'an invalid saved scale should leave the current one alone');
});

test('save() round-trips uiScale into the stored data blob', function () {
  setUiScale(85);
  const saved = JSON.parse(localStorage.getItem('mytasks_data_v1'));
  assertEqual(saved.uiScale, 85);
});

test('previewUiScale applies the zoom and updates the label without persisting', function () {
  setUiScale(100);
  renderUiScaleMenu();
  previewUiScale(140);
  assertEqual(document.documentElement.style.zoom, 1.4, 'zoom applies immediately for live feedback');
  assertEqual(uiScale, 100, 'state is not committed until setUiScale (the slider\'s change event) runs');
  assertEqual(localStorage.getItem('mytasks_uiscale'), '100', 'localStorage is not touched by a mid-drag preview');
  assertEqual(document.getElementById('uiScaleValueLabel').textContent, '140%');
});

test('renderUiScaleMenu builds a slider matching the current value and bounds', function () {
  setUiScale(115);
  renderUiScaleMenu();
  const html = document.getElementById('uiScaleMenu').innerHTML;
  assertIncludes(html, `min="${UI_SCALE_MIN}"`);
  assertIncludes(html, `max="${UI_SCALE_MAX}"`);
  assertIncludes(html, `step="${UI_SCALE_STEP}"`);
  assertIncludes(html, 'value="115"');
  assertIncludes(html, '115%');
});
