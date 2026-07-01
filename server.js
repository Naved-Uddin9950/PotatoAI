/**
 * 🥔 PotatoAI: Autonomous Coding Agent (SearXNG API & Terminal Executor Tools)
 * -----------------------------------------------------------------------------
 * A fully native autonomous agent executing on low-spec hardware:
 * 1. Explicit Router: routes strictly using prefixes (/search, /run, /write, etc.)
 * 2. SearXNG API Tool: queries public SearXNG instances with DuckDuckGo fallback.
 * 3. Terminal Executor Tool (/run <command>): executes shell commands locally.
 * 4. File Writer Tool: writes code blocks directly to ./workspace/ via native fs.
 * 5. Local Documentation Tool: queries local structured markdown cards.
 * 
 * EXACTLY ZERO EXTERNAL NPM LIBRARIES ARE USED.
 */

import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

// Setup directories for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const datasetsDir = path.join(__dirname, 'datasets');
const workspaceDir = path.join(__dirname, 'workspace');

// Initialize workspace folder if missing
if (!fs.existsSync(workspaceDir)) {
  fs.mkdirSync(workspaceDir, { recursive: true });
}

// Stopwords to filter out before topic classification
const stopwords = new Set([
  "what", "is", "can", "you", "please", "tell", "me", "about", "how", "are", 
  "do", "does", "did", "explain", "the", "a", "an", "to", "for", "with", "of"
]);

// Greeting triggers
const greetingKeywords = new Set([
  "hi", "hello", "hey", "greetings", "yo", "howdy", "sup", "welcome"
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

console.log('🤖 Loading datasets and configuring native AI Agent...');

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
  console.log('✅ Native AI Agent is online.\n');
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
 * Extracts a matching Markdown block based on query matches.
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

/**
 * Executes a terminal shell command asynchronously and returns output.
 * @param {string} cmd 
 * @returns {Promise<string>} Console outputs (stdout / stderr)
 */
function executeTerminalCommand(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { cwd: process.cwd() }, (error, stdout, stderr) => {
      let output = "";
      if (stdout) {
        output += `⚡ **STDOUT:**\n\`\`\`\n${stdout.trim()}\n\`\`\`\n`;
      }
      if (stderr) {
        output += `⚠️ **STDERR:**\n\`\`\`\n${stderr.trim()}\n\`\`\`\n`;
      }
      if (error) {
        output += `❌ **EXECUTION ERROR (Exit Code ${error.code}):**\n\`\`\`\n${error.message.trim()}\n\`\`\`\n`;
      }
      if (!output) {
        output = "⚡ Command finished successfully with no output streams.";
      }
      resolve(output);
    });
  });
}

/**
 * Queries SearXNG instances with primary and backup routing.
 * Falls back to an unblockable DuckDuckGo HTML parser if both fail.
 * @param {string} query 
 * @returns {Promise<string|null>} Clean formatted information snippet or null
 */
async function querySearxng(query) {
  const primaryUrl = `https://onon71.dev/search?q=${encodeURIComponent(query)}&format=json`;
  const backupUrl = `https://searx.be/search?q=${encodeURIComponent(query)}&format=json`;
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

  // 1. Try primary SearXNG instance
  try {
    console.log(`🔍 Contacting primary SearXNG instance (onon71.dev)...`);
    const response = await fetch(primaryUrl, { headers, signal: AbortSignal.timeout(5000) });
    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          return formatSearxngResults(data.results, query);
        }
      }
    }
  } catch (err) {
    console.log(`⚠️ Primary instance failed: ${err.message}. Trying backup instance...`);
  }

  // 2. Try backup SearXNG instance
  try {
    console.log(`🔍 Contacting backup SearXNG instance (searx.be)...`);
    const response = await fetch(backupUrl, { headers, signal: AbortSignal.timeout(5000) });
    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          return formatSearxngResults(data.results, query);
        }
      }
    }
  } catch (err) {
    console.log(`⚠️ Backup instance failed: ${err.message}.`);
  }

  // 3. Unblockable Fallback: DuckDuckGo HTML Scraper
  try {
    console.log(`🔍 Contacting unblockable search engine fallback (DuckDuckGo)...`);
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(ddgUrl, { headers, signal: AbortSignal.timeout(5000) });
    if (response.ok) {
      const html = await response.text();
      const blockRegex = /<div class="[^"]*web-result[\s\S]*?<a class="result__url"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
      const results = [];
      let match;
      
      while ((match = blockRegex.exec(html)) && results.length < 3) {
        let rawUrl = match[1];
        if (rawUrl.startsWith('//')) {
          rawUrl = 'https:' + rawUrl;
        }
        let cleanUrl = rawUrl;
        try {
          const parsed = new URL(rawUrl);
          const uddg = parsed.searchParams.get('uddg');
          if (uddg) cleanUrl = decodeURIComponent(uddg);
        } catch (e) {}

        results.push({
          title: match[2].replace(/<[^>]*>/g, '').trim(),
          url: cleanUrl,
          content: match[3].replace(/<[^>]*>/g, '').trim()
        });
      }

      if (results.length > 0) {
        return formatSearxngResults(results, query);
      }
    }
  } catch (err) {
    console.log(`⚠️ Unblockable search fallback failed: ${err.message}.`);
  }

  return null; // All search tools failed
}

