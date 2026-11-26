#!/usr/bin/env node
'use strict';

const { listStyles, resolveStyle, convert, convertAll } = require('../index');

const USAGE = `Usage:
  font-style <text>             show the text in every style
  font-style <style> <text>     convert with one style (number or name)
  font-style --list             list the styles

Examples:
  font-style hello
  font-style 3 hello
  font-style "sans bold" hello`;

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '-h' || args[0] === '--help') {
  console.log(USAGE);
  process.exit(0);
}

if (args[0] === '--list') {
  for (const s of listStyles()) console.log(`${s.index}. ${s.id}`);
  process.exit(0);
}

const style = args.length >= 2 ? resolveStyle(args[0]) : undefined;

if (style) {
  console.log(convert(args.slice(1).join(' '), style.id));
} else {
  const text = args.join(' ');
  const NUMBERS = ['0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];
  const numbered = (n) => String(n).split('').map((d) => NUMBERS[Number(d)]).join('');
  for (const s of convertAll(text)) {
    console.log(`${numbered(s.index)} ${s.name}: ${s.text}`);
  }
}
