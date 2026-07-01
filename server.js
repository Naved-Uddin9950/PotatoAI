/**
 * 🥔 PotatoAI: Autonomous CLI Coding Agent (Multi-Mode Architecture)
 * ------------------------------------------------------------------
 * This script implements a Principal Coding Agent with distinct operating modes:
 * 1. Explainer Mode (/explain <topic>): conceptual block matching + line-by-line code summary.
 * 2. Debug Mode (/debug <topic>): extracts buggy code, explains the flaw, and outputs the fix.
 * 3. Plan Mode (/plan <task>): generates a step-by-step checklist based on the best architecture.
 * 4. Standard Search (default): returns matched markdown documentation cards.
 */

import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const datasetsDir = path.join(__dirname, 'datasets');

// Stopwords to filter out before topic classification
const stopwords = new Set([
  "what", "is", "can", "you", "please", "tell", "me", "about", "how", "are", 
  "do", "does", "did", "explain", "the", "a", "an", "to", "for", "with", "of"
]);

// Technical topics and their lookup keywords
const techTopics = {
  reactjs: {
    fileName: 'reactjs.txt',
    keywords: ["react", "reactjs", "component", "components", "hook", "hooks", "usestate", "useeffect", "dom", "redux", "router", "tailwind", "frontend", "nextjs", "jsx"]
  },
  dotnet: {
    fileName: 'dotnet.txt',
    keywords: ["dotnet", ".net", "c#", "csharp", "microsoft", "api", "apis", "backend", "entity", "ef", "framework", "enterprise", "asp.net"]
  },
  express: {
    fileName: 'express.txt',
    keywords: ["express", "expressjs", "routing", "middleware", "node", "nodejs", "server", "cors", "port", "request", "response"]
  },
  testing: {
    fileName: 'testing.txt',
    keywords: ["test", "testing", "jest", "mock", "mocking", "rtl", "assertions", "coverage", "unit", "integration"]
  }
};

const topicBlocks = {};
const topicSentences = {};

console.log('🤖 Loading datasets and configuring AI Coding Agent...');

