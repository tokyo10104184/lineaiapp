import React from 'react';

export const renderFormattedText = (text: string | undefined, allowCustomColor: boolean): React.ReactNode => {
    if (!text) return null;

    // Order matters for regex: check ** first, then *
    const regex = /(\*\*[\s\S]*?\*\*|\*[\s\S]*?\*|S\[[\s\S]*?\]S|L\[[\s\S]*?\]L|O\([0-9.]+\)\[[\s\S]*?\]O|C\(.+?\)\[[\s\S]*?\]C)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Bold: **text**
      if (part.startsWith('**') && part.endsWith('**')) {
        if (part.length > 4) { // Valid bold **text**
          return <strong key={index}>{renderFormattedText(part.substring(2, part.length - 2), allowCustomColor)}</strong>;
        } else if (part === '****') {
          return <strong key={index}></strong>;
        }
        // Malformed like "**" or "***", or if it's content of italic like *text**
        return part;
      }

      // Italic: *text*
      // This is checked AFTER bold to correctly handle ***text*** as <strong><em>text</em></strong>
      else if (part.startsWith('*') && part.endsWith('*')) {
        if (part.length > 2) { // Valid italic *t*
          return <em key={index}>{renderFormattedText(part.substring(1, part.length - 1), allowCustomColor)}</em>;
        }
        // Malformed like "*" or if it's part of bold like **text*
        return part;
      }

      // Small: S[text]S
      else if (part.startsWith('S[') && part.endsWith(']S') && part.length >= 4) { // S[]S is length 4
        const content = part.substring(2, part.length - 2);
        return <span key={index} style={{ fontSize: '0.8em' }}>{renderFormattedText(content, allowCustomColor)}</span>;
      }

      // Large: L[text]L
      if (part.startsWith('L[') && part.endsWith(']L') && part.length >= 4) { // L[]L is length 4
        const content = part.substring(2, part.length - 2);
        return <span key={index} style={{ fontSize: '1.2em' }}>{renderFormattedText(content, allowCustomColor)}</span>;
      }

      // Opacity: O(value)[text]O
      const opacityMatch = part.match(/^O\(([0-9.]+)\)\[([\s\S]*)\]O$/);
      if (opacityMatch) {
        const value = parseFloat(opacityMatch[1]);
        const content = opacityMatch[2];
        if (value >= 0.1 && value <= 1.0) { // Allow up to 1.0 for full opacity
          return <span key={index} style={{ opacity: value }}>{renderFormattedText(content, allowCustomColor)}</span>;
        }
        // If value is invalid, parse content without opacity
        return renderFormattedText(content, allowCustomColor);
      }

      // Color: C(colorValue)[text]C
      const colorMatch = part.match(/^C\((.+?)\)\[([\s\S]*)\]C$/);
      if (colorMatch && allowCustomColor) { // Check allowCustomColor here
        const colorValue = colorMatch[1];
        const content = colorMatch[2];
        // Basic validation for colorValue to prevent obvious XSS if AI generates malicious values.
        // A more robust sanitization might be needed if complex CSS is allowed.
        // For now, assuming color names, hex, rgb, rgba, hsl, hsla.
        if (/^[#\w\s(),%.-]+$/.test(colorValue)) {
           return <span key={index} style={{ color: colorValue }}>{renderFormattedText(content, allowCustomColor)}</span>;
        }
        // If colorValue is invalid or not allowed, parse content without color
        return renderFormattedText(content, allowCustomColor);
      } else if (colorMatch && !allowCustomColor) {
        // If color is not allowed, render the content of C()[]C without color, but still parse nested formats
        const content = colorMatch[2];
        return renderFormattedText(content, allowCustomColor);
      }

      return part; // Regular text
    });
};
