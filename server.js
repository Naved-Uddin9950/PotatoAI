/**
 * 🥔 PotatoAI: Advanced TF-IDF Vector Classifier Chatbot
 * -------------------------------------------------------------
 * This script solves classification and query indexing issues by:
 * 1. Filtering stop words for topic detection but falling back if input is stop-word only.
 * 2. Using two tokenization levels: stop-word filtered and stemmed only (for sentence lookup).
 * 3. Enforcing dynamic paragraphs flow-sorted by document line order.
 * 4. Cleaning terminal UI for presentation.
 */

import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import natural from 'natural';

const { TfIdf, WordTokenizer, PorterStemmer } = natural;
const tokenizer = new WordTokenizer();

// Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const datasetsDir = path.join(__dirname, 'datasets');

// Common English stopwords to filter out before classification
const stopwords = new Set([
  "what", "is", "can", "you", "please", "tell", "me", "about", "a", "an", "the", 
  "to", "in", "on", "at", "for", "with", "of", "and", "or", "but", "if", "then", 
  "how", "why", "are", "do", "does", "did", "have", "has", "had", "would", "should", 
  "could", "your", "my", "our", "their", "his", "her", "its", "i", "we", "they", "he", 
  "she", "it", "this", "that", "these", "those", "explain"
]);

// Explicit technical keyword boosts to avoid the Basic Conversation Trap
const topicBoosts = {
  reactjs: ["react", "reactjs", "jsx", "hook", "component", "components", "redux", "usestate", "useeffect", "state", "virtual"],
  dotnet: ["dotnet", ".net", "c#", "csharp", "entity", "ef", "mssql", "microsoft", "api", "apis", "backend"],
  express: ["express", "expressjs", "routing", "middleware", "cors", "body-parser", "port", "endpoint", "endpoints", "server", "node"],
  testing: ["test", "testing", "jest", "mock", "rtl", "assertion", "coverage", "unit", "integration", "mocks"]
};

// Pre-stem the topic boost keywords for fast matching
const stemmedTopicBoosts = {};
for (const [topic, keywords] of Object.entries(topicBoosts)) {
  stemmedTopicBoosts[topic] = keywords.map(kw => PorterStemmer.stem(kw.toLowerCase()));
}

// Holds the raw sentences for each topic file to allow sentence-level extraction
const topicSentences = {};
const primaryTfidf = new TfIdf();

/**
 * Tokenizes and stems only (retains stopwords for natural sentence matching).
 * @param {string} text 
 * @returns {string[]} Stemmed tokens
 */
function stemOnly(text) {
  const tokens = tokenizer.tokenize(text.toLowerCase());
  return tokens.map(token => PorterStemmer.stem(token));
}

/**
 * Tokenizes, filters out stop words, and stems a given string of text.
 * @param {string} text 
 * @returns {string[]} Filtered and stemmed tokens
 */
function cleanAndStem(text) {
  const tokens = tokenizer.tokenize(text.toLowerCase());
  return tokens
    .filter(token => !stopwords.has(token))
    .map(token => PorterStemmer.stem(token));
}

// DYNAMIC FILE READER & PRIMARY TF-IDF TRAINING
console.log('🤖 Initializing TF-IDF Vector Space...');

