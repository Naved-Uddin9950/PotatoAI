import readline from 'node:readline';
import { MODEL_LIST, getModelProfile } from '../models/index.js';

export function promptModelSelection(currentModelId, onDone) {
  let selectedIndex = MODEL_LIST.findIndex(m => m.id === currentModelId);
  if (selectedIndex === -1) selectedIndex = 1;

  const stdin = process.stdin;
  const stdout = process.stdout;

  // Try enabling raw mode
  let isRaw = false;
  try {
    if (typeof stdin.setRawMode === 'function') {
      stdin.setRawMode(true);
      isRaw = true;
    }
  } catch (err) {
    isRaw = false;
  }

  // If raw mode fails (e.g. under nodemon or piped stdin), render numbered menu fallback
  if (!isRaw) {
    let menu = `🥔 **PotatoAI Model Selection Menu:**\n`;
    menu += `--------------------------------------------------------------------------------\n`;

    MODEL_LIST.forEach((model, i) => {
      const isCurrent = model.id === currentModelId;
      const activeStr = isCurrent ? ` \x1b[32m[ACTIVE]\x1b[0m` : '';
      menu += `   [${i + 1}] ${model.icon} **${model.name.padEnd(14)}** - *${model.tagline}*${activeStr}\n`;
      menu += `       ↳ ${model.description}\n\n`;
    });

    menu += `--------------------------------------------------------------------------------\n`;
    menu += `💡 Type **1**, **2**, or **3** (or \`/model yukon-gold\`) to switch active model tier.`;

    return onDone({ isMenuFallback: true, text: menu });
  }

  // Interactive Arrow-Key Raw Mode Selection
  stdin.resume();
  readline.emitKeypressEvents(stdin);

  const linesCount = MODEL_LIST.length + 3;

  function render(isFirst = false) {
    if (!isFirst) {
      stdout.write(`\x1b[${linesCount}A`);
    }

    stdout.write('\x1b[1m🥔 Select PotatoAI Model Tier (Use ⬆️/⬇️ arrows or press 1-3, then ENTER):\x1b[0m\x1b[K\n');
    stdout.write('--------------------------------------------------------------------------------\x1b[K\n');

    MODEL_LIST.forEach((model, i) => {
      const isSelected = i === selectedIndex;
      const isCurrent = model.id === currentModelId;
      const numStr = `[${i + 1}]`;

      const cursor = isSelected ? '\x1b[36m\x1b[1m ❯ 🔘 ' : '   ⚪ ';
      const name = isSelected 
        ? `\x1b[36m\x1b[1m${numStr} ${model.icon} ${model.name.padEnd(14)}\x1b[0m` 
        : `${numStr} ${model.icon} ${model.name.padEnd(14)}`;
      const tagline = `\x1b[2m${model.tagline}\x1b[0m`;
      const activeBadge = isCurrent ? ' \x1b[32m[ACTIVE]\x1b[0m' : '';

      stdout.write(`${cursor}${name} ${tagline}${activeBadge}\x1b[K\n`);
    });

    stdout.write('--------------------------------------------------------------------------------\x1b[K\n');
  }

  render(true);

  const startTime = Date.now();

  function keypressHandler(str, key) {
    if (key && (key.name === 'return' || key.name === 'enter') && (Date.now() - startTime < 100)) {
      return;
    }

    if (str === '1') {
      selectedIndex = 0;
      render(false);
      return;
    } else if (str === '2') {
      selectedIndex = 1;
      render(false);
      return;
    } else if (str === '3') {
      selectedIndex = 2;
      render(false);
      return;
    }

    if (!key) return;

    if (key.name === 'up') {
      selectedIndex = (selectedIndex - 1 + MODEL_LIST.length) % MODEL_LIST.length;
      render(false);
    } else if (key.name === 'down') {
      selectedIndex = (selectedIndex + 1) % MODEL_LIST.length;
      render(false);
    } else if (key.name === 'return' || key.name === 'enter') {
      cleanup();
      const chosen = MODEL_LIST[selectedIndex];
      stdout.write(`\n\x1b[32m\x1b[1m✅ Selected Model: ${chosen.icon} ${chosen.name}\x1b[0m\n\n`);
      onDone(chosen);
    } else if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
      cleanup();
      stdout.write('\n\x1b[33mSelection cancelled.\x1b[0m\n\n');
      onDone(getModelProfile(currentModelId));
    }
  }

  function cleanup() {
    stdin.removeListener('keypress', keypressHandler);
    try {
      stdin.setRawMode(false);
    } catch (e) {}
  }

  stdin.on('keypress', keypressHandler);
}
