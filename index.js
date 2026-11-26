'use strict';

/**
 * font-style
 *
 * Converts plain text into Unicode "fancy" font styles (bold, script,
 * fraktur, circled, ...). The output is ordinary Unicode text, so it
 * works anywhere text is accepted: WhatsApp, Telegram, bios, etc.
 *
 * Only English letters and digits are styled. Other scripts
 * (Sinhala, Tamil, ...) are passed through unchanged.
 */

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';

/**
 * Style definitions.
 *  upper / lower : first code point of a contiguous A-Z / a-z block,
 *                  or a 26-character string when the block is not contiguous
 *  digits        : first code point of a 0-9 block, or a 10-character string
 *  overrides     : characters that use a different code point
 *  reverse       : write the text backwards (upside down)
 *  combining     : a combining mark added after each letter or digit
 */
const STYLE_DEFS = [
  { id: 'bold', name: 'Bold', upper: 0x1d400, lower: 0x1d41a, digits: 0x1d7ce },
  { id: 'italic', name: 'Italic', upper: 0x1d434, lower: 0x1d44e, overrides: { h: '\u210E' } },
  { id: 'bold-italic', name: 'Bold Italic', upper: 0x1d468, lower: 0x1d482 },
  {
    id: 'script',
    name: 'Script',
    upper: 0x1d49c,
    lower: 0x1d4b6,
    overrides: {
      B: '\u212C', E: '\u2130', F: '\u2131', H: '\u210B', I: '\u2110',
      L: '\u2112', M: '\u2133', R: '\u211B', e: '\u212F', g: '\u210A', o: '\u2134',
    },
  },
  { id: 'bold-script', name: 'Bold Script', upper: 0x1d4d0, lower: 0x1d4ea },
  {
    id: 'fraktur',
    name: 'Fraktur',
    upper: 0x1d504,
    lower: 0x1d51e,
    overrides: { C: '\u212D', H: '\u210C', I: '\u2111', R: '\u211C', Z: '\u2128' },
  },
  { id: 'bold-fraktur', name: 'Bold Fraktur', upper: 0x1d56c, lower: 0x1d586 },
  {
    id: 'double-struck',
    name: 'Double-struck',
    upper: 0x1d538,
    lower: 0x1d552,
    digits: 0x1d7d8,
    overrides: {
      C: '\u2102', H: '\u210D', N: '\u2115', P: '\u2119', Q: '\u211A', R: '\u211D', Z: '\u2124',
    },
  },
  { id: 'sans', name: 'Sans', upper: 0x1d5a0, lower: 0x1d5ba, digits: 0x1d7e2 },
  { id: 'sans-bold', name: 'Sans Bold', upper: 0x1d5d4, lower: 0x1d5ee, digits: 0x1d7ec },
  { id: 'sans-italic', name: 'Sans Italic', upper: 0x1d608, lower: 0x1d622 },
  { id: 'sans-bold-italic', name: 'Sans Bold Italic', upper: 0x1d63c, lower: 0x1d656 },
  { id: 'monospace', name: 'Monospace', upper: 0x1d670, lower: 0x1d68a, digits: 0x1d7f6 },
  {
    id: 'fullwidth',
    name: 'Fullwidth',
    upper: 0xff21,
    lower: 0xff41,
    digits: 0xff10,
    overrides: { ' ': '\u3000' },
  },
  { id: 'circled', name: 'Circled', upper: 0x24b6, lower: 0x24d0, digits: '⓪①②③④⑤⑥⑦⑧⑨' },
  { id: 'circled-negative', name: 'Circled Negative', upper: 0x1f150, lower: 0x1f150, digits: '⓿❶❷❸❹❺❻❼❽❾' },
  { id: 'squared', name: 'Squared', upper: 0x1f130, lower: 0x1f130 },
  { id: 'squared-negative', name: 'Squared Negative', upper: 0x1f170, lower: 0x1f170 },
  {
    id: 'small-caps',
    name: 'Small Caps',
    lower: 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ',
  },
  {
    id: 'upside-down',
    name: 'Upside Down',
    reverse: true,
    lower: 'ɐqɔpǝɟƃɥᴉɾʞlɯuodbɹsʇnʌʍxʎz',
  },
  { id: 'strikethrough', name: 'Strikethrough', combining: '\u0336' },
  { id: 'underline', name: 'Underline', combining: '\u0332' },
  { id: 'slashed', name: 'Slashed', combining: '\u0338' },
  { id: 'black-square', name: 'black-square', custom: "🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉" },
  { id: 'black-bubble', name: 'black-bubble', custom: "🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩" },
  { id: 'typewriter', name: 'typewriter', custom: "𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉" },
  { id: 'currency', name: 'currency', custom: "₳฿₵ĐɆ₣₲ⱧłJ₭Ⱡ₥₦Ø₱QⱤ₴₮ɄV₩ӾɎⱫ" },
  { id: 'double-struck-alt', name: 'double-struck-alt', custom: "𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ" },
  { id: 'antrophobia', name: 'antrophobia', custom: "αв¢∂єfgнιנкℓмиσρqяѕтυνωχуz" },
  { id: 'bubble', name: 'bubble', custom: "ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ" },
  { id: 'flaky', name: 'flaky', custom: "ᗩᗷᑕᗪᗴᖴǤᕼIᑎᛕᒪᗰᑎᗝᑭɊᖇᔕ丅ᑌᐯᗯ᙭Ƴ乙" },
  { id: 'manga', name: 'manga', custom: "卂乃匚ᗪ乇千Ꮆ卄丨ﾌҜㄥ爪几ㄖ卩Ҩ尺丂ㄒㄩᐯ山乂ㄚ乙" },
  { id: 'rusify', name: 'rusify', custom: "АБCДЄFGHЇJКГѪЙѲPФЯ$TЦѴШЖЧЗ" },
  { id: 'high-above', name: 'high-above', custom: "ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖᵠʳˢᵗᵘᵛʷˣʸᶻ" },
  { id: 'square', name: 'square', custom: "🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉" },
  { id: 'tiny-caps-alt', name: 'tiny-caps-alt', custom: "ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘϙʀᴤᴛᴜᴠᴡxʏᴢ" },
  { id: 'fancy-style-27', name: 'fancy-style-27', custom: "ᴬᴮᶜᴰᴱᶠᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾᵟᴿˢᵀᵁᵛᵂˣᵞᶻ" },
  { id: 'slash', name: 'slash', custom: "A̷B̷C̷D̷E̷F̷G̷H̷I̷J̷K̷L̷M̷N̷O̷P̷Q̷R̷S̷T̷U̷V̷W̷X̷Y̷Z̷" },
  { id: 'lightning', name: 'lightning', custom: "A͛B͛C͛D͛E͛F͛G͛H͛I͛J͛K͛L͛M͛N͛O͛P͛Q͛R͛S͛T͛U͛V͛W͛X͛Y͛Z͛" },
  { id: 'invisible-ink', name: 'invisible-ink', custom: "A҉B҉C҉D҉E҉F҉G҉H҉I҉J҉K҉L҉M҉N҉O҉P҉Q҉R҉S҉T҉U҉V҉W҉X҉Y҉Z҉" },
 ];

