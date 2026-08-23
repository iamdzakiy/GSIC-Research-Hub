"use client";

import { Fragment } from "react";

/**
 * Lightweight markdown renderer supporting:
 * - ## / ### headings
 * - - bullet lists
 * - 1. numbered lists
 * - **bold**, *italic*
 * - [text](url) links
 * - > blockquotes
 */
export default function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = () => {
    if (listItems.length === 0 || !listType) return;
    const items = listItems.map((item, i) => (
      <li key={i} className="text-white/70 leading-relaxed">
        {renderInline(item)}
      </li>
    ));
    blocks.push(
      listType === "ul" ? (
        <ul key={`ul-${blocks.length}`} className="list-disc list-inside space-y-1.5 mb-4">
          {items}
        </ul>
      ) : (
        <ol key={`ol-${blocks.length}`} className="list-decimal list-inside space-y-1.5 mb-4">
          {items}
        </ol>
      )
    );
    listItems = [];
    listType = null;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("### ")) {
      flushList();
      blocks.push(
        <h3 key={idx} className="text-base font-bold font-heading text-white mt-5 mb-2">
          {renderInline(trimmed.slice(4))}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      flushList();
      blocks.push(
        <h2 key={idx} className="text-lg font-bold font-heading text-white mt-6 mb-3 pb-2 border-b border-white/10">
          {renderInline(trimmed.slice(3))}
        </h2>
      );
    } else if (trimmed.startsWith("- ")) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listItems.push(trimmed.slice(2));
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listItems.push(trimmed.replace(/^\d+\.\s/, ""));
    } else if (trimmed.startsWith("> ")) {
      flushList();
      blocks.push(
        <blockquote key={idx} className="border-l-4 border-[#5CE3B6]/50 bg-[#5CE3B6]/5 pl-4 pr-3 py-2 rounded-r-lg mb-4 text-white/60 italic">
          {renderInline(trimmed.slice(2))}
        </blockquote>
      );
    } else if (trimmed === "") {
      flushList();
    } else {
      flushList();
      blocks.push(
        <p key={idx} className="text-white/70 leading-relaxed mb-3">
          {renderInline(trimmed)}
        </p>
      );
    }
  });
  flushList();

  return <div>{blocks}</div>;
}

function renderInline(text: string): React.ReactNode {
  // Split by links, bold, italic
  const parts: React.ReactNode[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>);
    }
    if (match[1] && match[2]) {
      parts.push(
        <a key={key++} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-[#5CE3B6] hover:underline">
          {match[1]}
        </a>
      );
    } else if (match[3]) {
      parts.push(<strong key={key++} className="font-semibold text-white">{match[3]}</strong>);
    } else if (match[4]) {
      parts.push(<em key={key++}>{match[4]}</em>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }
  return parts;
}