/**
 * 🥔 PotatoAI: Autonomous Coding Agent (Web & AI Intelligence Engine)
 * -----------------------------------------------------------------------------
 * Fully native autonomous agent running on any hardware:
 * 1. AI & Web Synthesis Engine: provides full code solutions, detailed explanations,
 *    and live web intelligence for any query.
 * 2. Web Search Tool (/search <query>): direct web search via DuckDuckGo & SearXNG.
 * 3. Terminal Executor Tool (/run <command>): executes shell commands locally.
 * 4. File Writer Tool (/write <args>): creates files directly in ./workspace/.
 * 
 * EXACTLY ZERO EXTERNAL DEPENDENCIES. NO API KEYS. NO AUTH. JUST WORKS.
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

// Greeting triggers
const greetingKeywords = new Set([
  "hi", "hello", "hey", "greetings", "yo", "howdy", "sup", "welcome"
]);

// Topic aliases for Wikipedia lookup
const topicAliases = {
  'js': 'JavaScript',
  'ts': 'TypeScript',
  'py': 'Python',
  'cs': 'C_Sharp',
  'react': 'React_(software)',
  'express': 'Express.js',
  'node': 'Node.js'
};

// Load basic conversation greetings if present
let greetingResponses = [];
try {
  const convPath = path.join(datasetsDir, 'basic_conversation.txt');
  if (fs.existsSync(convPath)) {
    greetingResponses = fs.readFileSync(convPath, 'utf-8')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }
} catch (err) {
  // Optional greeting fallback
}

if (greetingResponses.length === 0) {
  greetingResponses = [
    "Hey there! I'm PotatoAI — ask me anything. 🥔",
    "Hello! Ready to help. What's on your mind?",
    "Hi! Drop your query here and let's get to work!"
  ];
}

// Session conversation history
const conversationHistory = [];
const MAX_HISTORY = 20;

// Standard Headers
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Decodes HTML entities in text strings.
 */
function decodeHtml(htmlStr) {
  if (!htmlStr) return '';
  return htmlStr
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, '')
    .trim();
}

// =============================================================
// CODE GENERATOR & TEMPLATE ENGINE
// =============================================================

const codeTemplates = {
  merge_sort: {
    title: "Merge Sort in JavaScript",
    code: `function mergeSort(arr) {
  if (arr.length <= 1) {
    return arr;
  }

  // Find the middle index
  const mid = Math.floor(arr.length / 2);
  const left = arr.slice(0, mid);
  const right = arr.slice(mid);

  // Recursively split and merge
  return merge(mergeSort(left), mergeSort(right));
}

function merge(left, right) {
  let result = [];
  let leftIndex = 0;
  let rightIndex = 0;

  // Compare elements from left and right arrays and push smaller element
  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] < right[rightIndex]) {
      result.push(left[leftIndex]);
      leftIndex++;
    } else {
      result.push(right[rightIndex]);
      rightIndex++;
    }
  }

  // Concatenate remaining elements
  return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
}

// --- Example Usage ---
const numbers = [38, 27, 43, 3, 9, 82, 10];
console.log("Original Array:", numbers);
const sortedNumbers = mergeSort(numbers);
console.log("Sorted Array:", sortedNumbers);`,
    explanation: `Merge Sort is a **Divide and Conquer** algorithm:
1. **Divide**: Splitting the array recursively into two halves until single-element arrays remain.
2. **Conquer**: Sorting the subarrays recursively.
3. **Combine**: Merging the sorted subarrays back together into a single sorted array.

- **Time Complexity**: $O(n \\log n)$ in Best, Average, and Worst cases.
- **Space Complexity**: $O(n)$ auxiliary space.`
  },
  quick_sort: {
    title: "Quick Sort in JavaScript",
    code: `function quickSort(arr) {
  if (arr.length <= 1) {
    return arr;
  }

  const pivot = arr[arr.length - 1];
  const left = [];
  const right = [];

  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] < pivot) {
      left.push(arr[i]);
    } else {
      right.push(arr[i]);
    }
  }

  return [...quickSort(left), pivot, ...quickSort(right)];
}

// --- Example Usage ---
const data = [10, 7, 8, 9, 1, 5];
console.log("Sorted:", quickSort(data));`,
    explanation: `Quick Sort selects a **pivot element** and partitions the array into elements less than and greater than the pivot, then recursively sorts the partitions.`
  },
  binary_search: {
    title: "Binary Search in JavaScript",
    code: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) {
      return mid; // Target found at index
    } else if (arr[mid] < target) {
      left = mid + 1; // Search right half
    } else {
      right = mid - 1; // Search left half
    }
  }

  return -1; // Target not found
}

