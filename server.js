/**
 * 🥔 PotatoAI: Autonomous Agentic AI Coding Assistant
 * -----------------------------------------------------------------------------
 * Fully keyless, autonomous coding agent running locally with ZERO dependencies:
 * 1. Model Selection (/model): Yukon Gold (Fast), Sweet Potato (Versatile), Russet (Heavy).
 * 2. Reasoning Effort Selection (/effort, /reasoning, /think): Low, Medium, High, Max (Interactive & Numeric).
 * 3. Animated Thinking Indicator: Clean "🧠 Thinking..." spinner while processing answers.
 * 4. Interactive Slash Recommendations (/): List all commands on typing '/'.
 * 5. Clean Chat Experience: Clean output by default (toggle step trace logs via /verbose).
 * 6. File Workspace Suite: Create, Read, Update/Patch, Delete, and List files in ./workspace/.
 * 7. Terminal Executor: Executes local shell commands with output evaluation.
 * 8. Web Intelligence: Live web searching & documentation fetcher.
 * 
 * EXACTLY ZERO EXTERNAL DEPENDENCIES. NO API KEYS. NO AUTH. JUST WORKS.
 */

import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runAgenticLoop } from './src/agentLoop.js';
import { getModelProfile, MODEL_LIST } from './models/index.js';
import { getReasoningProfile, formatReasoningMenu } from './src/reasoning.js';
import { promptReasoningSelection, REASONING_LIST } from './src/reasoningMenu.js';
import { promptModelSelection } from './src/interactiveMenu.js';
import { startThinkingSpinner, stopThinkingSpinner } from './src/spinner.js';
import { listWorkspace, readFile, createFile, updateFile, deleteFile } from './src/tools/fileTools.js';
import { executeTerminalCommand } from './src/tools/terminalTools.js';
import { searchDuckDuckGo, fetchWebPage } from './src/tools/webTools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceDir = path.join(__dirname, 'workspace');

if (!fs.existsSync(workspaceDir)) {
  fs.mkdirSync(workspaceDir, { recursive: true });
}

// Session state
let autoAgentMode = true;
let isVerbose = false; // Clean, concise terminal output by default!
let activeModelKey = 'sweet-potato';
let activeReasoningLevel = 'medium';

// Recommended Commands Registry
const COMMAND_REGISTRY = [
  { cmd: '/model', desc: 'Interactive model selector (Yukon Gold [1], Sweet Potato [2], Russet [3])' },
  { cmd: '/effort', desc: 'Interactive reasoning effort selector (Low [1], Medium [2], High [3], Max [4])' },
  { cmd: '/verbose', desc: 'Toggle internal step-by-step reasoning trace logs ON/OFF' },
  { cmd: '/reasoning', desc: 'Alias for /effort reasoning level selection' },
  { cmd: '/think', desc: 'Alias for /effort reasoning level selection' },
  { cmd: '/help', desc: 'Show all available commands and guidance' },
  { cmd: '/ls', desc: 'List workspace directory files (/ls [subdir])' },
  { cmd: '/read', desc: 'Read content of a workspace file (/read <file>)' },
  { cmd: '/create', desc: 'Create a new file (/create <file> <text>)' },
  { cmd: '/patch', desc: 'Patch file content (/patch <file> <old> => <new>)' },
  { cmd: '/rm', desc: 'Delete a file or folder (/rm <file>)' },
  { cmd: '/run', desc: 'Execute a shell command (/run <cmd>)' },
  { cmd: '/search', desc: 'Web search DuckDuckGo' },
  { cmd: '/fetch', desc: 'Fetch web page content (/fetch <url>)' },
  { cmd: '/mode', desc: 'Toggle autonomous agentic mode (ON/OFF)' },
  { cmd: '/clear', desc: 'Clear conversation history' }
];

/**
 * Tab auto-completer for readline interface.
 */
function completer(line) {
  const clean = line.trim();
  if (clean.startsWith('/')) {
    const hits = COMMAND_REGISTRY.filter(c => c.cmd.startsWith(clean));
    const completions = hits.map(h => h.cmd);
    return [completions.length ? completions : COMMAND_REGISTRY.map(c => c.cmd), line];
  }
  return [[], line];
}