/**
 * Formats SearXNG query results array into a structured markdown block.
 * @param {object[]} results 
 * @param {string} query 
 * @returns {string} Formatted markdown text
 */
function formatSearxngResults(results, query) {
  const snippets = results.slice(0, 3)
    .map(r => `• **${r.title}**\n  ${r.content || r.snippet || 'No description available.'}\n  [Link](${r.url})`)
    .join('\n\n');
  return `🔍 Web Search Results for "${query}":\n\n${snippets}`;
}

// -------------------------------------------------------------
// CENTRAL EXPLICIT PREFIX ROUTER
// -------------------------------------------------------------
async function processAgentQuery(userInput) {
  const cleanInput = userInput.trim();

  // 1. EXPLICIT WEB SEARCH ROUTER (/search <query>)
  if (cleanInput.startsWith('/search ')) {
    const query = cleanInput.replace('/search ', '').trim();
    console.log(`🔍 Exclusively routing to Web Search Tool for "${query}"...`);
    const searchRes = await querySearxng(query);
    return searchRes || `❌ Search Tool returned zero results for: "${query}"`;
  }

  // 2. EXPLICIT TERMINAL COMMAND ROUTER (/run <command>)
  if (cleanInput.startsWith('/run ')) {
    const command = cleanInput.replace('/run ', '').trim();
    console.log(`⚡ Exclusively routing to Terminal Executor: Running "${command}"...`);
    return await executeTerminalCommand(command);
  }

  // 3. EXPLICIT FILE SYSTEM WRITER ROUTER (starts with /write, /create, /save, /generate, generate file)
  const isFileCommand = cleanInput.startsWith('/write') || 
                        cleanInput.startsWith('/create') || 
                        cleanInput.startsWith('/save') || 
                        cleanInput.startsWith('/generate') ||
                        cleanInput.toLowerCase().startsWith('generate file');

  if (isFileCommand) {
    console.log('💾 Routing to File Writer Tool...');
    
    // Strip prefixes
    let fileQuery = cleanInput;
    if (cleanInput.startsWith('/write ')) fileQuery = cleanInput.replace('/write ', '');
    else if (cleanInput.startsWith('/create ')) fileQuery = cleanInput.replace('/create ', '');
    else if (cleanInput.startsWith('/save ')) fileQuery = cleanInput.replace('/save ', '');
    else if (cleanInput.startsWith('/generate ')) fileQuery = cleanInput.replace('/generate ', '');
    else if (cleanInput.toLowerCase().startsWith('generate file ')) fileQuery = cleanInput.slice(14);

    const writeRegex = /(?:code|snippet|text|the|this)?\s*(.*?)\s+(?:to|in)\s+([a-zA-Z0-9_\-\.]+)/i;
    const writeMatch = fileQuery.match(writeRegex);

    if (!writeMatch) {
      return `Format incorrect. Please write in the format: "/write <description> to <filename>". E.g., "/write react counter to counter.js"`;
    }

    const contentDescription = writeMatch[1].trim();
    const filename = writeMatch[2].trim();
    
    // Determine if description requires a web search
    const cleanDesc = contentDescription.replace(/^search\s+for\s+/i, '');
    const isSearchNeeded = contentDescription.toLowerCase().startsWith('search for') || 
                           contentDescription.toLowerCase().includes('latest') ||
                           contentDescription.toLowerCase().includes('release');

    let contentToWrite = "";
    let sourceMessage = "";

    if (isSearchNeeded) {
      console.log(`🔍 Calling SearXNG API for "${cleanDesc}" to gather file content...`);
      const searchRes = await querySearxng(cleanDesc);
      if (searchRes) {
        contentToWrite = searchRes;
        sourceMessage = `SearXNG API query for "${cleanDesc}"`;
      }
    }

    // Fallback to local documentation if content is still empty
    if (!contentToWrite) {
      const topic = classifyTopic(contentDescription);
      if (topic) {
        const block = getDocumentationBlock(contentDescription, topic);
        // Extract code block inside the block if present
        const codeMatch = block.match(/```(?:javascript|c#)?([\s\S]*?)```/);
        contentToWrite = codeMatch ? codeMatch[1].trim() : block;
        sourceMessage = `Local Documentation [${topic.toUpperCase()}] for "${contentDescription}"`;
      } else {
        contentToWrite = `// Template created for query: ${contentDescription}\n// No matched documentation found.`;
        sourceMessage = `No matched topic. Empty template created.`;
      }
    }

    console.log(`💾 Writing content to "./workspace/${filename}"...`);
    try {
      const filePath = path.join(workspaceDir, filename);
      fs.writeFileSync(filePath, contentToWrite, 'utf-8');
      
      return `🎉 File successfully written!\n` +
             `Path: [workspace/${filename}](file:///${filePath.replace(/\\/g, '/')})\n` +
             `Source: ${sourceMessage}\n\n` +
             `Preview of Content:\n` +
             `--------------------------------------------------------------------------------\n` +
             `${contentToWrite.slice(0, 300)}${contentToWrite.length > 300 ? '\n... (truncated)' : ''}\n` +
             `--------------------------------------------------------------------------------`;
    } catch (err) {
      return `❌ File Writer Tool Error: Failed to write to disk. ${err.message}`;
    }
  }

  // 4. CONVERSATIONAL DIRECT ROUTE
  const words = cleanInput.toLowerCase().replace(/[?.,!]/g, ' ').trim().split(/\s+/);
  const isGreeting = words.some(w => greetingKeywords.has(w)) || 
                     cleanInput.toLowerCase().includes("how are you") || 
                     cleanQuery(cleanInput).length === 0;

  if (isGreeting) {
    const convSentences = topicBlocks['basic_conversation'];
    return convSentences[Math.floor(Math.random() * convSentences.length)];
  }

  // 5. LOCAL DOCUMENTATION KEYWORD MATCHING (Default fallback)
  const topic = classifyTopic(cleanInput);
  if (topic) {
    console.log(`📖 Invoking Local Documentation Tool for [${topic.toUpperCase()}]...`);
    return getDocumentationBlock(cleanInput, topic);
  }

  // Fallback if no matching topic is found anywhere
  const availableTopics = Object.keys(techTopics).map(t => `   • ${t}`).join('\n');
  return `I'm sorry, I couldn't find a strong match for your query.
    
I am trained on:
${availableTopics}

You can also use tools explicitly:
   • Search web: "/search which country produces most of the Anime ?"
   • Write files: "/write the react counter component to counter.js"
   • Run commands: "/run node --version"`;
}

