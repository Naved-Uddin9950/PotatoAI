/**
 * 🥔 PotatoAI: Code-Aware Intent-Response Router Chatbot
 * -------------------------------------------------------------
 * This script implements a markdown-aware Intent-Response Router:
 * 1. Reads structured dataset files split by '@@@'.
 * 2. Scans queries for code request keywords ("code", "example", "write", etc.).
 * 3. Prioritizes matching blocks containing markdown code wrappers (```).
 * 4. Routes greetings and simple queries straight to basic_conversation.txt.
 * 5. Prints raw markdown content directly preserving formatting.
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

// Raw content blocks map loaded on startup
const topicBlocks = {};

console.log('🤖 Loading datasets and configuring Intent-Response Router...');

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
  console.log('✅ Router configuration complete! AI is online.\n');
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
 * Checks if the user's prompt is a basic conversational greeting or question.
 * @param {string} userInput 
 * @returns {boolean}
 */
function isGreetingOrGeneral(userInput) {
  const words = userInput.toLowerCase().replace(/[?.,!]/g, ' ').trim().split(/\s+/);
  
  // Shortcut if user types a known greeting keyword
  if (words.some(word => greetingKeywords.has(word))) {
    return true;
  }

  // Shortcut if the query matches general phrases
  const phrase = words.join(' ');
  if (phrase.includes("how are you") || phrase.includes("who are you") || phrase.includes("what is your name")) {
    return true;
  }

  // Shortcut if the cleaned query has no search terms left
  const cleaned = cleanQuery(userInput);
  if (cleaned.length === 0) {
    return true;
  }

  return false;
}

/**
 * Extracts and compiles a structured Markdown block based on query matches.
 * Prioritizes blocks with code if "code", "example", etc. are present in the query.
 * @param {string} userInput 
 * @param {string} topic 
 * @returns {string} The matching documentation Markdown block
 */
function getDocumentationBlock(userInput, topic) {
  const blocks = topicBlocks[topic];
  if (!blocks || blocks.length === 0) return "";

  const queryTokens = cleanQuery(userInput);
  const inputWords = userInput.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z0-9]/g, ''));
  
  // Define keywords indicating a request for code/examples
  const codeKeywords = new Set(["code", "example", "write", "generate", "complete", "snippet"]);
  const requestsCode = inputWords.some(word => codeKeywords.has(word));

  // Score each block based on matching keyword hits
  const scored = blocks.map((block, index) => {
    const blockLower = block.toLowerCase();
    let score = 0;
    
    // Match query keywords
    for (const token of queryTokens) {
      if (blockLower.includes(token)) {
        score++;
      }
    }

    // Boost score if user requested code and the block contains a markdown code block
    if (requestsCode && blockLower.includes("```")) {
      score += 15; // Apply code boost priority
    }

    return { index, block, score };
  });

  // Sort by match density descending
  scored.sort((a, b) => b.score - a.score);

  // Return the highest scoring block directly (fallback to first block if no matches)
  return scored[0].block;
}

// INTENT ROUTER PIPELINE
function processUserQuery(userInput) {
  const inputCleaned = userInput.trim();

  if (inputCleaned === '') {
    return "I didn't catch that. Could you type a question?";
  }

  // 1. CONVERSATIONAL DIRECT ROUTE
  if (isGreetingOrGeneral(inputCleaned)) {
    const convSentences = topicBlocks['basic_conversation'];
    if (convSentences && convSentences.length > 0) {
      return convSentences[Math.floor(Math.random() * convSentences.length)];
    }
    return "Hello! How can I help you today?";
  }

  // 2. TECHNICAL ROUTING
  const queryTokens = cleanQuery(inputCleaned);
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

  // 3. DOCUMENTATION EXTRACT ROUTE & FALLBACK
  if (maxHits > 0 && bestTopic) {
    return getDocumentationBlock(inputCleaned, bestTopic);
  }

  // Clean fallback listing available topics
  const availableTopics = Object.keys(techTopics)
    .map(topic => `   • ${topic}`)
    .join('\n');

  return `I'm sorry, I couldn't find a strong match for your query.
    
I am trained on the following topics:
${availableTopics}

Please try asking a question containing keywords related to these subjects!`;
}

// CONTINUOUS INTERACTIVE CLI
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('================================================================');
console.log('🥔 Welcome to PotatoAI Chatbot - Code-Aware Intent Router');
console.log('================================================================');
console.log('Ask me anything about React, .NET, Express, or Testing!');
console.log('Type "exit" to quit.');
console.log('================================================================');

function startChatLoop() {
  rl.question('\n👤 You: ', (userInput) => {
    const inputCleaned = userInput.trim();

    if (inputCleaned.toLowerCase() === 'exit') {
      console.log('🤖 PotatoAI: Goodbye! Happy coding!');
      rl.close();
      return;
    }

    const reply = processUserQuery(inputCleaned);
    
    // Clean, premium UI borders - preserves markdown formatting exactly
    console.log('\n🤖 PotatoAI:');
    console.log('--------------------------------------------------------------------------------');
    console.log(reply);
    console.log('--------------------------------------------------------------------------------');

    startChatLoop(); // Loop back
  });
}

// Start CLI
startChatLoop();
