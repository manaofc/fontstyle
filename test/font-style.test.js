'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { listStyles, resolveStyle, convert, convertAll } = require('../index');
const { handleFontCommand } = require('../whatsapp');

test('bold maps A to U+1D400 and digits to bold digits', () => {
  assert.equal(convert('A', 'bold'), '\u{1D400}');
  assert.equal(convert('0', 'bold'), '\u{1D7CE}');
});

test('script uses the letterlike-symbol holes (B is U+212C)', () => {
  assert.equal(convert('B', 'script'), '\u212C');
  assert.equal(convert('e', 'script'), '\u212F');
});

test('unstyled characters pass through unchanged', () => {
  assert.equal(convert('hi there!', 'bold'), '\u{1D421}\u{1D422} \u{1D42D}\u{1D421}\u{1D41E}\u{1D42B}\u{1D41E}!');
});

test('underline and strikethrough add combining marks to letters only', () => {
  assert.equal(convert('ab c', 'underline'), 'a\u0332b\u0332 c\u0332');
  assert.equal(convert('a!', 'strikethrough'), 'a\u0336!');
});

test('upside down reverses the text and flips lowercase letters', () => {
  assert.equal(convert('ab', 'upside-down'), 'q\u0250');
});

test('Sinhala text is left as it is', () => {
  assert.equal(convert('ආයුබෝවන්', 'bold'), 'ආයුබෝවන්');
});

test('listStyles numbers styles from 1 and every id converts', () => {
  const styles = listStyles();
  assert.equal(styles[0].index, 1);
  for (const s of styles) {
    assert.equal(typeof convert('Hello 123', s.id), 'string');
  }
  assert.equal(convertAll('Hi').length, styles.length);
});

test('resolveStyle accepts a number, an id, or a name', () => {
  assert.equal(resolveStyle('1').id, 'bold');
  assert.equal(resolveStyle('Bold Italic').id, 'bold-italic');
  assert.equal(resolveStyle('bold_italic').id, 'bold-italic');
  assert.equal(resolveStyle('0'), undefined);
  assert.equal(resolveStyle('nope'), undefined);
});

test('convert throws on an unknown style', () => {
  assert.throws(() => convert('x', 'nope'), /Unknown font style/);
});

test('handleFontCommand ignores messages that are not commands', () => {
  assert.equal(handleFontCommand('hello'), null);
  assert.equal(handleFontCommand('fontsy hello'), null);
  assert.equal(handleFontCommand(undefined), null);
});

test('.font <number> <text> returns the converted text', () => {
  assert.equal(handleFontCommand('.font 1 A'), '\u{1D400}');
  assert.equal(handleFontCommand('  .font bold A  '), '\u{1D400}');
});

test('.fonts <text> lists every style', () => {
  const reply = handleFontCommand('.fonts A');
  assert.match(reply, /^1️⃣ Bold\n/);
  assert.match(reply, /Upside Down/);
});

test('bad input gets a helpful reply instead of a crash', () => {
  assert.match(handleFontCommand('.font'), /Font commands/);
  assert.match(handleFontCommand('.font 3'), /Please send a style/);
  assert.match(handleFontCommand('.font nope hi'), /Unknown style "nope"/);
});

test('a custom prefix works', () => {
  assert.equal(handleFontCommand('!font 1 A', { prefix: '!' }), '\u{1D400}');
  assert.equal(handleFontCommand('.font 1 A', { prefix: '!' }), null);
});
