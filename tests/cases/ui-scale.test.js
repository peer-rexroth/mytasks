// Text size slider (topbar text-height popover) — a 4-stop CSS zoom on
// <html> (Small/Medium/Large/Extra Large — the same 4 sizes the original
// button-based picker offered), persisted/synced the same way theme/
// compactMode/colorScheme already are.

test('UI_SCALE_STEPS has exactly the 4 original named sizes, in order', function () {
  assertDeepEqual(UI_SCALE_STEPS.map(s => s.label), ['Small', 'Medium', 'Large', 'Extra Large']);
  assertDeepEqual(UI_SCALE_STEPS.map(s => s.pct), [90, 100, 115, 130]);
});

test('uiScaleStepIndex finds the exact stop, and snaps an in-between value to the nearest one', function () {
  assertEqual(uiScaleStepIndex(100), 1);
  assertEqual(uiScaleStepIndex(130), 3);
  assertEqual(uiScaleStepIndex(103), 1, 'closer to Medium (100) than Large (115)');
  assertEqual(uiScaleStepIndex(999), 3, 'clamps to the last stop for anything past it');
});

test('clampUiScale snaps any value to one of the 4 real stops', function () {
  assertEqual(clampUiScale(103), 100);
  assertEqual(clampUiScale(999), 130);
  assertEqual(clampUiScale('not-a-number'), UI_SCALE_DEFAULT, 'falls back to the default on garbage input');
});

test('uiScaleLabelFor names the stop a pct value snaps to', function () {
  assertEqual(uiScaleLabelFor(90), 'Small');
  assertEqual(uiScaleLabelFor(130), 'Extra Large');
});

test('setUiScale updates state, applies the zoom style, and localStorage', function () {
  setUiScale(115);
  assertEqual(uiScale, 115);
  assertEqual(document.documentElement.style.zoom, 1.15);
  assertEqual(localStorage.getItem('mytasks_uiscale'), '115');
});

test('setUiScale snaps an off-stop value to the nearest real one before storing it', function () {
  setUiScale(999);
  assertEqual(uiScale, 130);
  setUiScale(103);
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
  uiScale = 115;
  localStorage.setItem('mytasks_data_v1', JSON.stringify({
    projects: defaultProjects(), tasks: defaultTasks(), uiScale: 'huge'
  }));
  load();
  assertEqual(uiScale, 115, 'an invalid saved scale should leave the current one alone');
});

test('save() round-trips uiScale into the stored data blob', function () {
  setUiScale(90);
  const saved = JSON.parse(localStorage.getItem('mytasks_data_v1'));
  assertEqual(saved.uiScale, 90);
});

test('previewUiScale applies the zoom and updates the label without persisting', function () {
  setUiScale(100);
  renderUiScaleMenu();
  previewUiScale(130);
  assertEqual(document.documentElement.style.zoom, 1.3, 'zoom applies immediately for live feedback');
  assertEqual(uiScale, 100, 'state is not committed until setUiScale (the slider\'s change event) runs');
  assertEqual(localStorage.getItem('mytasks_uiscale'), '100', 'localStorage is not touched by a mid-drag preview');
  assertEqual(document.getElementById('uiScaleValueLabel').textContent, 'Extra Large');
});

test('renderUiScaleMenu builds a 4-stop slider (0-3) positioned at the current step, plus tick labels', function () {
  setUiScale(115);
  renderUiScaleMenu();
  const html = document.getElementById('uiScaleMenu').innerHTML;
  assertIncludes(html, 'min="0"');
  assertIncludes(html, `max="${UI_SCALE_STEPS.length - 1}"`);
  assertIncludes(html, 'step="1"');
  assertIncludes(html, 'value="2"', 'Large is index 2');
  assertIncludes(html, 'Large');
  assertIncludes(html, 'Small');
  assertIncludes(html, 'Extra Large');
});
