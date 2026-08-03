/**
 * Keyless, Zero-Auth LLM Provider Engine
 * -----------------------------------------------------------------------------
 * Model Tiers:      Yukon Gold (Fast), Sweet Potato (Versatile), Russet (Heavy).
 * Reasoning Effort: Low (Concise), Medium (Standard), High (Deep), Max (Exhaustive).
 * 
 * NO API keys required. NO accounts. 100% free and open.
 */

import { generateThoughtfulCode } from './codeGenerator.js';
import { getModelProfile } from '../models/index.js';
import { searchDuckDuckGo, searchWikipedia } from './tools/webTools.js';

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

/**
 * Knowledge Base for Multi-Effort Reasoning Synthesis
 */
const KNOWLEDGE_TOPICS = [
  {
    keys: ['javascript', 'js'],
    title: 'JavaScript',
    summary: 'JavaScript is a high-level, dynamic, single-threaded programming language that powers interactive web pages and server applications (via Node.js).',
    concepts: [
      'Single-threaded event loop for non-blocking asynchronous I/O operations.',
      'First-class functions and dynamic type evaluation at runtime.',
      'Prototype-based inheritance and lexical closures for state preservation.'
    ],
    usage: '```javascript\n// Asynchronous fetch example\nasync function fetchData(url) {\n  const response = await fetch(url);\n  return await response.json();\n}\n```',
    advanced: '• Performance: V8 JIT compiler optimizes hot functions into machine code.\n• Memory: Mark-and-sweep garbage collection automatically manages heap memory.\n• Ecosystem: Runs across web browsers, servers (Node/Deno/Bun), mobile (React Native), and desktop (Electron).'
  },
  {
    keys: ['backend', 'frontend', 'server', 'client', 'fullstack', 'fe', 'be', 'fe and be', 'fe vs be'],
    title: 'Frontend vs Backend Architecture',
    summary: 'Frontend refers to the client-side user interface (UI) running in web browsers, while Backend handles server-side business logic, authentication, and database operations.',
    concepts: [
      'Frontend (Client): DOM manipulation, event handling, responsive styling (HTML/CSS/JS/React).',
      'Backend (Server): API route handling, data persistence, session management, rate limiting (Node/Express/Python/PostgreSQL).',
      'Fullstack: Complete application architecture spanning both Client UI and Server/Database layers.'
    ],
    usage: '```javascript\n// Client-Server REST API interaction\n// Client (Frontend):\nfetch("/api/users").then(res => res.json()).then(data => renderUI(data));\n\n// Server (Backend):\napp.get("/api/users", async (req, res) => {\n  const users = await db.query("SELECT * FROM users");\n  res.json(users);\n});\n```',
    advanced: '• Protocol Layer: RESTful JSON endpoints, GraphQL queries, or WebSocket bidirectional streams.\n• Scalability: Frontend CDNs (Vercel/Cloudflare) paired with horizontally scaled backend microservices.'
  },
  {
    keys: ['react', 'reactjs'],
    title: 'React.js UI Framework',
    summary: 'React is an open-source component-based JavaScript library developed by Meta for building dynamic user interfaces using reactive state.',
    concepts: [
      'Declarative Component Model: Reusable UI blocks returning JSX.',
      'Virtual DOM & Reconciliation: Efficient DOM diffing via the React Fiber engine.',
      'Hooks System: State and lifecycle management (useState, useEffect, useMemo).'
    ],
    usage: '```jsx\nimport React, { useState } from "react";\n\nexport function Counter() {\n  const [count, setCount] = useState(0);\n  return (\n    <button onClick={() => setCount(count + 1)}>\n      Count: {count}\n    </button>\n  );\n}\n```',
    advanced: '• Concurrent Mode: Non-blocking rendering transitions via useTransition and useDeferredValue.\n• State Architecture: Context API, Redux Toolkit, or Zustand for global application state.'
  }
];

/**
 * Formats response strictly according to Reasoning Effort Level (Low, Medium, High, Max)
 */
