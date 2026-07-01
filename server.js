/**
 * 🥔 PotatoAI: Probabilistic Trigram Markov Generator with Semantic Topic Routing
 * -------------------------------------------------------------------------------
 * This script implements a hybrid conversational AI:
 * 1. Conversational Queries are routed directly to natural sentences in basic_conversation.txt.
 * 2. Technical Queries are routed to a Probabilistic Trigram/Bigram Markov Chain trained dynamically.
 * 3. Markov generation seeds itself with user query words and generates clean paragraphs.
 * 4. Punctuation tracking is used to end sentences naturally and prevent repetitive loops.
 */

import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const datasetsDir = path.join(__dirname, 'datasets');

// TOPIC-SPECIFIC TRIGRAM/BIGRAM MARKOV CHAIN
class TopicMarkovChain {
  constructor() {
    this.bigrams = {};      // w1 -> [w2, w3...]
    this.trigrams = {};     // "w1|w2" -> [w3, w4...]
    this.startPairs = [];   // [[w1, w2], [w3, w4]...]
  }

  /**
   * Train the Markov model on an array of sentences.
   * @param {string[]} sentences 
   */
  train(sentences) {
    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/).filter(w => w.length > 0);
      if (words.length < 2) {
        if (words.length === 1) {
          const w = words[0];
          if (!this.bigrams[w]) this.bigrams[w] = [];
        }
        continue;
      }

      // Record sentence starting word pair
      this.startPairs.push([words[0], words[1]]);

      for (let i = 0; i < words.length - 1; i++) {
        const w1 = words[i];
        const w2 = words[i + 1];

        // 1. Build Bigram Map
        if (!this.bigrams[w1]) {
          this.bigrams[w1] = [];
        }
        this.bigrams[w1].push(w2);

        // 2. Build Trigram Map (requires 3 consecutive words)
        if (i < words.length - 2) {
          const w3 = words[i + 2];
          const key = `${w1}|${w2}`;
          if (!this.trigrams[key]) {
            this.trigrams[key] = [];
          }
          this.trigrams[key].push(w3);
        }
      }
    }
  }

  /**
   * Dynamically generate a brand new sentence seeded by user query.
   * @param {string|null} seedWord 
   * @param {number} maxWords 
   * @returns {string} The generated sentence
   */
  generateSentence(seedWord = null, maxWords = 22) {
    let w1 = null;
    let w2 = null;

    if (seedWord) {
      const normalizedSeed = seedWord.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Check if seed word starts any sentence in training data
      const matchingPairs = this.startPairs.filter(pair => 
        pair[0].toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedSeed
      );

      if (matchingPairs.length > 0) {
        const selectedPair = matchingPairs[Math.floor(Math.random() * matchingPairs.length)];
        w1 = selectedPair[0];
        w2 = selectedPair[1];
      } else {
        // Fallback to checking bigram dictionary keys
        const keys = Object.keys(this.bigrams);
        const match = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedSeed);
        if (match) {
          w1 = match;
          const pool = this.bigrams[match];
          w2 = pool[Math.floor(Math.random() * pool.length)];
        }
      }
    }

    // Fallback if no matching seeds found or provided
    if (!w1 || !w2) {
      if (this.startPairs.length > 0) {
        const selectedPair = this.startPairs[Math.floor(Math.random() * this.startPairs.length)];
        w1 = selectedPair[0];
        w2 = selectedPair[1];
      } else {
        return "";
      }
    }

    const sentence = [w1, w2];

    // If starting pair has sentence-terminating punctuation, end early
    if (/[.!?]$/.test(w2)) {
      return sentence.join(' ');
    }

    for (let i = 0; i < maxWords - 2; i++) {
      const trigramKey = `${w1}|${w2}`;
      let nextWord = null;

      // 1. Query Trigram dictionary (high context)
      if (this.trigrams[trigramKey] && this.trigrams[trigramKey].length > 0) {
        const pool = this.trigrams[trigramKey];
        nextWord = pool[Math.floor(Math.random() * pool.length)];
      } 
      // 2. Query Bigram dictionary fallback (medium context)
      else if (this.bigrams[w2] && this.bigrams[w2].length > 0) {
        const pool = this.bigrams[w2];
        nextWord = pool[Math.floor(Math.random() * pool.length)];
      }

      if (!nextWord) break; // Dead end

      sentence.push(nextWord);

      // Track punctuation to finish naturally
      if (/[.!?]$/.test(nextWord)) {
        break;
      }

      w1 = w2;
      w2 = nextWord;
    }

    let result = sentence.join(' ');
    if (!/[.!?]$/.test(result)) {
      result += '.';
    }
    return result;
  }

  /**
   * Generates a brand-new fluid paragraph consisting of multiple sentences.
   * @param {string|null} seedWord 
   * @param {number} minSentences 
   * @param {number} maxSentences 
   * @returns {string} Integrated paragraph response
   */
  generateParagraph(seedWord, minSentences = 3, maxSentences = 5) {
    const totalSentences = Math.floor(Math.random() * (maxSentences - minSentences + 1)) + minSentences;
    const list = [];

    // First sentence seeded by user inquiry term
    list.push(this.generateSentence(seedWord));

    // Follow-up sentences generated from random starting pairs to mimic continuous discussion
    for (let i = 1; i < totalSentences; i++) {
      list.push(this.generateSentence(null));
    }

    return list.join(' ');
  }
}