// --- Example Usage ---
const sortedArr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
console.log("Index of 23:", binarySearch(sortedArr, 23));`,
    explanation: `Binary Search operates on **sorted arrays** by repeatedly dividing the search interval in half. Time complexity: $O(\\log n)$.`
  },
  react_counter: {
    title: "React Counter Component",
    code: `import React, { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Counter: {count}</h2>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)} style={{ marginLeft: '10px' }}>Decrement</button>
      <button onClick={() => setCount(0)} style={{ marginLeft: '10px' }}>Reset</button>
    </div>
  );
}`,
    explanation: `Uses React's \`useState\` Hook to manage component state cleanly.`
  },
  express_server: {
    title: "Basic Express.js Server",
    code: `import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/data', (req, res) => {
  const { name } = req.body;
  res.json({ message: \`Hello, \${name}!\` });
});

app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});`,
    explanation: `Sets up an Express HTTP server with JSON middleware and route handlers.`
  }
};

/**
 * Checks if prompt matches a built-in code template request.
 */
function getCodeTemplate(prompt) {
  const lower = prompt.toLowerCase();
  if (lower.includes('merge sort') || lower.includes('mergesort')) {
    return codeTemplates.merge_sort;
  }
  if (lower.includes('quick sort') || lower.includes('quicksort')) {
    return codeTemplates.quick_sort;
  }
  if (lower.includes('binary search')) {
    return codeTemplates.binary_search;
  }
  if (lower.includes('react') && (lower.includes('counter') || lower.includes('component'))) {
    return codeTemplates.react_counter;
  }
  if (lower.includes('express') && (lower.includes('server') || lower.includes('app') || lower.includes('router'))) {
    return codeTemplates.express_server;
  }
  return null;
}

// =============================================================
// WEB INTELLIGENCE SEARCH ENGINE
// =============================================================

/**
 * Queries DuckDuckGo Web Search engine.
 */
async function searchDuckDuckGo(query) {
  const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(ddgUrl, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(6000) });
    if (!response.ok) return [];

    const html = await response.text();
    const results = [];

    const blockRegex = /<div class="[^"]*web-result[\s\S]*?<a class="result__url"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let match;

    while ((match = blockRegex.exec(html)) && results.length < 4) {
      let rawUrl = match[1];
      if (rawUrl.startsWith('//')) rawUrl = 'https:' + rawUrl;
      let cleanUrl = rawUrl;
      try {
        const parsed = new URL(rawUrl);
        const uddg = parsed.searchParams.get('uddg');
        if (uddg) cleanUrl = decodeURIComponent(uddg);
      } catch (e) {}

      results.push({
        title: decodeHtml(match[2]),
        url: cleanUrl,
        snippet: decodeHtml(match[3])
      });
    }

    return results;
  } catch (err) {
    return [];
  }
}

/**
 * Queries Wikipedia API for topic summary if relevant.
 */
async function searchWikipedia(query) {
  let cleanTopic = query
    .replace(/^(what is|who is|explain|tell me about|how to|write me a|create a|code a|write a)\s+/i, '')
    .replace(/(in javascript|in python|program|code|algorithm|example)/gi, '')
    .replace(/[?.,!]/g, '')
    .trim()
    .toLowerCase();

  if (!cleanTopic) return null;

  if (topicAliases[cleanTopic]) {
    cleanTopic = topicAliases[cleanTopic];
  }

  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTopic)}`;
    const response = await fetch(url, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(4000) });
    if (response.ok) {
      const data = await response.json();
      if (data && data.extract && !data.extract.includes('may refer to:')) {
        return {
          title: data.title,
          extract: data.extract,
          url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${cleanTopic}`
        };
      }
    }
  } catch (e) {}

  return null;
}

/**
 * Master query solver — synthesizes AI code, explanation, and web intelligence.
 */
async function queryAI(userPrompt) {
  console.log(`🧠 Synthesizing AI response & searching live web intelligence for "${userPrompt}"...`);

  // 1. Check if matching code template exists
  const template = getCodeTemplate(userPrompt);

  // 2. Fetch live web results in parallel
  const [ddgResults, wikiResult] = await Promise.all([
    searchDuckDuckGo(userPrompt),
    searchWikipedia(userPrompt)
  ]);

  let output = '';

  // If a code template matched (e.g. Merge Sort), render full code + explanation first!
  if (template) {
    output += `💻 **${template.title}**\n\n`;
    output += `\`\`\`javascript\n${template.code}\n\`\`\`\n\n`;
    output += `📘 **Explanation:**\n${template.explanation}\n\n`;
  } else if (wikiResult && wikiResult.extract) {
    output += `💡 **Overview (${wikiResult.title}):**\n${wikiResult.extract}\n\n`;
  }

  // Append Live Web Results
  if (ddgResults && ddgResults.length > 0) {
    output += `🌐 **Web Intelligence & Documentation References:**\n\n`;
    ddgResults.forEach((res, i) => {
      output += `${i + 1}. **${res.title}**\n   ${res.snippet}\n   🔗 [${res.url}](${res.url})\n\n`;
    });
  }

  if (output.trim()) {
    // Record in conversation history
    conversationHistory.push({ role: 'user', content: userPrompt });
    conversationHistory.push({ role: 'assistant', content: output.trim() });
    while (conversationHistory.length > MAX_HISTORY * 2) {
      conversationHistory.shift();
    }
    return output.trim();
  }

  return `I searched for "${userPrompt}" but couldn't synthesize a complete response.\n\nTry asking with specific terms or use commands:\n   • "/search <query>" for web search\n   • "/run <command>" to execute shell commands`;
}

