import React from 'react';
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const getOrCreateAnonymousUserId = (): string => {
  if (typeof window === 'undefined') return '';
  let userId = localStorage.getItem('kint_anon_user_id');

  if (!userId || !isUUID(userId)) {
      // Generate new UUID
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          userId = crypto.randomUUID();
      } else {
          // Fallback for older browsers
          userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
      }
      localStorage.setItem('kint_anon_user_id', userId);
  }
  return userId;
};

// Pre-process custom markup tags (Color, Opacity, Size) into HTML spans before Markdown parsing
function preprocessCustomTags(text: string, allowCustomColor: boolean = true): string {
    if (!text) return '';

    return text.replace(/(C\([a-zA-Z0-9#]+\)\[.*?\]C|O\([0-9.]+\)\[.*?\]O|S\([a-z0-9-]+\)\[.*?\]S)/g, (match) => {
        // Color: C(red)[text]C
        const colorMatch = match.match(/^C\(([a-zA-Z0-9#]+)\)\[(.*?)\]C$/);
        if (colorMatch) {
            const color = colorMatch[1];
            const content = colorMatch[2];
            if (!allowCustomColor) return content;
            return `<span style="color: ${color}">${content}</span>`;
        }

        // Opacity: O(0.5)[text]O
        const opacityMatch = match.match(/^O\(([0-9.]+)\)\[(.*?)\]O$/);
        if (opacityMatch) {
            const opacity = parseFloat(opacityMatch[1]);
            const content = opacityMatch[2];
            const validOpacity = isNaN(opacity) ? 1 : opacity;
            return `<span style="opacity: ${validOpacity}">${content}</span>`;
        }

        // Size: S(xl)[text]S
        const sizeMatch = match.match(/^S\(([a-z0-9-]+)\)\[(.*?)\]S$/);
        if (sizeMatch) {
            const size = sizeMatch[1];
            const content = sizeMatch[2];
            const validSizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];
            const className = validSizes.includes(size) ? `text-${size}` : '';
            return `<span class="${className}">${content}</span>`;
        }

        return match;
    });
}

// Markdown renderer supporting standard Markdown syntax (bold, italic, lists, code blocks, tables, blockquotes, links)
// and custom formatting syntax.
export function renderFormattedText(text: string | undefined, allowCustomColor: boolean = true) {
    if (!text) return null;

    const processedText = preprocessCustomTags(text, allowCustomColor);

    return (
        <div className="markdown-content">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-500 hover:text-indigo-600 underline font-medium break-all"
                        >
                            {children}
                        </a>
                    ),
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="text-sm">{children}</li>,
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-slate-300 dark:border-slate-600 pl-3 py-1 my-2 italic text-slate-600 dark:text-slate-300">
                            {children}
                        </blockquote>
                    ),
                    code({ className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !match && !String(children).includes('\n');
                        if (isInline) {
                            return (
                                <code
                                    className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded text-xs font-mono"
                                    {...props}
                                >
                                    {children}
                                </code>
                            );
                        }
                        return (
                            <div className="my-2 overflow-x-auto rounded-lg bg-slate-800 text-slate-100 p-3 text-xs font-mono">
                                <pre className="whitespace-pre">
                                    <code>{children}</code>
                                </pre>
                            </div>
                        );
                    },
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-2">
                            <table className="min-w-full divide-y divide-slate-300 dark:divide-slate-700 border border-slate-300 dark:border-slate-700 text-xs">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => <thead className="bg-slate-100 dark:bg-slate-800">{children}</thead>,
                    tbody: ({ children }) => <tbody className="divide-y divide-slate-200 dark:divide-slate-800">{children}</tbody>,
                    tr: ({ children }) => <tr>{children}</tr>,
                    th: ({ children }) => <th className="px-3 py-2 text-left font-semibold">{children}</th>,
                    td: ({ children }) => <td className="px-3 py-2">{children}</td>,
                    h1: ({ children }) => <h1 className="text-lg font-bold my-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-bold my-1.5">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-bold my-1">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-sm font-semibold my-1">{children}</h4>,
                }}
            >
                {processedText}
            </ReactMarkdown>
        </div>
    );
}
