import { meta, config, inputSchema, outputSchema, type MarkdownInput, type MarkdownOutput } from './meta';

// Simple markdown to HTML converter
function parseMarkdown(md: string): string {
  let html = md;

  // Escape HTML first
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (```...```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`;
  });

  // Inline code (`...`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  html = html.replace(/^######\s+(.*)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.*)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.*)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Strikethrough
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Blockquotes
  html = html.replace(/^&gt;\s+(.*)$/gm, '<blockquote>$1</blockquote>');
  // Merge consecutive blockquotes
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

  // Horizontal rules
  html = html.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '<hr>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Unordered lists
  html = html.replace(/^[\*\-\+]\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>\n${match}</ul>\n`);

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>');
  // Wrap consecutive li elements in ol
  let lastHtml = '';
  while (lastHtml !== html) {
    lastHtml = html;
    html = html.replace(/(<li>.*<\/li>\n?)(?!<ul>|<\/ul>|<ol>|<\/ol>)(<li>)/g, '$1$2');
  }

  // Tables
  html = html.replace(/^\|(.+)\|$/gm, (_, content) => {
    const cells = content.split('|').map((c: string) => c.trim());
    return `<tr>${cells.map((c: string) => `<td>${c}</td>`).join('')}</tr>`;
  });
  html = html.replace(/(<tr>.*<\/tr>\n?)+/g, (match) => {
    // Check if first row might be header (contains dashes like |---|---|)
    const rows = match.split('\n').filter(Boolean);
    if (rows.length > 1 && rows[1].includes('---')) {
      const headerRow = rows[0].replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>');
      const bodyRows = rows.slice(2).join('\n');
      return `<table><thead>${headerRow}</thead><tbody>\n${bodyRows}</tbody></table>\n`;
    }
    return `<table><tbody>${match}</tbody></table>\n`;
  });
  // Remove separator rows
  html = html.replace(/<tr><td>-+<\/td>(<td>-+<\/td>)*<\/tr>/g, '');

  // Paragraphs - wrap remaining text
  const lines = html.split('\n');
  const result: string[] = [];
  let inParagraph = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const isBlockElement = /^<(h[1-6]|ul|ol|li|blockquote|pre|hr|table|thead|tbody|tr|td|th|\/)/i.test(trimmed);

    if (!trimmed) {
      if (inParagraph) {
        result.push('</p>');
        inParagraph = false;
      }
      result.push('');
    } else if (isBlockElement) {
      if (inParagraph) {
        result.push('</p>');
        inParagraph = false;
      }
      result.push(line);
    } else {
      if (!inParagraph) {
        result.push('<p>');
        inParagraph = true;
      }
      result.push(trimmed);
    }
  }

  if (inParagraph) {
    result.push('</p>');
  }

  html = result.join('\n');

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html.trim();
}

function run(input: MarkdownInput): MarkdownOutput {
  try {
    const { markdown } = input;

    if (!markdown.trim()) {
      return {
        success: true,
        html: '',
      };
    }

    const html = parseMarkdown(markdown);

    return {
      success: true,
      html,
    };
  } catch (err) {
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : 'Markdown parsing failed' },
    };
  }
}

export const markdownTool = {
  meta,
  inputSchema,
  outputSchema,
  run,
};

export { meta, config, inputSchema, outputSchema };
export type { MarkdownInput, MarkdownOutput };