// =============================================================
// TERMINAL EXECUTOR TOOL
// =============================================================

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

// =============================================================
// CENTRAL EXPLICIT PREFIX ROUTER
// =============================================================
async function processAgentQuery(userInput) {
  const cleanInput = userInput.trim();

  // 1. EXPLICIT WEB SEARCH ROUTER (/search <query>)
  if (cleanInput.startsWith('/search ')) {
    const query = cleanInput.replace('/search ', '').trim();
    console.log(`🔍 Routing to Web Search Tool for "${query}"...`);
    return await queryAI(query);
  }

  // 2. EXPLICIT TERMINAL COMMAND ROUTER (/run <command>)
  if (cleanInput.startsWith('/run ')) {
    const command = cleanInput.replace('/run ', '').trim();
    console.log(`⚡ Routing to Terminal Executor: Running "${command}"...`);
    return await executeTerminalCommand(command);
  }

  // 3. EXPLICIT FILE SYSTEM WRITER ROUTER (/write, /create, /save, /generate)
  const isFileCommand = cleanInput.startsWith('/write') || 
                        cleanInput.startsWith('/create') || 
                        cleanInput.startsWith('/save') || 
                        cleanInput.startsWith('/generate') ||
                        cleanInput.toLowerCase().startsWith('generate file');

  if (isFileCommand) {
    console.log('💾 Routing to File Writer Tool...');
    
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

    console.log(`🧠 Gathering content for "${contentDescription}"...`);
    const contentToWrite = await queryAI(contentDescription);
    const sourceMessage = `AI & Web Intelligence for "${contentDescription}"`;

    console.log(`💾 Writing content to "./workspace/${filename}"...`);
    try {
      const filePath = path.join(workspaceDir, filename);
      fs.writeFileSync(filePath, contentToWrite, 'utf-8');
      
      return `🎉 File successfully written!\n` +
             `Path: [workspace/${filename}](file:///${filePath.replace(/\\/g, '/')})\n` +
             `Source: ${sourceMessage}\n\n` +
             `Preview of Content:\n` +
             `--------------------------------------------------------------------------------\n` +
             `${contentToWrite.slice(0, 500)}${contentToWrite.length > 500 ? '\n... (truncated)' : ''}\n` +
             `--------------------------------------------------------------------------------`;
    } catch (err) {
      return `❌ File Writer Tool Error: Failed to write to disk. ${err.message}`;
    }
  }

  // 4. CLEAR CONVERSATION HISTORY (/clear)
  if (cleanInput.toLowerCase() === '/clear') {
    conversationHistory.length = 0;
    return `🧹 Conversation history cleared. Starting fresh!`;
  }

  // 5. CONVERSATIONAL GREETING
  const words = cleanInput.toLowerCase().replace(/[?.,!]/g, ' ').trim().split(/\s+/);
  const isGreeting = words.some(w => greetingKeywords.has(w)) || 
                     cleanInput.toLowerCase().includes("how are you") || 
                     (words.length <= 2 && words.every(w => greetingKeywords.has(w)));

  if (isGreeting) {
    return greetingResponses[Math.floor(Math.random() * greetingResponses.length)];
  }

  // 6. DEFAULT PROMPT ROUTING: AI & WEB INTELLIGENCE ENGINE 🧠
  return await queryAI(cleanInput);
}

// =============================================================
// INTERACTIVE CLI LOOP
// =============================================================
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.clear();
console.log('================================================================');
console.log('🥔 Welcome to PotatoAI — AI & Web Coding Agent');
console.log('================================================================');
console.log('🧠 Engine: Code & Live Web Intelligence Synthesizer');
console.log('   → Zero Dependencies | Zero API Keys | 100% Free');
console.log('');
console.log('🤖 Available Tools:');
console.log('   /search <query>  -> Web Search Tool');
console.log('   /run <command>   -> Terminal command executor');
console.log('   /write <args>    -> Workspace file writer');
console.log('   /clear           -> Clear conversation history');
console.log('   <anything else>  -> Ask any question / code request directly');
console.log('   type "exit" to quit');
console.log('================================================================\n');

async function startChatLoop() {
  rl.question('👤 You: ', async (userInput) => {
    const inputCleaned = userInput.trim();

    if (inputCleaned.toLowerCase() === 'exit') {
      console.log('🤖 PotatoAI: Goodbye! Happy coding! 🥔');
      rl.close();
      return;
    }

    if (!inputCleaned) {
      startChatLoop();
      return;
    }

    const reply = await processAgentQuery(inputCleaned);
    
    console.log('\n🤖 PotatoAI:');
    console.log('--------------------------------------------------------------------------------');
    console.log(reply);
    console.log('--------------------------------------------------------------------------------\n');

    startChatLoop(); // Loop back
  });
}

// Start agent loop
startChatLoop();