try {
  const files = fs.readdirSync(datasetsDir).filter(file => file.endsWith('.txt'));

  if (files.length === 0) {
    throw new Error('No dataset files (.txt) found in datasets/ folder. Please run synthesize.js first.');
  }

  for (const file of files) {
    const topicName = path.basename(file, '.txt');
    const filePath = path.join(datasetsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Parse the file into raw sentences
    const sentences = content
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    topicSentences[topicName] = sentences;

    // Index only stemmed non-stopwords for topic classification
    const stemmedDocumentTokens = cleanAndStem(content);
    primaryTfidf.addDocument(stemmedDocumentTokens, topicName);

    console.log(` 📂 Loaded & Indexed: ${file} (${sentences.length} sentences)`);
  }

  console.log('✅ TF-IDF indexing complete!\n');
} catch (error) {
  console.error('❌ Initialization error:', error.message);
  process.exit(1);
}

/**
 * Extracts the most relevant sentences in a topic and sorts them based on 
 * their original order in the file (flow-sorting) to build a natural paragraph.
 * @param {string} userInput Raw user input query.
 * @param {string} topic Name of the matching topic.
 * @param {number} maxSentences Limit of sentences to extract.
 * @returns {string} The final aggregated paragraph.
 */
function extractRelevantParagraph(userInput, topic, maxSentences) {
  const sentences = topicSentences[topic];
  if (!sentences || sentences.length === 0) return "";

  // For sentence matching inside the document, we use stemOnly (keep stopwords)
  // so that conversational phrases match correctly, and TF-IDF's IDF naturally dampens
  // common technical words.
  const queryTokens = stemOnly(userInput);

  const sentenceTfidf = new TfIdf();
  sentences.forEach((sentence, index) => {
    const stemmedSentence = stemOnly(sentence);
    sentenceTfidf.addDocument(stemmedSentence, String(index));
  });

  const scoredSentences = [];
  sentenceTfidf.tfidfs(queryTokens, (index, score) => {
    scoredSentences.push({
      index: Number(index),
      sentence: sentences[Number(index)],
      score: score
    });
  });

  // Filter out sentences that have zero keyword overlaps
  let candidates = scoredSentences.filter(item => item.score > 0);

  // Sort by similarity score descending to find the top matching sentences
  candidates.sort((a, b) => b.score - a.score);

  // Grab the top matching sentences
  const selected = candidates.slice(0, maxSentences);

  // Flow-Sorting: Re-sort selected sentences by their original line order in the file
  selected.sort((a, b) => a.index - b.index);

  if (selected.length === 0) {
    return sentences.slice(0, maxSentences).join(' ');
  }

  return selected.map(item => item.sentence).join(' ');
}

// INTENT CLASSIFICATION & RESPONSE PIPELINE
function processUserQuery(userInput) {
  let queryTokens = cleanAndStem(userInput);

  // Fallback: If everything gets filtered as a stopword (e.g. "how are you ?"), 
  // fall back to raw stemming without stopword filtering so it can match conversation.
  if (queryTokens.length === 0) {
    queryTokens = stemOnly(userInput);
  }

  if (queryTokens.length === 0) {
    return "I didn't catch that. Could you type a question?";
  }

  let bestTopic = null;
  let highestScore = 0;
  const scores = [];

  // Query the primary TF-IDF vector space
  primaryTfidf.tfidfs(queryTokens, (index, measure, key) => {
    let finalScore = measure;

    // Apply strict keyword boosting
    if (stemmedTopicBoosts[key]) {
      for (const qToken of queryTokens) {
        if (stemmedTopicBoosts[key].includes(qToken)) {
          finalScore += 25.0; // Apply a massive boost for explicit technical keywords
        }
      }
    }

    scores.push({ topic: key, score: finalScore });
    
    if (finalScore > highestScore) {
      highestScore = finalScore;
      bestTopic = key;
    }
  });

  // FALLBACK ROUTER (Threshold check)
  const CONFIDENCE_THRESHOLD = 0.2;

  if (highestScore < CONFIDENCE_THRESHOLD || !bestTopic) {
    const availableTopics = Object.keys(topicSentences)
      .map(topic => `   • ${topic}`)
      .join('\n');

    return `I'm sorry, I couldn't find a strong match for your query.
    
I am trained on the following topics:
${availableTopics}

Please try asking a question containing keywords related to these subjects!`;
  }

  // Determine Response Length
  // - Small Input (<= 2 words or basic conversation): Return 1 sentence
  // - Medium/Large Input: Extract between 3 to 5 sentences and chain them into a paragraph
  const isSmallInput = tokenizer.tokenize(userInput).length <= 2 || bestTopic === 'basic_conversation';
  let maxSentences = 1;

  if (!isSmallInput) {
    // Calculate how many sentences match query tokens in the matching file
    const allMatches = topicSentences[bestTopic].filter(sentence => {
      const sentenceTokens = stemOnly(sentence);
      return queryTokens.some(token => sentenceTokens.includes(token));
    });

    // Enforce 3 to 5 sentences for detailed technical answers
    if (allMatches.length >= 5) {
      maxSentences = 5;
    } else if (allMatches.length >= 3) {
      maxSentences = 3;
    } else {
      maxSentences = Math.max(2, allMatches.length);
    }
  }

  // Extract relevant paragraph with original file flow ordering
  const responseParagraph = extractRelevantParagraph(userInput, bestTopic, maxSentences);

  return responseParagraph;
}

// CONTINUOUS INTERACTIVE CLI
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('================================================================');
console.log('🥔 Welcome to PotatoAI Chatbot - Strict TF-IDF Keyword Weighting');
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
    
    // Clean Output UI formatting
    console.log('🤖 PotatoAI:');
    console.log('--------------------------------------------------------------------------------');
    console.log(reply);
    console.log('--------------------------------------------------------------------------------');

    startChatLoop(); // Loop back
  });
}

// Start CLI
startChatLoop();