try {
  // Load conversation dataset (split by newline)
  const convPath = path.join(datasetsDir, 'basic_conversation.txt');
  if (!fs.existsSync(convPath)) {
    throw new Error('Missing basic_conversation.txt dataset.');
  }
  topicBlocks['basic_conversation'] = fs.readFileSync(convPath, 'utf-8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Load tech topic datasets (split by '@@@' marker)
  for (const [topicName, info] of Object.entries(techTopics)) {
    const filePath = path.join(datasetsDir, info.fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing dataset file: ${info.fileName}. Please verify datasets folder.`);
    }

    topicBlocks[topicName] = fs.readFileSync(filePath, 'utf-8')
      .split('@@@')
      .map(block => block.trim())
      .filter(block => block.length > 0);

    console.log(` 📂 Loaded topic: [${topicName.toUpperCase()}] (${topicBlocks[topicName].length} docs sections)`);
  }
  console.log('✅ AI Coding Agent is online.\n');
} catch (error) {
  console.error('❌ Training error:', error.message);
  process.exit(1);
}

/**
 * Normalizes input by lowercasing and removing stopwords.
 * @param {string} text 
 * @returns {string[]} Filtered tokens
 */
function cleanQuery(text) {
  return text
    .toLowerCase()
    .replace(/[?.,!]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0 && !stopwords.has(word));
}

/**
 * Classifies query into one of the technical domains based on keyword match score.
 * @param {string} text 
 * @returns {string|null} The matched topic name
 */
function classifyTopic(text) {
  const queryTokens = cleanQuery(text);
  let bestTopic = null;
  let maxHits = 0;

  for (const [topicName, info] of Object.entries(techTopics)) {
    let hits = 0;
    for (const token of queryTokens) {
      if (info.keywords.includes(token)) {
        hits++;
      }
    }
    if (hits > maxHits) {
      maxHits = hits;
      bestTopic = topicName;
    }
  }
  return bestTopic;
}

/**
 * Extracts and compiles a structured Markdown block based on query matches.
 * @param {string} userInput 
 * @param {string} topic 
 * @returns {string} The matching documentation Markdown block
 */
function getDocumentationBlock(userInput, topic) {
  const blocks = topicBlocks[topic];
  if (!blocks || blocks.length === 0) return "";

  const queryTokens = cleanQuery(userInput);

  const scored = blocks.map((block, index) => {
    const blockLower = block.toLowerCase();
    let score = 0;
    for (const token of queryTokens) {
      if (blockLower.includes(token)) {
        score++;
      }
    }
    return { index, block, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].block;
}

// -------------------------------------------------------------
// MODE IMPLEMENTATION UTILITIES
// -------------------------------------------------------------

/**
 * Generates a line-by-line mechanical execution summary for code blocks.
 * @param {string} codeText 
 * @returns {string} The structured summary
 */
function generateMechanicalSummary(codeText) {
  const lines = codeText.split('\n');
  const summary = [];
  
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('using')) {
      return;
    }

    let explanation = "";
    if (trimmed.includes('useState')) {
      explanation = "Declares a local state hook (initializes variables and hooks state reactivity).";
    } else if (trimmed.includes('useEffect')) {
      explanation = "Declares a side-effect hook synchronization block (runs cleanup on unmount).";
    } else if (trimmed.includes('useSyncExternalStore')) {
      explanation = "Subscribes component rendering dynamically to an isolated external micro-state store.";
    } else if (trimmed.includes('useRef')) {
      explanation = "Creates a persistent element pointer mutable reference (bypasses re-renders).";
    } else if (trimmed.includes('express()')) {
      explanation = "Bootstraps a core server application instance utilizing the Express modules.";
    } else if (trimmed.includes('.use(')) {
      explanation = "Registers custom handler middleware components globally or into the router pipeline.";
    } else if (trimmed.includes('.get(')) {
      explanation = "Declares an HTTP GET endpoint route handler targeting client requests.";
    } else if (trimmed.includes('.post(')) {
      explanation = "Declares an HTTP POST endpoint route handler parsing request payload bodies.";
    } else if (trimmed.includes('DbContext')) {
      explanation = "Initializes an Object-Relational Database context mapper connection.";
    } else if (trimmed.includes('Task.WhenAll')) {
      explanation = "Executes async tasks in parallel, waiting for thread aggregation pools.";
    } else if (trimmed.includes('SemaphoreSlim')) {
      explanation = "Constructs a thread limits barrier gate throttling max parallel client threads.";
    } else if (trimmed.includes('jest.fn()')) {
      explanation = "Creates a Jest function execution spy monitoring parameter inputs.";
    } else if (trimmed.includes('expect(')) {
      explanation = "Verifies execution expectations matching outputs against target values.";
    }

    if (explanation) {
      summary.push(`   Line ${idx + 1}: \`${trimmed}\`\n          └─> ${explanation}`);
    }
  });

  if (summary.length === 0) {
    return "   No complex hooks, delegates, or API definitions found to summarize.";
  }

  return summary.join('\n');
}

/**
 * Extracts buggy code, explains the flaw, and outputs the fix.
 * @param {string} topic 
 * @returns {string} The debug response
 */