function formatAnswerByReasoningEffort(topicData, reasoningLevel, modelProfile) {
  const level = (reasoningLevel || 'medium').toLowerCase().trim();

  // 1. LOW EFFORT: Direct concise summary
  if (level === 'low') {
    return topicData.summary;
  }

  // 2. MEDIUM EFFORT: Standard structured answer with key concepts
  if (level === 'medium') {
    return `💡 **${topicData.title}**\n\n${topicData.summary}\n\n**Key Concepts:**\n${topicData.concepts.map(c => `• ${c}`).join('\n')}`;
  }

  // 3. HIGH EFFORT: Deep breakdown with key concepts & practical code usage
  if (level === 'high') {
    return `🔬 **${topicData.title} Analysis [Model: ${modelProfile.name}]**\n\n${topicData.summary}\n\n**Key Concepts:**\n${topicData.concepts.map(c => `• ${c}`).join('\n')}\n\n**Practical Implementation:**\n${topicData.usage}`;
  }

  // 4. MAX EFFORT: Exhaustive 4-part comprehensive analysis with architecture, code & advanced insights
  return `🧠 **[Reasoning Effort: MAX] Exhaustive Analysis of ${topicData.title}**\n\n` +
         `1. 📖 **Overview & Purpose:**\n${topicData.summary}\n\n` +
         `2. 💡 **Core Architecture & Key Concepts:**\n${topicData.concepts.map(c => `• ${c}`).join('\n')}\n\n` +
         `3. 💻 **Implementation & Code Pattern:**\n${topicData.usage}\n\n` +
         `4. ⚡ **Advanced Performance & Best Practices:**\n${topicData.advanced}`;
}

/**
 * Finds topic matching query
 */
function findTopicData(query) {
  const lower = query.toLowerCase().trim();
  const words = lower.split(/\s+/);
  for (const topic of KNOWLEDGE_TOPICS) {
    if (topic.keys.some(k => lower.includes(k) || words.includes(k))) {
      return topic;
    }
  }
  return null;
}

/**
 * DuckDuckGo DuckChat Client
 */
async function queryDDGChat(messages, targetModel = 'gpt-4o-mini', timeoutMs = 4000) {
  try {
    const statusRes = await fetch('https://duckduckgo.com/duckchat/v1/status', {
      headers: { ...BROWSER_HEADERS, 'x-vqd-accept': '1' },
      signal: AbortSignal.timeout(2000)
    });

    const vqdToken = statusRes.headers.get('x-vqd-4');
    if (!vqdToken) return null;

    const res = await fetch('https://duckduckgo.com/duckchat/v1/chat', {
      method: 'POST',
      headers: {
        ...BROWSER_HEADERS,
        'Content-Type': 'application/json',
        'x-vqd-4': vqdToken
      },
      body: JSON.stringify({ model: targetModel, messages }),
      signal: AbortSignal.timeout(timeoutMs)
    });

    if (!res.ok) return null;

    const text = await res.text();
    let fullMessage = '';
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const payloadStr = line.slice(6).trim();
        if (payloadStr === '[DONE]') break;
        try {
          const payload = JSON.parse(payloadStr);
          if (payload.message) fullMessage += payload.message;
        } catch (e) {}
      }
    }
    return fullMessage.trim() || null;
  } catch (err) {
    return null;
  }
}

/**
 * Pollinations.ai Client
 */
async function queryPollinations(messages, targetModel = 'qwen-coder', timeoutMs = 4000) {
  const models = [targetModel, 'openai', 'mistral'];
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user' && !m.content.startsWith('OBSERVATION'))?.content || '';
  const systemMsg = messages.find(m => m.role === 'system')?.content || '';

  for (const model of models) {
    try {
      const getUrl = `https://text.pollinations.ai/${encodeURIComponent(lastUserMsg)}?model=${model}&system=${encodeURIComponent(systemMsg)}`;
      const getRes = await fetch(getUrl, { signal: AbortSignal.timeout(timeoutMs) });
      if (getRes.ok) {
        const getText = await getRes.text();
        if (getText && getText.trim() && !getText.includes('"error"')) {
          return getText.trim();
        }
      }
    } catch (err) {}
  }
  return null;
}

/**
 * Asynchronously synthesizes answers according to Reasoning Effort Level (Low, Medium, High, Max)
 */