// Extend the collection to 100 styles using additional Unicode combining decorations.
// These are genuine text transformations (not image/font files).
const EXTRA_MARKS = ['\u0300','\u0301','\u0302','\u0303','\u0304','\u0305','\u0306','\u0307','\u0308','\u0309','\u030A','\u030B','\u030C','\u030D','\u030E','\u030F','\u0310','\u0311','\u0312','\u0313','\u0314','\u0315','\u0316','\u0317','\u0318','\u0319','\u031A','\u031B','\u031C','\u031D','\u031E','\u031F','\u0320','\u0321','\u0322','\u0323','\u0324','\u0325','\u0326','\u0327','\u0328','\u0329','\u032A','\u032B','\u032C','\u032D','\u032E','\u032F','\u0330','\u0331','\u0333','\u0334','\u0335','\u0337','\u0339','\u033A','\u033B','\u033C','\u033D','\u033E','\u033F','\u0340','\u0341','\u0342','\u0343','\u0344'];
for (let i = 0; STYLE_DEFS.length < 100; i++) {
  STYLE_DEFS.push({ id: `decorated-${STYLE_DEFS.length + 1}`, name: `Decorated ${STYLE_DEFS.length + 1}`, combining: EXTRA_MARKS[i] });
}

/** Turns a code point block or a literal string into an array of characters. */
function charsFrom(spec, count, label) {
  if (typeof spec === 'number') {
    return Array.from({ length: count }, (_, i) => String.fromCodePoint(spec + i));
  }
  const chars = Array.from(spec);
  if (chars.length !== count) {
    throw new Error(`${label}: expected ${count} characters, got ${chars.length}`);
  }
  return chars;
}

