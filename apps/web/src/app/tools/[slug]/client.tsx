'use client';

import Link from 'next/link';
import { ArrowLeft, Sparkles, Github, ExternalLink } from 'lucide-react';
import { Base64Tool } from '@/components/tools/base64-tool';
import { TimestampTool } from '@/components/tools/timestamp-tool';
import { JsonTool } from '@/components/tools/json-tool';
import { JwtTool } from '@/components/tools/jwt-tool';
import { UrlTool } from '@/components/tools/url-tool';
import { HashTool } from '@/components/tools/hash-tool';
import { UuidTool } from '@/components/tools/uuid-tool';
import { RegexTool } from '@/components/tools/regex-tool';
import { ColorTool } from '@/components/tools/color-tool';
import { DiffTool } from '@/components/tools/diff-tool';
import { MarkdownTool } from '@/components/tools/markdown-tool';
import { PasswordTool } from '@/components/tools/password-tool';
import { BaseConverterTool } from '@/components/tools/base-converter-tool';
import { LoremTool } from '@/components/tools/lorem-tool';
import { YamlTool } from '@/components/tools/yaml-tool';
import { CronTool } from '@/components/tools/cron-tool';
import { SqlTool } from '@/components/tools/sql-tool';
import { QrCodeTool } from '@/components/tools/qrcode-tool';
import { CaseTool } from '@/components/tools/case-tool';
import { HtmlTool } from '@/components/tools/html-tool';
import { SlugTool } from '@/components/tools/slug-tool';
import { XmlTool } from '@/components/tools/xml-tool';

interface ToolConfig {
  name: string;
  description: string;
  modes: { id: string; label: string }[];
  placeholder: string;
}

interface ToolPageClientProps {
  slug: string;
  config: ToolConfig;
  initialInput?: string;
  initialMode?: string;
}

// Tool component props
interface ToolComponentProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

// Tool component registry
const TOOL_COMPONENTS: Record<string, React.ComponentType<ToolComponentProps>> = {
  base64: Base64Tool,
  timestamp: TimestampTool,
  json: JsonTool,
  jwt: JwtTool,
  url: UrlTool,
  hash: HashTool,
  uuid: UuidTool,
  regex: RegexTool,
  color: ColorTool,
  diff: DiffTool,
  markdown: MarkdownTool,
  password: PasswordTool,
  'base-converter': BaseConverterTool,
  lorem: LoremTool,
  yaml: YamlTool,
  cron: CronTool,
  sql: SqlTool,
  qrcode: QrCodeTool,
  case: CaseTool,
  html: HtmlTool,
  slug: SlugTool,
  xml: XmlTool,
};

export function ToolPageClient({ slug, config, initialInput, initialMode }: ToolPageClientProps) {
  const ToolComponent = TOOL_COMPONENTS[slug];

  if (!ToolComponent) {
    return (
      <div className="tool-page">
        <div className="tool-info">
          <h1>Tool Not Found</h1>
          <p>The tool &quot;{slug}&quot; is not available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Background */}
      <div className="bg-wrap">
        <div className="bg-base" />
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
        <div className="bg-orb bg-orb-4" />
        <div className="bg-mesh" />
        <div className="bg-noise" />
      </div>

      <div className="app">
        <div className="tool-page">
          {/* Header */}
          <header className="tool-header">
            <Link href="/" className="back-link">
              <ArrowLeft className="w-5 h-5" />
              <span>All tools</span>
            </Link>

            <div className="brand-mini">
              <div className="brand-mark-mini">
                <Sparkles className="w-4 h-4" />
              </div>
              <span>OVENIR</span>
            </div>

            <a
              href={`https://github.com/ovenirdev/ovenir/tree/main/packages/tools/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="source-link"
            >
              <Github className="w-4 h-4" />
              <span>Source</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </header>

          {/* Tool Info */}
          <div className="tool-info">
            <h1>{config.name}</h1>
            <p>{config.description}</p>
          </div>

          {/* Tool Component */}
          <ToolComponent slug={slug} initialInput={initialInput} initialMode={initialMode} />

          {/* Footer */}
          <footer className="tool-footer">
            <span>100% local</span>
            <span>•</span>
            <span>Privacy-first</span>
            <span>•</span>
            <span>Open source</span>
          </footer>
        </div>
      </div>
    </>
  );
}