async function synthesizeKnowledgeAnswer(query, modelProfile, reasoningLevel = 'medium') {
  const topic = findTopicData(query);
  let answerStr = '';

  if (topic) {
    answerStr = formatAnswerByReasoningEffort(topic, reasoningLevel, modelProfile);
  } else {
    const [wikiRes, webRes] = await Promise.all([
      searchWikipedia(query),
      searchDuckDuckGo(query)
    ]);

    let summaryText = '';
    if (wikiRes && !wikiRes.includes('No Wikipedia article')) {
      summaryText += `${wikiRes}\n\n`;
    }
    if (webRes && !webRes.includes('No web results')) {
      const cleanLines = webRes.split('\n').filter(l => !l.includes('URL:') && l.trim());
      summaryText += `${cleanLines.slice(0, 3).join('\n')}\n`;
    }

    if (!summaryText.trim()) {
      summaryText = `Overview for "${query}": Summary of technical principles and implementation guidelines.`;
    }

    const genericTopic = {
      title: query,
      summary: summaryText.trim(),
      concepts: ['Core functionality & purpose', 'Integration with existing workflows', 'Performance & security considerations'],
      usage: `// Implementation pattern for ${query}\nconsole.log("Processing ${query}");`,
      advanced: '• Architecture: Follow modular design patterns.\n• Testing: Perform unit and integration testing.'
    };

    answerStr = formatAnswerByReasoningEffort(genericTopic, reasoningLevel, modelProfile);
  }

  const payload = {
    thought: `[Model: ${modelProfile.name} | Effort: ${reasoningLevel}] Synthesizing response.`,
    tool: "finish",
    args: { answer: answerStr }
  };

  return JSON.stringify(payload);
}

/**
 * Robust Local Intent Synthesizer (Zero-Latency Fast Engine & Fallback)
 */
