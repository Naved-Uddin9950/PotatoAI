/**
 * Smart Code & Component Generator Module
 * -----------------------------------------------------------------------------
 * Generates production-ready code for components, servers, utilities, and scripts
 * when given natural language requirements (e.g. "React navbar with inline styling").
 */

/**
 * Generates a full React Navbar component with inline styles.
 */
export function generateReactNavbar(options = {}) {
  return `import React, { useState } from 'react';

export default function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const styles = {
    nav: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2rem',
      backgroundColor: '#1e1e2e',
      color: '#cdd6f4',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
    },
    brand: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#cba6f7',
      textDecoration: 'none',
      letterSpacing: '0.5px',
    },
    navLinks: {
      display: 'flex',
      alignItems: 'center',
      gap: '1.75rem',
      listStyle: 'none',
      margin: 0,
      padding: 0,
    },
    link: {
      color: '#cdd6f4',
      textDecoration: 'none',
      fontSize: '0.95rem',
      fontWeight: '500',
      transition: 'color 0.2s ease',
    },
    primaryBtn: {
      backgroundColor: '#89b4fa',
      color: '#11111b',
      border: 'none',
      padding: '0.55rem 1.25rem',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '0.9rem',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease, transform 0.1s ease',
    }
  };

  return (
    <nav style={styles.nav}>
      <a href="#" style={styles.brand}>PotatoAI</a>
      
      <ul style={styles.navLinks}>
        <li><a href="#home" style={styles.link}>Home</a></li>
        <li><a href="#features" style={styles.link}>Features</a></li>
        <li><a href="#pricing" style={styles.link}>Pricing</a></li>
        <li><a href="#about" style={styles.link}>About Us</a></li>
      </ul>

      <button style={styles.primaryBtn} onClick={() => alert('Get Started Clicked!')}>
        Get Started
      </button>
    </nav>
  );
}
`;
}

/**
 * Generates a React Counter component with state and inline styling.
 */
export function generateReactCounter() {
  return `import React, { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    borderRadius: '12px',
    backgroundColor: '#282c34',
    color: '#ffffff',
    fontFamily: 'sans-serif',
    maxWidth: '300px',
    margin: '2rem auto',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
  };

  const buttonStyle = {
    padding: '0.5rem 1rem',
    margin: '0.5rem',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#61dafb',
    color: '#000000',
    fontWeight: 'bold',
    cursor: 'pointer'
  };

  return (
    <div style={containerStyle}>
      <h2>Counter: {count}</h2>
      <div>
        <button style={buttonStyle} onClick={() => setCount(count + 1)}>Increment</button>
        <button style={buttonStyle} onClick={() => setCount(count - 1)}>Decrement</button>
        <button style={{ ...buttonStyle, backgroundColor: '#ff6b6b', color: '#fff' }} onClick={() => setCount(0)}>Reset</button>
      </div>
    </div>
  );
}
`;
}

/**
 * Generates a basic Express.js REST API server.
 */
export function generateExpressServer() {
  return `import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Sample Data Endpoint
app.get('/api/items', (req, res) => {
  res.json([
    { id: 1, name: 'PotatoAI Agent' },
    { id: 2, name: 'Autonomous Workspace Tools' }
  ]);
});

app.listen(PORT, () => {
  console.log(\`🚀 Express server running on http://localhost:\${PORT}\`);
});
`;
}

/**
 * Synthesizes code for a generic component or file request based on keywords.
 */
export function generateThoughtfulCode(prompt) {
  const lower = prompt.toLowerCase();

  // 1. React Navbar / Navigation Component
  if ((lower.includes('react') || lower.includes('jsx')) && (lower.includes('navbar') || lower.includes('nav') || lower.includes('navigation'))) {
    return {
      filePath: 'Navbar.jsx',
      content: generateReactNavbar()
    };
  }

  // 2. React Counter Component
  if ((lower.includes('react') || lower.includes('jsx')) && (lower.includes('counter') || lower.includes('state'))) {
    return {
      filePath: 'Counter.jsx',
      content: generateReactCounter()
    };
  }

  // 3. Generic React Component
  if (lower.includes('react') || lower.includes('jsx') || lower.includes('component')) {
    const compMatch = prompt.match(/(?:component|react)\s+(?:named\s+)?\(?([a-zA-Z0-9_]+)\)?/i);
    const rawName = compMatch ? compMatch[1] : 'Component';
    const compName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    
    const content = `import React from 'react';

export default function ${compName}() {
  const styles = {
    container: {
      padding: '1.5rem',
      borderRadius: '8px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #e9ecef',
      fontFamily: 'sans-serif'
    }
  };

  return (
    <div style={styles.container}>
      <h2>${compName} Component</h2>
      <p>Generated by PotatoAI Autonomous Agent.</p>
    </div>
  );
}
`;
    return {
      filePath: `${compName}.jsx`,
      content
    };
  }

  // 4. Express Server
  if (lower.includes('express') || lower.includes('rest api') || (lower.includes('node') && lower.includes('server'))) {
    return {
      filePath: 'server.js',
      content: generateExpressServer()
    };
  }

  // 5. HTML Boilerplate
  if (lower.includes('html') || lower.includes('webpage') || lower.includes('index.html')) {
    return {
      filePath: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PotatoAI Web Page</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 2rem;
      background-color: #0f172a;
      color: #f8fafc;
    }
    .card {
      background-color: #1e293b;
      padding: 2rem;
      border-radius: 12px;
      max-width: 600px;
      margin: auto;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🥔 Hello from PotatoAI!</h1>
    <p>This web page was autonomously generated with clean semantic HTML and modern CSS styling.</p>
  </div>
</body>
</html>`
    };
  }

  // Default Fallback
  return null;
}
