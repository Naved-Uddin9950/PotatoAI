import { yukonGoldModel } from './yukon-gold/model.js';
import { sweetPotatoModel } from './sweet-potato/model.js';
import { russetModel } from './russet/model.js';
import { promptModelSelection } from '../src/interactiveMenu.js';

export const MODELS = {
  'yukon-gold': yukonGoldModel,
  'sweet-potato': sweetPotatoModel,
  'russet': russetModel
};

export const MODEL_LIST = [
  yukonGoldModel,
  sweetPotatoModel,
  russetModel
];

/**
 * Gets a model profile by key or returns default (sweet-potato).
 */
export function getModelProfile(modelKey = 'sweet-potato') {
  const key = (modelKey || '').toLowerCase().trim();
  if (MODELS[key]) return MODELS[key];
  if (key === 'yukon' || key === 'yukongold' || key === 'gold' || key === 'fingerling' || key === 'fast') {
    return MODELS['yukon-gold'];
  }
  if (key === 'sweet' || key === 'sweetpotato') return MODELS['sweet-potato'];
  if (key === 'heavy' || key === 'deep') return MODELS['russet'];
  return MODELS['sweet-potato'];
}

/**
 * Renders static text menu for models.
 */
export function formatModelMenu(currentModelKey = 'sweet-potato') {
  let menu = `🥔 **PotatoAI Model Selection:**\n`;
  menu += `--------------------------------------------------------------------------------\n`;

  for (const profile of MODEL_LIST) {
    const isCurrent = profile.id === currentModelKey;
    const badge = isCurrent ? ` [ACTIVE]` : ``;
    menu += `${profile.icon} **${profile.name}** (\`/model ${profile.id}\`)${badge}\n`;
    menu += `   • *${profile.tagline}*\n`;
    menu += `   • ${profile.description}\n\n`;
  }

  menu += `--------------------------------------------------------------------------------\n`;
  menu += `💡 Usage: Use arrow keys in interactive menu, or type \`/model <yukon-gold | sweet-potato | russet>\`.`;
  return menu;
}

/**
 * Interactive Arrow-Key Model Selection Gateway
 */
export function selectModelInteractive(currentModelKey = 'sweet-potato', rl = null) {
  return new Promise((resolve) => {
    promptModelSelection(currentModelKey, (selectedModel) => {
      resolve(selectedModel);
    });
  });
}