/**
 * Formats recommended slash commands list.
 */
function formatSlashRecommendations() {
  let output = `🥔 **Recommended PotatoAI Slash Commands:**\n`;
  output += `--------------------------------------------------------------------------------\n`;
  COMMAND_REGISTRY.forEach(item => {
    output += `   • **${item.cmd.padEnd(10)}** -> ${item.desc}\n`;
  });
  output += `--------------------------------------------------------------------------------\n`;
  output += `💡 Type \`/model\` or \`/effort\` to select models & reasoning levels interactively!`;
  return output;
}

/**
 * Handles slash commands or routes natural language to Agentic ReAct Engine.
 */
async function processUserInput(input) {
  const cleanInput = input.trim();
  if (!cleanInput) return { type: 'message', text: null };

  // 0. NUMERIC MODEL SHORTCUTS (1, 2, 3 or /1, /2, /3)
  if (/^(?:1|2|3|\/1|\/2|\/3)$/.test(cleanInput)) {
    const num = parseInt(cleanInput.replace('/', ''), 10);
    const chosenModel = MODEL_LIST[num - 1];
    if (chosenModel) {
      activeModelKey = chosenModel.id;
      return {
        type: 'message',
        text: `✅ Active Model switched to ${chosenModel.icon} **${chosenModel.name}**!\n` +
              `   • *${chosenModel.tagline}*\n` +
              `   • ${chosenModel.description}`
      };
    }
  }

  // 1. SLASH ALONE OR HELP (/ or /help)
  if (cleanInput === '/' || cleanInput.toLowerCase() === '/help') {
    return { type: 'message', text: formatSlashRecommendations() };
  }

  // 2. MODEL SELECTION COMMAND (/model)
  if (cleanInput.startsWith('/model')) {
    const targetModel = cleanInput.replace('/model', '').trim();

    if (!targetModel) {
      return { type: 'interactive_model' };
    }

    if (/^[1-3]$/.test(targetModel)) {
      const idx = parseInt(targetModel, 10) - 1;
      const chosenModel = MODEL_LIST[idx];
      activeModelKey = chosenModel.id;
      return {
        type: 'message',
        text: `✅ Active Model switched to ${chosenModel.icon} **${chosenModel.name}**!\n` +
              `   • *${chosenModel.tagline}*\n` +
              `   • ${chosenModel.description}`
      };
    }

    const newProfile = getModelProfile(targetModel);
    activeModelKey = newProfile.id;
    return {
      type: 'message',
      text: `✅ Active Model switched to ${newProfile.icon} **${newProfile.name}**!\n` +
            `   • *${newProfile.tagline}*\n` +
            `   • ${newProfile.description}`
    };
  }

  // 3. REASONING EFFORT SELECTION COMMAND (/effort, /reasoning, /think)
  if (cleanInput.startsWith('/effort') || cleanInput.startsWith('/reasoning') || cleanInput.startsWith('/think')) {
    const targetLevel = cleanInput.replace(/^\/(?:effort|reasoning|think)\s*/i, '').trim();

    if (!targetLevel) {
      return { type: 'interactive_reasoning' };
    }

    if (/^[1-4]$/.test(targetLevel)) {
      const idx = parseInt(targetLevel, 10) - 1;
      const chosenReasoning = REASONING_LIST[idx];
      activeReasoningLevel = chosenReasoning.id;
      return {
        type: 'message',
        text: `✅ Reasoning Effort switched to ${chosenReasoning.icon} **${chosenReasoning.name}**!\n` +
              `   • *Max Step Budget: ${chosenReasoning.maxSteps}*\n` +
              `   • ${chosenReasoning.description}`
      };
    }

    const reasoningProfile = getReasoningProfile(targetLevel);
    activeReasoningLevel = reasoningProfile.id;
    return {
      type: 'message',
      text: `✅ Reasoning Effort switched to ${reasoningProfile.icon} **${reasoningProfile.name}**!\n` +
            `   • *Max Step Budget: ${reasoningProfile.maxSteps}*\n` +
            `   • ${reasoningProfile.description}`
    };
  }

  // 4. TOGGLE VERBOSE LOGS (/verbose or /debug)
  if (cleanInput.toLowerCase() === '/verbose' || cleanInput.toLowerCase() === '/debug') {
    isVerbose = !isVerbose;
    return { type: 'message', text: `🔍 Step-by-step trace logging is now **${isVerbose ? 'ON (Verbose)' : 'OFF (Clean Output)'}**.` };
  }

  // 5. TOGGLE AGENT MODE (/mode)
  if (cleanInput.toLowerCase() === '/mode') {
    autoAgentMode = !autoAgentMode;
    return { type: 'message', text: `🔄 Agentic Autonomous Mode is now **${autoAgentMode ? 'ON' : 'OFF'}**.` };
  }

  // 6. WORKSPACE LIST (/ls or /list)
  if (cleanInput.startsWith('/ls') || cleanInput.startsWith('/list')) {
    const subDir = cleanInput.replace(/^\/(?:ls|list)\s*/i, '').trim();
    return { type: 'message', text: listWorkspace(subDir) };
  }

  // 7. FILE READ (/read <file>)
  if (cleanInput.startsWith('/read ')) {
    const filePath = cleanInput.replace('/read ', '').trim();
    return { type: 'message', text: readFile(filePath) };
  }

  // 8. FILE CREATE (/create <file> <content> or /write <file> <content>)
  if (cleanInput.startsWith('/create ') || cleanInput.startsWith('/write ')) {
    const argsStr = cleanInput.replace(/^\/(?:create|write)\s+/i, '').trim();
    const spaceIdx = argsStr.indexOf(' ');
    if (spaceIdx === -1) {
      return { type: 'message', text: `❌ Format error. Usage: \`/create <filename> <content>\`` };
    }
    const filename = argsStr.slice(0, spaceIdx).trim();
    const content = argsStr.slice(spaceIdx + 1).trim();
    return { type: 'message', text: createFile(filename, content) };
  }

  // 9. FILE PATCH (/patch <file> <target> => <replacement>)
  if (cleanInput.startsWith('/patch ')) {
    const patchStr = cleanInput.replace('/patch ', '').trim();
    const parts = patchStr.split('=>');
    if (parts.length < 2) {
      return { type: 'message', text: `❌ Format error. Usage: \`/patch <filename> <targetContent> => <replacementContent>\`` };
    }
    const leftPart = parts[0].trim();
    const replacementContent = parts.slice(1).join('=>').trim();
    const firstSpace = leftPart.indexOf(' ');
    if (firstSpace === -1) {
      return { type: 'message', text: `❌ Format error. Could not split file and target content.` };
    }
    const filename = leftPart.slice(0, firstSpace).trim();
    const targetContent = leftPart.slice(firstSpace + 1).trim();
    return { type: 'message', text: updateFile(filename, targetContent, replacementContent) };
  }

  // 10. FILE DELETE (/rm <file> or /delete <file>)
  if (cleanInput.startsWith('/rm ') || cleanInput.startsWith('/delete ')) {
    const filePath = cleanInput.replace(/^\/(?:rm|delete)\s+/i, '').trim();
    return { type: 'message', text: deleteFile(filePath) };
  }

  // 11. TERMINAL EXECUTION (/run <cmd>)
  if (cleanInput.startsWith('/run ')) {
    const command = cleanInput.replace('/run ', '').trim();
    return { type: 'message', text: await executeTerminalCommand(command) };
  }

  // 12. WEB SEARCH (/search <query>)
  if (cleanInput.startsWith('/search ')) {
    const query = cleanInput.replace('/search ', '').trim();
    return { type: 'message', text: await searchDuckDuckGo(query) };
  }

  // 13. WEB FETCH (/fetch <url>)
  if (cleanInput.startsWith('/fetch ')) {
    const url = cleanInput.replace('/fetch ', '').trim();
    return { type: 'message', text: await fetchWebPage(url) };
  }

  // 14. CLEAR CONVERSATION (/clear)
  if (cleanInput.toLowerCase() === '/clear') {
    return { type: 'message', text: `🧹 Session state cleared.` };
  }

  // 15. DEFAULT ROUTER: AUTONOMOUS AGENTIC REACTION ENGINE 🧠
  if (autoAgentMode) {
    const result = await runAgenticLoop(cleanInput, {
      modelKey: activeModelKey,
      reasoningLevel: activeReasoningLevel,
      verbose: isVerbose
    });
    return { type: 'message', text: result };
  } else {
    const result = await searchDuckDuckGo(cleanInput);
    return { type: 'message', text: result };
  }
}

