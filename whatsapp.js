'use strict';

/**
 * WhatsApp command handler for font-style.
 *
 *   .fonts <text>            show the text in every style, numbered
 *   .font <style> <text>     convert the text with one style
 *                            (style = number, id, or name)
 *
 * handleFontCommand() returns the reply text, or null when the
 * message is not a font command. Your bot decides how to send it.
 */

const { resolveStyle, convert, convertAll } = require('./index');

const DEFAULT_PREFIX = '.';

function helpText(prefix) {
  return [
    '*Font commands*',
    `${prefix}fonts <text> - show the text in all styles`,
    `${prefix}font <number|name> <text> - convert with one style`,
    '',
    `Example: ${prefix}font 3 hello`,
  ].join('\n');
}

const NUMBERS = ['0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];
function numbered(n) { return String(n).split('').map((d) => NUMBERS[Number(d)]).join(''); }

function formatList(text) {
  return convertAll(text)
    .map((s) => `${numbered(s.index)} ${s.name}\n${s.text}`)
    .join('\n\n');
}

/**
 * @param {string} message  the raw WhatsApp message text
 * @param {{ prefix?: string }} [options]
 * @returns {string|null}  reply text, or null if this is not a font command
 */
function handleFontCommand(message, { prefix = DEFAULT_PREFIX } = {}) {
  if (typeof message !== 'string') return null;

  const trimmed = message.trim();
  if (!trimmed.startsWith(prefix)) return null;

  const match = /^(fonts?)(?:\s+([\s\S]*))?$/i.exec(trimmed.slice(prefix.length));
  if (!match) return null;

  const isList = match[1].toLowerCase() === 'fonts';
  const args = (match[2] ?? '').trim();

  if (!args) return helpText(prefix);

  if (isList) return formatList(args);

  const pair = /^(\S+)\s+([\s\S]+)$/.exec(args);
  if (!pair) {
    return `Please send a style and some text.\nExample: ${prefix}font 3 hello`;
  }

  const style = resolveStyle(pair[1]);
  if (!style) {
    return `Unknown style "${pair[1]}". Send ${prefix}fonts to see the list.`;
  }

  return convert(pair[2], style.id);
}

module.exports = { handleFontCommand };