function handleDebugMode(topic) {
  const blocks = topicBlocks[topic];
  if (!blocks) {
    return `Please specify a valid topic folder to debug. E.g., /debug reactjs or /debug express.`;
  }

  // Retrieve the optimization block
  const debugBlock = blocks.find(b => b.includes('🛑 BUGGY/UNOPTIMIZED CODE'));
  if (!debugBlock) {
    return `Could not locate a debug/optimization block for the topic: ${topic.toUpperCase()}`;
  }

  let flawExplanation = "";
  if (topic === 'reactjs') {
    flawExplanation = "FLAW: The setInterval function is invoked on every render because the useEffect dependency array is missing. Additionally, the interval is never cleared when the component unmounts, causing memory leaks and CPU exhaustion as duplicate timers run concurrently.";
  } else if (topic === 'express') {
    flawExplanation = "FLAW: The endpoint uses fs.readFileSync() synchronously inside the single-threaded request handler. This blocks the entire Node.js event loop, preventing the server from handling any other concurrent client requests until the file read is complete.";
  } else if (topic === 'dotnet') {
    flawExplanation = "FLAW: The database context executes an N+1 query loop. It fetches a list of Users and then makes a separate database SQL request for each user inside the loop to fetch their Orders. This creates extreme database connection latency.";
  } else if (topic === 'testing') {
    flawExplanation = "FLAW: The test triggers an asynchronous state change using fireEvent.click() but asserts on the DOM layout synchronously using expect(). This causes the test to fail or raise 'not wrapped in act(...)' warnings because state updates after the assertion runs.";
  }

  return `🐞 DEBUG ANALYSIS: [${topic.toUpperCase()}]\n` +
         `--------------------------------------------------------------------------------\n` +
         `🔍 DETECTED LOGIC FLAW:\n` +
         `   ${flawExplanation}\n\n` +
         `${debugBlock}`;
}

/**
 * Generates an ordered architecture checklist for a given task.
 * @param {string} task 
 * @param {string} topic 
 * @returns {string} The build plan
 */
function handlePlanMode(task, topic) {
  let steps = [];
  if (topic === 'reactjs') {
    steps = [
      "Define Component Structure: Plan child layouts and state lifting options.",
      "Initialize State Hooks: Declare input parameters and state structures via `useState`.",
      "Synchronize Effects: Set up `useEffect` for network loading, specifying cleanup callbacks.",
      "Memoization Check: Implement `useCallback` or `useMemo` to prevent deep-tree re-renders."
    ];
  } else if (topic === 'express') {
    steps = [
      "Structure Route Maps: Initialize routers via `express.Router()` inside endpoints.",
      "Payload Middleware: Enable incoming body parsing via global `express.json()` calls.",
      "Securing the Route: Add authentication guards (JWT verify hooks) and validate inputs.",
      "Central Error Catching: Wrap operations in try-catch pipes delegating errors to `next()`."
    ];
  } else if (topic === 'dotnet') {
    steps = [
      "Establish Schema Context: Set up Database context properties mapping entity classes.",
      "Lifecycle Service Registry: Register service lifetimes (Transient/Scoped) in `Program.cs`.",
      "Form LINQ Queries: Implement query filters applying `.AsNoTracking()` and eager joins.",
      "Throttling parallel calls: Incorporate `SemaphoreSlim` locks for multiple task tasks."
    ];
  } else if (topic === 'testing') {
    steps = [
      "Declare Test Runner Block: Wire assertions inside `describe` and `test` blocks.",
      "Mock network adapters: Spin up MSW (Mock Service Worker) node listeners.",
      "Trigger User Interaction: Dispatch virtual input triggers using async `userEvent`.",
      "Catch Layout Changes: Await visual DOM updates via `findByRole` to prevent act warnings."
    ];
  } else {
    steps = [
      "Deconstruct Specifications: Outline components and module mappings.",
      "Design Service Interfaces: Declare structural controllers and data models.",
      "Implement Target Flow: Build primary logic, checking parameters validation.",
      "Verify Performance Constraints: Check async loops to prevent processor blockage."
    ];
  }

  return `📋 ARCHITECTURE CHECKLIST: "${task.toUpperCase()}"\n` +
         `Component Domain: [${topic.toUpperCase()}]\n` +
         `--------------------------------------------------------------------------------\n` +
         steps.map((step, idx) => `   Step ${idx + 1}: ${step}`).join('\n') +
         `\n--------------------------------------------------------------------------------`;
}