const currentProfile = getModelProfile(activeModelKey);
const currentReasoning = getReasoningProfile(activeReasoningLevel);

console.log('================================================================');
console.log(`🥔 PotatoAI — Keyless Autonomous Agentic AI Coding Assistant`);
console.log('================================================================');
console.log(`🧠 Model Tier: ${currentProfile.icon} ${currentProfile.name} (${currentProfile.tagline})`);
console.log(`🔬 Reasoning Effort: ${currentReasoning.icon} ${currentReasoning.name} (Max Steps: ${currentReasoning.maxSteps})`);
console.log('   → Zero Dependencies | Zero API Keys | 100% Free');
console.log('');
console.log('🤖 Available Selectors:');
console.log('   • /model    -> Interactive Model Selector (Yukon Gold [1], Sweet Potato [2], Russet [3])');
console.log('   • /effort   -> Interactive Reasoning Effort Selector (Low [1], Medium [2], High [3], Max [4])');
console.log('');
console.log('💡 Type / to view recommended commands. Press TAB to auto-complete. Type "exit" to quit.');
console.log('================================================================\n');

function startChatLoop() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer
  });

  const promptText = `👤 You [Model: ${getModelProfile(activeModelKey).name} | Reasoning: ${getReasoningProfile(activeReasoningLevel).name}]: `;

  rl.question(promptText, async (userInput) => {
    const trimmed = userInput.trim();

    if (trimmed.toLowerCase() === 'exit') {
      console.log('🥔 PotatoAI: Goodbye! Happy coding!');
      rl.close();
      return;
    }

    if (!trimmed) {
      rl.close();
      startChatLoop();
      return;
    }

    // Start animated thinking spinner
    startThinkingSpinner(getModelProfile(activeModelKey));

    const res = await processUserInput(trimmed);

    // Stop animated thinking spinner
    stopThinkingSpinner();

    if (res && res.type === 'interactive_model') {
      rl.close();
      promptModelSelection(activeModelKey, (chosenModel) => {
        if (chosenModel && chosenModel.isMenuFallback) {
          console.log('\n🤖 PotatoAI Output:');
          console.log('--------------------------------------------------------------------------------');
          console.log(chosenModel.text);
          console.log('--------------------------------------------------------------------------------\n');
        } else if (chosenModel && chosenModel.id) {
          activeModelKey = chosenModel.id;
        }
        startChatLoop();
      });
      return;
    }

    if (res && res.type === 'interactive_reasoning') {
      rl.close();
      promptReasoningSelection(activeReasoningLevel, (chosenReasoning) => {
        if (chosenReasoning && chosenReasoning.isMenuFallback) {
          console.log('\n🤖 PotatoAI Output:');
          console.log('--------------------------------------------------------------------------------');
          console.log(chosenReasoning.text);
          console.log('--------------------------------------------------------------------------------\n');
        } else if (chosenReasoning && chosenReasoning.id) {
          activeReasoningLevel = chosenReasoning.id;
        }
        startChatLoop();
      });
      return;
    }

    if (res && res.text) {
      console.log('\n🤖 PotatoAI Output:');
      console.log('--------------------------------------------------------------------------------');
      console.log(res.text);
      console.log('--------------------------------------------------------------------------------\n');
    }

    rl.close();
    startChatLoop();
  });
}

startChatLoop();
