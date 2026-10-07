const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '../css/ui.css'), 'utf8');
// The hardware row must reserve its full height; clipping hides real buttons.
assert.match(css, /\.cabinet-controls\s*\{\s*height:auto;\s*min-height:74px;\s*flex:none;/);
assert.match(css, /\.cabinet-controls\s*>\s*\.monitor-view-control\s*\{\s*height:66px;\s*grid-template-rows:14px 52px;/);
assert.match(css, /\.cabinet-controls\s+\.volume-scale\s*\{\s*width:64px;\s*height:64px;/);
assert.match(css,/\.workspace-editor\s*\{\s*flex:1;\s*min-height:144px;\s*flex-shrink:0;/);
console.log('Mobile hardware intrinsic height and dial containment checks passed');