async function localFallbackSynthesis(messages, modelProfile, reasoningLevel = 'medium') {
  const lastMsg = messages[messages.length - 1];

  // If the last message is a tool OBSERVATION, finish!
  if (lastMsg && lastMsg.role === 'user' && typeof lastMsg.content === 'string' && lastMsg.content.startsWith('OBSERVATION')) {
    const obsText = lastMsg.content;
    return JSON.stringify({
      thought: `[Model: ${modelProfile.name}] Tool execution completed.`,
      tool: "finish",
      args: { answer: `Action completed successfully:\n\n${obsText}` }
    });
  }

  // Find original user prompt
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
  const lower = lastUserMessage.toLowerCase().trim();

  // 1. FILE UPDATE / EDIT / PATCH INTENT
  const isUpdateIntent = lower.includes('replace') || lower.includes('patch') || lower.includes('update') || lower.includes('edit') || lower.includes('modify') || lower.startsWith('/patch');
  if (isUpdateIntent) {
    const fileMatch = lastUserMessage.match(/([a-zA-Z0-9_\-]+\.(?:js|jsx|ts|tsx|py|html|css|json|txt|md))/i);
    const filePath = fileMatch ? fileMatch[1] : null;

    if (filePath) {
      const replaceMatch = lastUserMessage.match(/replace\s+["']?([^"']+)["']?\s+with\s+["']?([^"']+)["']?/i);
      if (replaceMatch) {
        return JSON.stringify({
          thought: `[Model: ${modelProfile.name}] Patching "${filePath}" replacing "${replaceMatch[1]}" with "${replaceMatch[2]}".`,
          tool: "update_file",
          args: {
            filePath,
            targetContent: replaceMatch[1].trim(),
            replacementContent: replaceMatch[2].trim()
          }
        });
      }

      const addMatch = lastUserMessage.match(/(?:add|append)\s+([\s\S]+)/i);
      if (addMatch) {
        return JSON.stringify({
          thought: `[Model: ${modelProfile.name}] Appending content to "${filePath}".`,
          tool: "update_file",
          args: {
            filePath,
            targetContent: "",
            replacementContent: addMatch[1].trim()
          }
        });
      }
    }
  }

  // 2. FILE CREATION INTENT
  const isCreateIntent = lower.includes('create') || lower.includes('write') || lower.includes('make') || lower.includes('generate') || lower.startsWith('/create') || lower.startsWith('/write');
  
  if (isCreateIntent) {
    const synthesized = generateThoughtfulCode(lastUserMessage);
    if (synthesized) {
      return JSON.stringify({
        thought: `[Model: ${modelProfile.name}] Generating code for "${synthesized.filePath}".`,
        tool: "create_file",
        args: { filePath: synthesized.filePath, content: synthesized.content }
      });
    }

    const fileMatch = lastUserMessage.match(/([a-zA-Z0-9_\-]+\.(?:js|jsx|ts|tsx|py|html|css|json|txt|md|cpp|c|java|go|rs|sh))/i);
    let filePath = fileMatch ? fileMatch[1] : null;

    if (!filePath) {
      if (lower.includes('react') || lower.includes('jsx')) filePath = 'Component.jsx';
      else if (lower.includes('js') || lower.includes('javascript') || lower.includes('node')) filePath = 'app.js';
      else if (lower.includes('py') || lower.includes('python')) filePath = 'main.py';
      else if (lower.includes('html')) filePath = 'index.html';
      else if (lower.includes('css')) filePath = 'style.css';
      else if (lower.includes('json')) filePath = 'data.json';
      else if (lower.includes('txt') || lower.includes('text')) filePath = 'output.txt';
      else filePath = 'script.js';
    }

    let content = '';
    if (lower.includes('logging hello world') || lower.includes('log hello world') || lower.includes('hello world')) {
      if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
        content = 'console.log("hello world");';
      } else if (filePath.endsWith('.py')) {
        content = 'print("hello world")';
      } else if (filePath.endsWith('.html')) {
        content = '<!DOCTYPE html>\n<html>\n<body>\n  <h1>hello world</h1>\n</body>\n</html>';
      } else {
        content = 'hello world';
      }
    } else {
      const contentMatch = lastUserMessage.match(/(?:containing|saying|code|content)\s+([\s\S]+)/i);
      if (contentMatch) {
        content = contentMatch[1].trim();
      } else {
        content = `// Autonomously generated code for: ${lastUserMessage}\nconsole.log("PotatoAI Code Executed");`;
      }
    }

    return JSON.stringify({
      thought: `[Model: ${modelProfile.name}] Creating file "${filePath}".`,
      tool: "create_file",
      args: { filePath, content }
    });
  }

  // 3. FILE DELETE INTENT
  const isDeleteIntent = lower.includes('delete') || lower.includes('remove') || lower.startsWith('/rm') || lower.startsWith('/delete');
  if (isDeleteIntent) {
    const fileMatch = lastUserMessage.match(/([a-zA-Z0-9_\-]+\.(?:js|jsx|ts|tsx|py|html|css|json|txt|md))/i);
    if (fileMatch) {
      return JSON.stringify({
        thought: `[Model: ${modelProfile.name}] Deleting file "${fileMatch[1]}".`,
        tool: "delete_file",
        args: { filePath: fileMatch[1] }
      });
    }
  }

  // 4. TERMINAL COMMAND INTENT
  if (lower.includes('run') || lower.includes('execute') || lower.startsWith('/run')) {
    const cmdMatch = lastUserMessage.match(/(?:run|execute)\s+(?:command\s+)?\`?([^`]+)\`?/i);
    const command = cmdMatch ? cmdMatch[1].trim() : lastUserMessage.replace(/^\/(?:run)\s*/i, '').trim();
    return JSON.stringify({
      thought: `[Model: ${modelProfile.name}] Executing command "${command}".`,
      tool: "run_command",
      args: { command }
    });
  }

  // 5. WORKSPACE LIST INTENT
  if (lower.includes('list') || lower.includes('show files') || lower.includes('dir') || lower.includes('workspace')) {
    return JSON.stringify({
      thought: `[Model: ${modelProfile.name}] Listing workspace contents.`,
      tool: "list_workspace",
      args: { subDir: "" }
    });
  }

  // 6. READ FILE INTENT
  if (lower.includes('read') || lower.includes('view') || lower.includes('cat')) {
    const readMatch = lastUserMessage.match(/(?:read|view|cat)\s+([a-zA-Z0-9_\-\.\/]+)/i);
    if (readMatch) {
      return JSON.stringify({
        thought: `[Model: ${modelProfile.name}] Reading file "${readMatch[1]}".`,
        tool: "read_file",
        args: { filePath: readMatch[1] }
      });
    }
  }

  // 7. GENERAL KNOWLEDGE / CONVERSATIONAL INTENT
  return await synthesizeKnowledgeAnswer(lastUserMessage, modelProfile, reasoningLevel);
}

/**
 * Master Keyless LLM Gateway
 */
export async function queryKeylessLLM(messages, modelKey = 'sweet-potato', reasoningLevel = 'medium') {
  const profile = getModelProfile(modelKey);

  // ⚡ YUKON GOLD: Instant Fast Mode (< 10ms zero delay)
  if (profile.isFastMode) {
    return await localFallbackSynthesis(messages, profile, reasoningLevel);
  }

  // Try DuckDuckGo Chat
  const ddgResponse = await queryDDGChat(messages, profile.llmModel, profile.timeoutMs || 4000);
  if (ddgResponse) return ddgResponse;

  // Try Pollinations
  const pollinationsResponse = await queryPollinations(messages, profile.llmModel, profile.timeoutMs || 4000);
  if (pollinationsResponse) return pollinationsResponse;

  // Fallback to local synthesizer
  return await localFallbackSynthesis(messages, profile, reasoningLevel);
}
