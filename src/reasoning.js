/**
 * Reasoning Mode System (Low, Medium, High, Max)
 * -----------------------------------------------------------------------------
 * Configures reasoning depth and step budgets for PotatoAI models.
 */

export const REASONING_MODES = {
  'low': {
    id: 'low',
    name: 'Low',
    icon: '🚀',
    maxSteps: 4,
    directive: 'Keep reasoning concise and execute actions directly with minimal steps.',
    description: 'Fast, brief chain of thought for quick edits and single-step tasks.'
  },
  'medium': {
    id: 'medium',
    name: 'Medium',
    icon: '⚖️',
    maxSteps: 8,
    directive: 'Provide standard balanced reasoning, evaluate tool outcomes, and verify results.',
    description: 'Balanced reasoning with standard step budget and verification (Default).'
  },
  'high': {
    id: 'high',
    name: 'High',
    icon: '🔬',
    maxSteps: 15,
    directive: 'Think deeply before acting. Thoroughly inspect workspace state, anticipate edge cases, and self-correct on any execution errors.',
    description: 'Thorough reasoning with multi-pass analysis, edge case checks, and self-correction.'
  },
  'max': {
    id: 'max',
    name: 'Max',
    icon: '🧠',
    maxSteps: 25,
    directive: 'Exhaustively analyze task requirements, generate robust code implementations, run terminal verification commands, inspect stdout/stderr logs, and iteratively repair until 100% verified.',
    description: 'Exhaustive benchmark reasoning with maximum step budget, automated testing, and full self-repair.'
  }
};

/**
 * Gets a reasoning profile by level name.
 */
export function getReasoningProfile(level = 'medium') {
  const key = (level || '').toLowerCase().trim();
  if (REASONING_MODES[key]) return REASONING_MODES[key];
  if (key === 'l' || key === 'fast') return REASONING_MODES['low'];
  if (key === 'm' || key === 'std' || key === 'standard') return REASONING_MODES['medium'];
  if (key === 'h' || key === 'deep') return REASONING_MODES['high'];
  if (key === 'm' || key === 'maximum' || key === 'full') return REASONING_MODES['max'];
  return REASONING_MODES['medium'];
}

/**
 * Formats reasoning mode selection menu.
 */
export function formatReasoningMenu(currentLevel = 'medium') {
  let menu = `🥔 **PotatoAI Reasoning Modes:**\n`;
  menu += `--------------------------------------------------------------------------------\n`;

  for (const [key, profile] of Object.entries(REASONING_MODES)) {
    const isCurrent = profile.id === (currentLevel || '').toLowerCase();
    const badge = isCurrent ? ` [ACTIVE]` : ``;
    menu += `${profile.icon} **${profile.name}** (\`/reasoning ${profile.id}\`)${badge}\n`;
    menu += `   • *Max Steps: ${profile.maxSteps}*\n`;
    menu += `   • ${profile.description}\n\n`;
  }

  menu += `--------------------------------------------------------------------------------\n`;
  menu += `💡 Usage: \`/reasoning <low | medium | high | max>\` (or \`/think <level>\`).`;
  return menu;
}