// 1. TOPIC DEFINITIONS AND KEYWORDS
const topics = {
  greeting: {
    fileName: 'basic_conversation.txt',
    keywords: ["hi", "hello", "hey", "greetings", "yo", "howdy", "sup", "welcome", "name", "who", "yourself", "bot", "chatbot", "ai", "are", "you", "how", "doing", "is"],
    brain: null // No Markov Chain generation needed (routed directly to conversational lines)
  },
  react: {
    fileName: 'reactjs.txt',
    keywords: ["react", "reactjs", "component", "components", "hook", "hooks", "usestate", "useeffect", "dom", "redux", "router", "tailwind", "frontend"],
    brain: new TopicMarkovChain()
  },
  dotnet: {
    fileName: 'dotnet.txt',
    keywords: ["dotnet", ".net", "c#", "csharp", "microsoft", "api", "apis", "backend", "entity", "ef", "framework", "enterprise"],
    brain: new TopicMarkovChain()
  },
  express: {
    fileName: 'express.txt',
    keywords: ["express", "expressjs", "routing", "middleware", "node", "nodejs", "server", "cors", "port", "request", "response"],
    brain: new TopicMarkovChain()
  },
  testing: {
    fileName: 'testing.txt',
    keywords: ["test", "testing", "jest", "mock", "mocking", "rtl", "assertions", "coverage", "unit", "integration"],
    brain: new TopicMarkovChain()
  }
};

// Holds the loaded raw sentences for reference and direct conversation routing
const topicSentences = {};

// DYNAMIC FILE READER & MARKOV TRAINING
console.log('🤖 Loading datasets and compiling probabilistic Markov brains...');

try {
  for (const [topicName, topicInfo] of Object.entries(topics)) {
    const filePath = path.join(datasetsDir, topicInfo.fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing dataset file: ${topicInfo.fileName}. Run 'node synthesize.js' to generate them.`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const sentences = content
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    topicSentences[topicName] = sentences;

    if (topicInfo.brain) {
      topicInfo.brain.train(sentences);
      console.log(` 📂 Trained Markov brain: [${topicName.toUpperCase()}] (${sentences.length} sentences)`);
    } else {
      console.log(` 📂 Loaded Conversational dataset: [${topicName.toUpperCase()}] (${sentences.length} sentences)`);
    }
  }
  console.log('✅ Training complete! AI is ready.\n');
} catch (error) {
  console.error('❌ Training error:', error.message);
  process.exit(1);
}

// 3. SEMANTIC TOPIC ROUTING & GENERATION PIPELINE
function processUserQuery(userInput) {
  const inputWords = userInput
    .toLowerCase()
    .replace(/[?.,!]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0);

  if (inputWords.length === 0) {
    return "I didn't catch that. Could you type a question?";
  }

  let bestTopic = null;
  let maxHits = 0;

  // Intent classification based on weighted keyword matching
  for (const [topicName, topicInfo] of Object.entries(topics)) {
    let hits = 0;
    for (const word of inputWords) {
      if (topicInfo.keywords.includes(word)) {
        hits++;
      }
    }

    // Give tech topics a higher weight priority to avoid greeting bias on tech questions
    if (topicName !== 'greeting' && hits > 0) {
      hits += 5;
    }

    if (hits > maxHits) {
      maxHits = hits;
      bestTopic = topicName;
    }
  }

  // Fallback router
  if (maxHits === 0 || !bestTopic) {
    const availableTopics = Object.keys(topics)
      .map(t => `   • ${t}`)
      .join('\n');

    return `I am not sure about that. I can discuss the following topics:\n${availableTopics}\n\nTry asking: "What is React?" or "How to test with RTL?"`;
  }

  // 3. CONVERSATIONAL ROUTER
  if (bestTopic === 'greeting') {
    const sentences = topicSentences['greeting'];
    if (sentences && sentences.length > 0) {
      // Pick a natural human response directly from basic_conversation.txt
      return sentences[Math.floor(Math.random() * sentences.length)];
    }
    return "Hello! How can I help you today?";
  }

  // 2. TECH MARKOV GENERATOR
  // Attempt to find a seed word from user input to launch the sentence generation
  let seedWord = null;
  const targetBrain = topics[bestTopic].brain;

  for (const word of inputWords) {
    const keys = Object.keys(targetBrain.bigrams);
    const match = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === word);
    if (match) {
      seedWord = match;
      break;
    }
  }

  // Generate a structured, probabilistic paragraph (3-5 sentences)
  return targetBrain.generateParagraph(seedWord, 3, 5);
}

// CONTINUOUS INTERACTIVE CLI
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('================================================================');
console.log('🥔 Welcome to PotatoAI Chatbot - Trigram Probabilistic Model');
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
    
    // Beautiful clean UI
    console.log('🤖 PotatoAI:');
    console.log('--------------------------------------------------------------------------------');
    console.log(reply);
    console.log('--------------------------------------------------------------------------------');

    startChatLoop(); // Loop back
  });
}

// Start CLI
startChatLoop();
