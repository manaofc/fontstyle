# fontstyle

Convert text into Unicode font styles: bold, italic, script, fraktur,
double-struck, monospace, circled, small caps, upside down, strikethrough and more.

The output is normal Unicode text, so it works in WhatsApp, Telegram,
Instagram bios and anywhere else text is accepted.

Only English letters and digits are styled. Sinhala, Tamil and other scripts
are left as they are.

## Install

```bash
npm install fontstyle
```

Requires Node.js 20 or newer.

## Use from JavaScript

```js
const { listStyles, convert, convertAll } = require('fontstyle');

convert('hello', 'bold');        // 𝐡𝐞𝐥𝐥𝐨
convert('hello', 'script');      // 𝒽ℯ𝓁𝓁ℴ
listStyles();                    // [{ index: 1, id: 'bold', name: 'Bold' }, ...]
convertAll('hello');             // every style, with its index and name
```

## Use from the command line

```bash
npx fontstyle hello             # show every style
npx fontstyle 3 hello           # one style by number
npx fontstyle "sans bold" hello # one style by name
npx fontstyle --list            # list the styles
```

## WhatsApp bot commands

`require('fontstyle/whatsapp')` gives you one function. It returns the reply
text, or `null` if the message is not a font command.

| Command | What it does |
| --- | --- |
| `.fonts <text>` | Shows the text in every style, numbered. The user picks one. |
| `.font <number or name> <text>` | Converts the text with that style. |

Example: `.font 15 manaofc` returns the circled version of the text.

Example with Baileys:

```js
const { handleFontCommand } = require('fontstyle/whatsapp');

sock.ev.on('messages.upsert', async ({ messages }) => {
  const msg = messages[0];
  if (!msg?.message || msg.key.fromMe) return;

  const text = msg.message.conversation ?? msg.message.extendedTextMessage?.text;
  const reply = handleFontCommand(text);
  if (reply) {
    await sock.sendMessage(msg.key.remoteJid, { text: reply }, { quoted: msg });
  }
});
```

Pass `{ prefix: '!' }` as the second argument to `handleFontCommand` to use a
different command prefix.

## Tests

```bash
npm test
```

## License

MIT
