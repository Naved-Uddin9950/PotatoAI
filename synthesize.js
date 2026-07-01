import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const datasetsDir = path.join(__dirname, 'datasets');

if (!fs.existsSync(datasetsDir)) {
  fs.mkdirSync(datasetsDir, { recursive: true });
}

// Sentence generation engine
function generateUniqueSentences(templates, parts, count) {
  const sentences = new Set();
  let attempts = 0;
  
  while (sentences.size < count && attempts < 150000) {
    attempts++;
    const template = templates[Math.floor(Math.random() * templates.length)];
    let sentence = template;
    const matches = template.match(/\[[a-zA-Z0-9_]+\]/g) || [];
    for (const match of matches) {
      const key = match.slice(1, -1).toLowerCase();
      const actualKey = Object.keys(parts).find(k => k.toLowerCase() === key);
      const list = actualKey ? parts[actualKey] : null;
      if (list) {
        const word = list[Math.floor(Math.random() * list.length)];
        sentence = sentence.replace(match, word);
      }
    }
    // Formatting: capitalized starting letter and sentence ending punctuation
    sentence = sentence.trim();
    sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    if (!/[.!?]$/.test(sentence)) {
      sentence += '.';
    }
    
    sentences.add(sentence);
  }
  
  return Array.from(sentences);
}

// 1. Basic Conversation config (Expanded vocabulary to easily reach 1,000 unique combinations)
const convTemplates = [
  "[Greeting] [extra]",
  "[Greeting], how can I help you [time]?",
  "I am [description] and [status].",
  "[Greeting], let's talk about [topic] [time].",
  "What is your favorite [subject]? I like [favorite_subject].",
  "[Polite] [extra]"
];
const convParts = {
  Greeting: [
    "Hi", "Hello", "Hey", "Greetings", "Yo", "Howdy", "Hi there", "Hey there", 
    "Good day", "Good morning", "Good evening", "Hiya", "What's up", "Heya", 
    "Welcome", "How is it going", "Glad you are here"
  ],
  extra: [
    "How are you today?", "Nice to meet you.", "Hope you are doing well.", 
    "It is a pleasure to meet you.", "I am happy to chat with you.", "How can I assist you?", 
    "Let's code something cool!", "Great to connect with you.", "I am eager to chat.", 
    "What is on your mind?", "How is your project going?", "Let me know what you need.", 
    "Ask me any coding question."
  ],
  time: [
    "today", "right now", "this afternoon", "at this moment", "this evening", 
    "this morning", "tonight", "currently", "at present"
  ],
  description: [
    "a simple AI chatbot", "a lightweight Node.js script", "a custom NLP brain", 
    "your programming assistant", "a helper running locally on your PC",
    "a simple conversational bot", "a rule-based AI", "a Node script running on a potato PC", 
    "a lightweight program", "your virtual developer friend"
  ],
  status: [
    "ready to assist", "running smoothly", "listening to your questions", 
    "fully operational", "excited to learn more", "waiting for input", 
    "ready to talk code", "listening carefully", "up and running", "feeling great"
  ],
  topic: [
    "React", "Express", ".NET Core", "RTL testing", "JavaScript", "full-stack development",
    "Node.js", "C#", "programming", "databases"
  ],
  subject: ["programming language", "backend framework", "testing framework", "frontend library", "code style"],
  favorite_subject: ["JavaScript", "C#", "Express.js", "React components", "clean code design"],
  polite: ["Thank you for asking.", "I appreciate your message.", "That is a great query.", "I am always here to talk.", "Let me help you with that."]
};

// 2. ReactJS config
const reactTemplates = [
  "[Subject] [verb] [object] to [benefit].",
  "[Subject] is [adjective] for [benefit].",
  "In React, [subject] [verb] [object].",
  "We use [subject] when we want to [benefit] in the UI.",
  "[Subject] [verb] [object] dynamically."
];
const reactParts = {
  Subject: ["React components", "The Virtual DOM", "React state", "Hooks like useState", "useEffect hook", "Context API", "Redux store", "JSX syntax", "Props passing", "React Router", "Next.js pages", "Tailwind CSS components"],
  verb: ["manages", "updates", "renders", "coordinates", "simplifies", "optimizes", "controls", "handles", "restructures", "synchronizes", "re-renders"],
  object: ["the user interface", "the application state", "DOM elements", "component lifecycle events", "dynamic UI changes", "state updates", "props data", "styles and layouts", "event handling lists"],
  benefit: ["achieve higher performance", "make development faster", "ensure code modularity", "improve rendering speed", "simplify debugging", "provide a smooth user experience", "keep the UI responsive", "avoid unnecessary renders"],
  adjective: ["essential", "critical", "helpful", "perfect", "highly optimized", "extremely popular", "great", "powerful", "standard"]
};

