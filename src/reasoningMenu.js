import readline from 'node:readline';
import { REASONING_MODES, getReasoningProfile } from './reasoning.js';

export const REASONING_LIST = [
  REASONING_MODES['low'],
  REASONING_MODES['medium'],
  REASONING_MODES['high'],
  REASONING_MODES['max']
];

/**
 * Interactive Arrow-Key Reasoning Effort Selection Interface
 */
export function promptReasoningSelection(currentLevelId = 'medium', onDone) {
  let selectedIndex = REASONING_LIST.findIndex(r => r.id === (currentLevelId || '').toLowerCase());
  if (selectedIndex === -1) selectedIndex = 1; // Default to Medium (index 1)

  const stdin = process.stdin;
  const stdout = process.stdout;

  // Try enabling raw mode directly
  let isRaw = false;
  try {
    if (typeof stdin.setRawMode === 'function') {
      stdin.setRawMode(true);
      isRaw = true;
    }
  } catch (err) {
    isRaw = false;
  }

  // Fallback for wrapped terminals / nodemon
  if (!isRaw) {
    let menu = `🥔 **PotatoAI Reasoning Effort Selection Menu:**\n`;
    menu += `--------------------------------------------------------------------------------\n`;

    REASONING_LIST.forEach((profile, i) => {
      const isCurrent = profile.id === (currentLevelId || '').toLowerCase();
      const activeStr = isCurrent ? ` \x1b[32m[ACTIVE]\x1b[0m` : '';
      menu += `   [${i + 1}] ${profile.icon} **${profile.name.padEnd(8)}** - *Max Steps: ${profile.maxSteps}*${activeStr}\n`;
      menu += `       ↳ ${profile.description}\n\n`;
    });

    menu += `--------------------------------------------------------------------------------\n`;
    menu += `💡 Type **1**, **2**, **3**, or **4** (or \`/effort high\`) to switch reasoning effort!`;

    return onDone({ isMenuFallback: true, text: menu });
  }

  stdin.resume();
  readline.emitKeypressEvents(stdin);

  const linesCount = REASONING_LIST.length + 3;

  function render(isFirst = false) {
    if (!isFirst) {
      stdout.write(`\x1b[${linesCount}A`);
    }

    stdout.write('\x1b[1m🥔 Select PotatoAI Reasoning Effort Level (Use ⬆️/⬇️ arrows or press 1-4, then ENTER):\x1b[0m\x1b[K\n');
    stdout.write('--------------------------------------------------------------------------------\x1b[K\n');

    REASONING_LIST.forEach((profile, i) => {
      const isSelected = i === selectedIndex;
      const isCurrent = profile.id === (currentLevelId || '').toLowerCase();
      const numStr = `[${i + 1}]`;

      const cursor = isSelected ? '\x1b[36m\x1b[1m ❯ 🔘 ' : '   ⚪ ';
      const name = isSelected 
        ? `\x1b[36m\x1b[1m${numStr} ${profile.icon} ${profile.name.padEnd(8)}\x1b[0m` 
        : `${numStr} ${profile.icon} ${profile.name.padEnd(8)}`;
      const tagline = `\x1b[2mMax Steps: ${profile.maxSteps}\x1b[0m`;
      const activeBadge = isCurrent ? ' \x1b[32m[ACTIVE]\x1b[0m' : '';

      stdout.write(`${cursor}${name} ${tagline}${activeBadge}\x1b[K\n`);
    });

    stdout.write('--------------------------------------------------------------------------------\x1b[K\n');
  }

  render(true);

  const startTime = Date.now();

  function keypressHandler(str, key) {
    // Ignore initial ENTER buffer from command submission (<100ms)
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
    } else if (str === '4') {
      selectedIndex = 3;
      render(false);
      return;
    }

    if (!key) return;

    if (key.name === 'up') {
      selectedIndex = (selectedIndex - 1 + REASONING_LIST.length) % REASONING_LIST.length;
      render(false);
    } else if (key.name === 'down') {
      selectedIndex = (selectedIndex + 1) % REASONING_LIST.length;
      render(false);
    } else if (key.name === 'return' || key.name === 'enter') {
      cleanup();
      const chosen = REASONING_LIST[selectedIndex];
      stdout.write(`\n\x1b[32m\x1b[1m✅ Selected Reasoning Effort: ${chosen.icon} ${chosen.name}\x1b[0m\n\n`);
      onDone(chosen);
    } else if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
      cleanup();
      stdout.write('\n\x1b[33mSelection cancelled.\x1b[0m\n\n');
      onDone(getReasoningProfile(currentLevelId));
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