// -------------------------------------------------------------
// INTERACTIVE CLI LOOP
// -------------------------------------------------------------
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.clear();
console.log('================================================================');
console.log('🥔 Welcome to PotatoAI Coding Agent - Strict Prefix Routing');
console.log('================================================================');
console.log('🤖 Active Tools:');
console.log('   /search <query>  -> FORCEFUL Web Search (SearXNG + DDG Fallback)');
console.log('   /run <command>   -> Terminal command executor (e.g. "/run npm test")');
console.log('   /write <args>    -> File system workspace writer');
console.log('   <general text>   -> Default Local Docs Search');
console.log('   type "exit" to quit');
console.log('================================================================');

async function startChatLoop() {
  rl.question('\n👤 You: ', async (userInput) => {
    const inputCleaned = userInput.trim();

    if (inputCleaned.toLowerCase() === 'exit') {
      console.log('🤖 PotatoAI: Goodbye! Happy coding!');
      rl.close();
      return;
    }

    const reply = await processAgentQuery(inputCleaned);
    
    console.log('\n🤖 PotatoAI:');
    console.log('--------------------------------------------------------------------------------');
    console.log(reply);
    console.log('--------------------------------------------------------------------------------');

    startChatLoop(); // Loop back
  });
}

// Start agent loop
startChatLoop();
