import readline from 'node:readline';

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

let spinnerInterval = null;
let currentFrame = 0;

/**
 * Starts a clean terminal thinking spinner.
 */
export function startThinkingSpinner(modelProfile) {
  stopThinkingSpinner();

  const stdout = process.stdout;
  const icon = modelProfile ? modelProfile.icon : '🧠';
  const name = modelProfile ? modelProfile.name : 'PotatoAI';

  // Only render animated spinner if TTY is supported
  const isTTY = stdout.isTTY;

  if (isTTY) {
    stdout.write('\x1b[?25l'); // Hide cursor
  }

  spinnerInterval = setInterval(() => {
    const frame = SPINNER_FRAMES[currentFrame];
    currentFrame = (currentFrame + 1) % SPINNER_FRAMES.length;

    if (isTTY) {
      stdout.write(`\r\x1b[K\x1b[36m${frame}\x1b[0m ${icon} \x1b[1mThinking...\x1b[0m \x1b[2m(${name})\x1b[0m`);
    }
  }, 80);

  if (!isTTY) {
    stdout.write(`${icon} Thinking... (${name})\n`);
  }
}

/**
 * Stops and clears the thinking spinner.
 */
export function stopThinkingSpinner() {
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
    spinnerInterval = null;
  }

  const stdout = process.stdout;
  if (stdout.isTTY) {
    stdout.write('\r\x1b[K\x1b[?25h'); // Clear spinner line & show cursor
  }
}