// 3. .NET config
const netTemplates = [
  "[Subject] [verb] [object] to [benefit].",
  "[Subject] is [adjective] for [benefit].",
  "In .NET development, [subject] [verb] [object].",
  "We build [subject] to [benefit] on the backend.",
  "[Subject] [verb] [object] securely."
];
const netParts = {
  Subject: ["C# programming", "ASP.NET Core", "Entity Framework Core", "Web APIs", "The CLR runtime", "Dependency injection", "LINQ queries", "Enterprise microservices", "Middleware components", "JWT authentication", "SQL Server integration"],
  verb: ["powers", "compiles", "manages", "secures", "optimizes", "handles", "structures", "interfaces with", "exposes", "validates", "executes"],
  object: ["backend business logic", "database transactions", "RESTful endpoints", "HTTP request processing", "high-performance servers", "application configurations", "user authentication flows", "JSON payloads"],
  benefit: ["deliver secure services", "provide enterprise performance", "reduce database latency", "ensure cross-platform support", "support millions of users", "integrate databases easily", "build modular API structures"],
  adjective: ["incredibly fast", "highly secure", "extremely scalable", "industry-standard", "strongly-typed", "robust", "developer-friendly", "highly efficient"]
};

// 4. Express config
const expressTemplates = [
  "[Subject] [verb] [object] in Node.js.",
  "[Subject] is [adjective] to [benefit] in server apps.",
  "Express [subject] [verb] [object] effectively.",
  "We write [subject] to [benefit] in Express.",
  "[Subject] [verb] [object] on the server."
];
const expressParts = {
  Subject: ["Express routing", "Custom middleware", "HTTP request objects", "Response send methods", "Node.js runtime", "The V8 engine", "Non-blocking event loop", "CORS middleware", "Body parser settings", "REST APIs", "Static file serving"],
  verb: ["directs", "handles", "processes", "modifies", "executes", "optimizes", "registers", "listens to", "parses", "validates", "responds to"],
  object: ["incoming client requests", "outgoing HTTP responses", "server-side variables", "middleware chains", "API endpoints", "asynchronous tasks", "database client requests", "JSON data payloads"],
  benefit: ["keep servers lightweight", "streamline backend development", "handle high traffic load", "avoid callback hell", "manage routing cleanly", "process requests asynchronously", "build REST endpoints quickly"],
  adjective: ["lightweight", "minimalist", "unopinionated", "extremely fast", "flexible", "highly asynchronous", "easy to set up"]
};

// 5. Testing config
const testingTemplates = [
  "[Subject] [verb] [object] to [benefit].",
  "[Subject] is [adjective] to [benefit].",
  "In test suites, [subject] [verb] [object].",
  "We write [subject] to [benefit] before release.",
  "[Subject] [verb] [object] automatically."
];
const testingParts = {
  Subject: ["Unit testing", "Integration testing", "Jest test runners", "React Testing Library", "Mock functions", "End-to-end assertions", "Code coverage reports", "Snapshot testing", "DOM assertions", "Component rendering tests"],
  verb: ["verifies", "guarantees", "simulates", "validates", "checks", "isolates", "prevents bugs in", "monitors", "captures", "tracks"],
  object: ["application correctness", "component UI logic", "API response structures", "database mock data", "user click events", "form input validations", "network request payloads", "system integration flows"],
  benefit: ["avoid production bugs", "maintain refactoring confidence", "ensure high software quality", "speed up deployment cycles", "verify component rendering", "test edge cases safely", "document code behavior"],
  adjective: ["absolutely crucial", "highly recommended", "extremely automated", "essential", "helpful", "standard practice"]
};

// Generate and write all files
const datasets = [
  { file: 'basic_conversation.txt', templates: convTemplates, parts: convParts },
  { file: 'reactjs.txt', templates: reactTemplates, parts: reactParts },
  { file: 'dotnet.txt', templates: netTemplates, parts: netParts },
  { file: 'express.txt', templates: expressTemplates, parts: expressParts },
  { file: 'testing.txt', templates: testingTemplates, parts: testingParts }
];

console.log('🌱 Starting synthesis of 1,000 sentences per dataset file...');

for (const data of datasets) {
  const filePath = path.join(datasetsDir, data.file);
  const sentences = generateUniqueSentences(data.templates, data.parts, 1000);
  
  fs.writeFileSync(filePath, sentences.join('\n'), 'utf-8');
  console.log(` ✅ Generated ${sentences.length} unique sentences in: ${data.file}`);
}

console.log('🎉 Dataset synthesis complete!');