function buildMap(def) {
  const map = new Map();
  if (def.upper !== undefined) {
    charsFrom(def.upper, 26, `${def.id} upper`).forEach((c, i) => map.set(UPPER[i], c));
  }
  if (def.lower !== undefined) {
    charsFrom(def.lower, 26, `${def.id} lower`).forEach((c, i) => map.set(LOWER[i], c));
  }
  if (def.digits !== undefined) {
    charsFrom(def.digits, 10, `${def.id} digits`).forEach((c, i) => map.set(DIGITS[i], c));
  }
  if (def.custom !== undefined) {
    const glyphs = Array.from(def.custom);
    for (let i = 0; i < Math.min(26, glyphs.length); i++) { map.set(UPPER[i], glyphs[i]); map.set(LOWER[i], glyphs[i]); }
  }
  for (const [ch, out] of Object.entries(def.overrides ?? {})) {
    map.set(ch, out);
  }
  return map;
}

const STYLES = STYLE_DEFS.map((def, i) => ({
  index: i + 1,
  id: def.id,
  name: def.name,
  reverse: Boolean(def.reverse),
  combining: def.combining ?? null,
  map: buildMap(def),
}));

const BY_ID = new Map(STYLES.map((s) => [s.id, s]));

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

function splitGraphemes(text) {
  return Array.from(segmenter.segment(text), (s) => s.segment);
}

/** Returns [{ index, id, name }] for every available style, numbered from 1. */
function listStyles() {
  return STYLES.map(({ index, id, name }) => ({ index, id, name }));
}

/**
 * Finds a style by number ("3"), id ("sans-bold"), or name ("Sans Bold").
 * Returns { index, id, name } or undefined.
 */
function resolveStyle(input) {
  if (input === undefined || input === null) return undefined;
  const key = String(input).trim().toLowerCase();
  if (key === '') return undefined;

  let style;
  if (/^\d+$/.test(key)) {
    style = STYLES[Number(key) - 1];
  } else {
    const squash = (s) => s.replace(/[\s_-]/g, '');
    style = STYLES.find(
      (s) => s.id === key || squash(s.id) === squash(key) || squash(s.name.toLowerCase()) === squash(key),
    );
  }
  return style ? { index: style.index, id: style.id, name: style.name } : undefined;
}

/**
 * Converts text into the given style.
 * @param {string} text
 * @param {string} styleId  an id from listStyles(), e.g. "bold"
 * @returns {string}
 */
function convert(text, styleId) {
  const style = BY_ID.get(styleId);
  if (!style) {
    throw new Error(`Unknown font style: "${styleId}"`);
  }

  let parts = splitGraphemes(String(text ?? ''));
  if (style.reverse) parts = parts.reverse();

  return parts
    .map((g) => {
      const out = style.map.get(g) ?? g;
      return style.combining && /[\p{L}\p{N}]/u.test(g) ? out + style.combining : out;
    })
    .join('');
}

/** Converts text into every style. Returns [{ index, id, name, text }]. */
function convertAll(text) {
  return STYLES.map((s) => ({
    index: s.index,
    id: s.id,
    name: s.name,
    text: convert(text, s.id),
  }));
}

module.exports = { listStyles, resolveStyle, convert, convertAll };