// -------------------------------------------------------------
// CENTRAL COMMAND ROUTER
// -------------------------------------------------------------
function processAgentQuery(userInput) {
  const cleanInput = userInput.trim();

  // 1. EXPLAINER MODE (/explain <topic>)
  if (cleanInput.startsWith('/explain')) {
    const query = cleanInput.replace('/explain', '').trim();
    if (!query) return "Usage: /explain <keyword> (e.g. /explain useState)";

    const topic = classifyTopic(query);
    if (!topic) return "I couldn't match that to a loaded topic. Try explaining: useState, middleware, SemaphoreSlim, Jest, etc.";

    const block = getDocumentationBlock(query, topic);
    
    // Extract code block inside the block using regex
    const codeMatch = block.match(/```javascript([\s\S]*?)```/);
    const summaryHeader = `\n⚙️ LINE-BY-LINE MECHANICAL SUMMARY:\n`;
    const summary = codeMatch ? generateMechanicalSummary(codeMatch[1]) : "No code block found to summarize.";

    return `${block}\n${summaryHeader}${summary}`;
  }

  // 2. DEBUG MODE (/debug <topic>)
  if (cleanInput.startsWith('/debug')) {
    const query = cleanInput.replace('/debug', '').trim();
    if (!query) {
      return "Usage: /debug <topic> (e.g. /debug reactjs, /debug express, /debug dotnet, /debug testing)";
    }
    const topic = query.toLowerCase();
    return handleDebugMode(topic);
  }

  // 3. PLAN MODE (/plan <task>)
  if (cleanInput.startsWith('/plan')) {
    const task = cleanInput.replace('/plan', '').trim();
    if (!task) return "Usage: /plan <task description> (e.g. /plan Build a react authentication component)";

    const topic = classifyTopic(task) || 'general';
    return handlePlanMode(task, topic);
  }

  // 4. STANDARD INTENT ROUTING
  // Check if input is a conversational greeting/question
  const words = cleanInput.toLowerCase().replace(/[?.,!]/g, ' ').trim().split(/\s+/);
  const isGreeting = words.some(w => greetingKeywords.has(w)) || 
                     cleanInput.toLowerCase().includes("how are you") || 
                     cleanQuery(cleanInput).length === 0;

  if (isGreeting) {
    const convSentences = topicBlocks['basic_conversation'];
    return convSentences[Math.floor(Math.random() * convSentences.length)];
  }

  const topic = classifyTopic(cleanInput);
  if (topic) {
    return getDocumentationBlock(cleanInput, topic);
  }

  // Fallback
  const availableTopics = Object.keys(techTopics).map(t => `   • ${t}`).join('\n');
  return `I'm sorry, I couldn't match your query.
    
I am trained on:
${availableTopics}

Try using a command like:
   • /explain useState
   • /debug reactjs
   • /plan build an express authentication router
   • Or ask a standard question!`;
}

// -------------------------------------------------------------
// INTERACTIVE CLI LAYOUT
// -------------------------------------------------------------
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.clear();
console.log('================================================================');
console.log('🥔 PotatoAI Coding Agent - Multi-Mode Architecture');
console.log('================================================================');
console.log('🤖 Commands Available:');
console.log('   /explain <keyword>  -> Explains a concept + code summary');
console.log('   /debug <topic>      -> Analyzes a buggy model vs optimized fix');
console.log('   /plan <task>        -> Generates a step-by-step build plan');
console.log('   <general question>  -> Semantic documentation search');
console.log('   type "exit"         -> Shut down the agent');
console.log('================================================================');

function startChatLoop() {
  rl.question('\n👤 You: ', (userInput) => {
    const inputCleaned = userInput.trim();

    if (inputCleaned.toLowerCase() === 'exit') {
      console.log('🤖 PotatoAI: Goodbye! Happy coding!');
      rl.close();
      return;
    }

    const reply = processAgentQuery(inputCleaned);
    
    console.log('\n🤖 PotatoAI:');
    console.log('--------------------------------------------------------------------------------');
    console.log(reply);
    console.log('--------------------------------------------------------------------------------');

    startChatLoop();
  });
}

// Start agent loop
startChatLoop();
