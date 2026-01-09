import React from 'react';
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

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

// Advanced text formatter supporting colors C(color)[text]C, opacity O(0.5)[text]O, size S(xl)[text]S
export function renderFormattedText(text: string, allowCustomColor: boolean = true) {
    if (!text) return null;

    return text.split('\n').map((line, i) => {
        if (line.trim() === '') {
            return React.createElement('br', { key: i });
        }

        const parts = line.split(/(C\([a-zA-Z0-9#]+\)\[.*?\]C|O\([0-9.]+\)\[.*?\]O|S\([a-z0-9-]+\)\[.*?\]S|\*\*.*?\*\*|\*.*?\*)/g);

        const children = parts.map((part, j) => {
            // Color: C(red)[text]C
            const colorMatch = part.match(/^C\(([a-zA-Z0-9#]+)\)\[(.*?)\]C$/);
            if (colorMatch) {
                const color = colorMatch[1];
                const content = colorMatch[2];
                return React.createElement('span', { key: j, style: allowCustomColor ? { color: color } : {} }, content);
            }

            // Opacity: O(0.5)[text]O
            const opacityMatch = part.match(/^O\(([0-9.]+)\)\[(.*?)\]O$/);
            if (opacityMatch) {
                const opacity = parseFloat(opacityMatch[1]);
                const content = opacityMatch[2];
                return React.createElement('span', { key: j, style: { opacity: isNaN(opacity) ? 1 : opacity } }, content);
            }

            // Size: S(xl)[text]S or S(20px)[text]S - using Tailwind classes for standard sizes if possible, or style
            const sizeMatch = part.match(/^S\(([a-z0-9-]+)\)\[(.*?)\]S$/);
            if (sizeMatch) {
                const size = sizeMatch[1]; // e.g., 'xl', 'sm', '2xl'
                const content = sizeMatch[2];
                // basic mapping for tailwind sizes, or pass through if it looks like a class
                const validSizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];
                const className = validSizes.includes(size) ? `text-${size}` : undefined;
                return React.createElement('span', { key: j, className: className }, content);
            }

            if (part.startsWith('**') && part.endsWith('**')) {
                return React.createElement('strong', { key: j }, part.slice(2, -2));
            }
            if (part.startsWith('*') && part.endsWith('*')) {
                return React.createElement('em', { key: j }, part.slice(1, -1));
            }
            return part;
        });

        return React.createElement('p', { key: i, className: "mb-1 min-h-[1.5em]" }, children);
    });
}
