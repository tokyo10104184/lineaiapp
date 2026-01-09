import React from 'react';
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function renderFormattedText(text: string) {
    if (!text) return null;

    // Simple markdown parser for bold (**text**) and italics (*text*) and newlines
    // Also handles emotional cues like [感情:...] if needed, but cleanAIReply handles that usually.

    // Split by newlines first
    return text.split('\n').map((line, i) => {
        if (line.trim() === '') {
            return React.createElement('br', { key: i });
        }

        // Process line for formatting
        const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);

        const children = parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return React.createElement('strong', { key: j }, part.slice(2, -2));
            }
            if (part.startsWith('*') && part.endsWith('*')) {
                return React.createElement('em', { key: j }, part.slice(1, -1));
            }
            return part;
        });

        return React.createElement('p', { key: i, className: "mb-1" }, children);
    });
}

export const getOrCreateAnonymousUserId = (): string => {
  if (typeof window === 'undefined') return '';
  let userId = localStorage.getItem('kint_anon_user_id');
  if (!userId) {
    // Simple random ID generation to avoid 'uuid' package issues in this environment
    userId = 'anon-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('kint_anon_user_id', userId);
  }
  return userId;
};
