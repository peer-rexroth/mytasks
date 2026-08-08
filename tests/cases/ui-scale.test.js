// Text size segmented control (topbar text-height popover) — a 4-stop CSS
// zoom on <html> (Small/Medium/Large/Extra Large), picked from a
// .view-switch pill (the same segmented control the List/Board toggle
// already uses), persisted/synced the same way theme/compactMode/
// colorScheme already are.

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

test('a fresh session with nothing saved defaults to Medium', function () {
  assertEqual(uiScale, UI_SCALE_DEFAULT);
  assertEqual(UI_SCALE_STEPS[uiScaleStepIndex(uiScale)].label, 'Medium');
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

test('setUiScale closes the popover after picking a segment', function () {
  document.getElementById('uiScaleMenu').classList.add('open');
  setUiScale(90);
  assertFalse(document.getElementById('uiScaleMenu').classList.contains('open'));
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

// Pulls {label, active} out of each rendered segment button, in order —
// avoids brittle substring matching against exact attribute ordering.
function renderedUiScaleSegments(){
  const html = document.getElementById('uiScaleMenu').innerHTML;
  const re = /class="view-switch-btn( active)?"[^>]*>([^<]+)</g;
  const out = [];
  let m;
  while((m = re.exec(html))) out.push({ label: m[2], active: !!m[1] });
  return out;
}

test('renderUiScaleMenu builds a 4-segment view-switch pill with the current stop marked active', function () {
  setUiScale(115);
  renderUiScaleMenu();
  const segments = renderedUiScaleSegments();
  assertDeepEqual(segments.map(s => s.label), ['Small', 'Medium', 'Large', 'Extra Large']);
  assertEqual(segments.filter(s => s.active).length, 1, 'exactly one segment is marked active');
  assertEqual(segments.find(s => s.active).label, 'Large', 'Large (115%) is the active segment');
});

test('renderUiScaleMenu moves the active segment when the scale changes', function () {
  setUiScale(90);
  renderUiScaleMenu();
  assertEqual(renderedUiScaleSegments().find(s => s.active).label, 'Small');
  setUiScale(130);
  renderUiScaleMenu();
  assertEqual(renderedUiScaleSegments().find(s => s.active).label, 'Extra Large');
});
