import { z } from 'zod';
import type { Tool } from '@ovenir/core';
import { meta, config } from './meta';

const inputSchema = z.object({
  mode: z.enum(['format', 'minify']),
  xml: z.string(),
  indent: z.number(),
});

const outputSchema = z.object({
  success: z.boolean(),
  output: z.string().optional(),
  error: z.object({
    message: z.string(),
    line: z.number().optional(),
    column: z.number().optional(),
  }).optional(),
  stats: z.object({
    elements: z.number(),
    attributes: z.number(),
    textNodes: z.number(),
  }).optional(),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function parseXml(xmlString: string): { doc: Document; error: string | null } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    return { doc, error: parseError.textContent || 'Invalid XML' };
  }

  return { doc, error: null };
}

function countElements(node: Node): { elements: number; attributes: number; textNodes: number } {
  let elements = 0;
  let attributes = 0;
  let textNodes = 0;

  function traverse(n: Node) {
    if (n.nodeType === Node.ELEMENT_NODE) {
      elements++;
      const el = n as Element;
      attributes += el.attributes.length;
    } else if (n.nodeType === Node.TEXT_NODE && n.textContent?.trim()) {
      textNodes++;
    }

    n.childNodes.forEach(traverse);
  }

  traverse(node);
  return { elements, attributes, textNodes };
}

function formatXml(xmlString: string, indent: number): string {
  const { doc, error } = parseXml(xmlString);
  if (error) throw new Error(error);

  const indentStr = ' '.repeat(indent);
  let result = '';
  let depth = 0;

  function serializeNode(node: Node): string {
    let output = '';

    if (node.nodeType === Node.DOCUMENT_NODE) {
      node.childNodes.forEach(child => {
        output += serializeNode(child);
      });
    } else if (node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
      const pi = node as ProcessingInstruction;
      output += `<?${pi.target} ${pi.data}?>\n`;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tagIndent = indentStr.repeat(depth);

      output += `${tagIndent}<${el.tagName}`;

      // Add attributes
      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i];
        output += ` ${attr.name}="${escapeXml(attr.value)}"`;
      }

      if (el.childNodes.length === 0) {
        output += '/>\n';
      } else if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
        const text = el.childNodes[0].textContent?.trim() || '';
        if (text) {
          output += `>${escapeXml(text)}</${el.tagName}>\n`;
        } else {
          output += '/>\n';
        }
      } else {
        output += '>\n';
        depth++;
        el.childNodes.forEach(child => {
          if (child.nodeType !== Node.TEXT_NODE || child.textContent?.trim()) {
            output += serializeNode(child);
          }
        });
        depth--;
        output += `${tagIndent}</${el.tagName}>\n`;
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        output += `${indentStr.repeat(depth)}${escapeXml(text)}\n`;
      }
    } else if (node.nodeType === Node.COMMENT_NODE) {
      output += `${indentStr.repeat(depth)}<!--${node.textContent}-->\n`;
    } else if (node.nodeType === Node.CDATA_SECTION_NODE) {
      output += `${indentStr.repeat(depth)}<![CDATA[${node.textContent}]]>\n`;
    }

    return output;
  }

  result = serializeNode(doc);
  return result.trim();
}

function minifyXml(xmlString: string): string {
  const { doc, error } = parseXml(xmlString);
  if (error) throw new Error(error);

  function serializeNode(node: Node): string {
    let output = '';

    if (node.nodeType === Node.DOCUMENT_NODE) {
      node.childNodes.forEach(child => {
        output += serializeNode(child);
      });
    } else if (node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
      const pi = node as ProcessingInstruction;
      output += `<?${pi.target} ${pi.data}?>`;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      output += `<${el.tagName}`;

      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i];
        output += ` ${attr.name}="${escapeXml(attr.value)}"`;
      }

      if (el.childNodes.length === 0) {
        output += '/>';
      } else {
        output += '>';
        el.childNodes.forEach(child => {
          output += serializeNode(child);
        });
        output += `</${el.tagName}>`;
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        output += escapeXml(text);
      }
    } else if (node.nodeType === Node.COMMENT_NODE) {
      output += `<!--${node.textContent}-->`;
    } else if (node.nodeType === Node.CDATA_SECTION_NODE) {
      output += `<![CDATA[${node.textContent}]]>`;
    }

    return output;
  }

  return serializeNode(doc);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function run(input: Input): Output {
  const { mode, xml, indent } = input;

  if (!xml.trim()) {
    return { success: true, output: '' };
  }

  try {
    const { doc, error } = parseXml(xml);

    if (error) {
      // Try to extract line/column from error message
      const lineMatch = error.match(/line (\d+)/i);
      const colMatch = error.match(/column (\d+)/i);

      return {
        success: false,
        error: {
          message: error,
          line: lineMatch ? parseInt(lineMatch[1]) : undefined,
          column: colMatch ? parseInt(colMatch[1]) : undefined,
        },
      };
    }

    const stats = countElements(doc);
    let output: string;

    if (mode === 'format') {
      output = formatXml(xml, indent);
    } else {
      output = minifyXml(xml);
    }

    return {
      success: true,
      output,
      stats,
    };
  } catch (err) {
    return {
      success: false,
      error: {
        message: err instanceof Error ? err.message : 'Unknown error',
      },
    };
  }
}

export const xmlTool: Tool<Input, Output> = {
  meta,
  inputSchema,
  outputSchema,
  run,
};

export { meta, config };
export default xmlTool;
