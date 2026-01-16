// Tool Registry - Central export of all tools
import { base64Tool, config as base64Config } from './base64';
import { timestampTool, config as timestampConfig } from './timestamp';
import { jsonTool, config as jsonConfig } from './json';
import { jwtTool, config as jwtConfig } from './jwt';
import { urlTool, config as urlConfig } from './url';
import { hashTool, config as hashConfig } from './hash';
import { uuidTool, config as uuidConfig } from './uuid';
import { regexTool, config as regexConfig } from './regex';
import { colorTool, config as colorConfig } from './color';
import type { Tool, ToolMeta } from '@ovenir/core';

// Re-export types
export type { Tool, ToolMeta } from '@ovenir/core';

// Tool UI config type
export interface ToolUIConfig {
  name: string;
  description: string;
  modes: { id: string; label: string }[];
  placeholder: string;
}

// All tools
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const tools: Record<string, Tool<any, any>> = {
  base64: base64Tool,
  timestamp: timestampTool,
  json: jsonTool,
  jwt: jwtTool,
  url: urlTool,
  hash: hashTool,
  uuid: uuidTool,
  regex: regexTool,
  color: colorTool,
};

// All UI configs
export const toolConfigs: Record<string, ToolUIConfig> = {
  base64: base64Config,
  timestamp: timestampConfig,
  json: jsonConfig,
  jwt: jwtConfig,
  url: urlConfig,
  hash: hashConfig,
  uuid: uuidConfig,
  regex: regexConfig,
  color: colorConfig,
};

// Helpers
export const getToolById = (id: string) => tools[id] ?? null;
export const getToolConfig = (id: string) => toolConfigs[id] ?? null;
export const getAllTools = () => Object.values(tools);
export const getAllToolsMeta = () => Object.values(tools).map(t => t.meta);
export const getAllToolIds = () => Object.keys(tools);

// Export individual tools
export { base64Tool } from './base64';
export { timestampTool } from './timestamp';
export { jsonTool } from './json';
export { jwtTool } from './jwt';
export { urlTool } from './url';
export { hashTool } from './hash';
export { uuidTool } from './uuid';
export { regexTool } from './regex';
export { colorTool } from './color';
