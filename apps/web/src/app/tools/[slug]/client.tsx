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

interface ToolConfig {
  name: string;
  description: string;
  modes: { id: string; label: string }[];
  placeholder: string;
}

interface ToolPageClientProps {
  slug: string;
  config: ToolConfig;
  relatedTools: { id: string; name: string; description: string; icon: string }[];
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
};

export function ToolPageClient({ slug, config, relatedTools, initialInput, initialMode }: ToolPageClientProps) {
  const ToolComponent = TOOL_COMPONENTS[slug];

  if (!ToolComponent) {
    return (
      <div className="tool-page">
        <div className="tool-info">
          <h1>Tool Not Found</h1>
          <p>The tool "{slug}" is not available yet.</p>
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
