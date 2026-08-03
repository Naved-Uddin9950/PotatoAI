const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

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

/**
 * DuckDuckGo Web Search Engine.
 */
export async function searchDuckDuckGo(query) {
  const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(ddgUrl, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(7000) });
    if (!response.ok) return `❌ Search failed with HTTP status ${response.status}`;

    const html = await response.text();
    const results = [];
    const blockRegex = /<div class="[^"]*web-result[\s\S]*?<a class="result__url"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let match;

    while ((match = blockRegex.exec(html)) && results.length < 5) {
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

    if (results.length === 0) {
      return `No web results found for "${query}".`;
    }

    let output = `🌐 Search Results for "${query}":\n\n`;
    results.forEach((res, i) => {
      output += `${i + 1}. **${res.title}**\n   URL: ${res.url}\n   Snippet: ${res.snippet}\n\n`;
    });
    return output.trim();
  } catch (err) {
    return `❌ Web search error: ${err.message}`;
  }
}

/**
 * Fetches text content from a web URL for reading online docs.
 */
export async function fetchWebPage(url) {
  try {
    const response = await fetch(url, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      return `❌ Failed to fetch web page: HTTP ${response.status}`;
    }

    const html = await response.text();
    // Simple HTML to text extraction
    const cleanText = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '\n')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    const truncated = cleanText.length > 3000 ? cleanText.slice(0, 3000) + '\n... (truncated page content)' : cleanText;
    return `📄 Page Content from ${url}:\n\n${truncated}`;
  } catch (err) {
    return `❌ Failed to fetch page content: ${err.message}`;
  }
}

/**
 * Wikipedia summary fetcher.
 */
export async function searchWikipedia(topic) {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`;
    const response = await fetch(url, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(5000) });
    if (response.ok) {
      const data = await response.json();
      if (data && data.extract) {
        return `💡 Wikipedia (${data.title}):\n${data.extract}\nURL: ${data.content_urls?.desktop?.page || url}`;
      }
    }
    return `No Wikipedia article found for "${topic}".`;
  } catch (err) {
    return `Wikipedia lookup failed: ${err.message}`;
  }
}
