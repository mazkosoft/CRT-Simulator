const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../js/controls.js'), 'utf8');
const helper = source.match(/function snapParameterToInteger\([^)]*\) \{[\s\S]*?\n\}/);
assert.ok(helper, 'Integer snapping helper must exist');
const context = vm.createContext({});
vm.runInContext(helper[0], context);
for (const [value, min, max, step, expected] of [
  [5.93,1,48,0.1,6], [6.1,1,48,0.1,6], [6.3,1,48,0.1,6.3],
  [0.94,0,1,0.01,0.94], [0.06,0,0.8,0.01,0.06],
  [1.06,0.3,3,0.01,1], [1.06,0.3,3,0.2,1.06],
  [0.05,0.3,3,0.01,0.05], [2.97,0.001,60,'any',3]
]) assert.equal(context.snapParameterToInteger(value,min,max,step), expected);
assert.ok(source.includes('event.isTrusted && draggedParameter === control'), 'Only pointer dragging applies magnetic snapping');
const css = fs.readFileSync(path.join(__dirname, '../css/ui.css'), 'utf8');
assert.ok(!/@media\(min-width:901px\)\s*\{\s*\.parameter-stepper\s*\{\s*display:none/.test(css), 'Numeric input must be visible on desktop');
console.log('Integer attraction, fractional ranges and desktop numeric inputs passed');
