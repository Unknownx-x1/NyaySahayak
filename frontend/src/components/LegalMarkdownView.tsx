import React from 'react';
import { 
  FileText, 
  AlertTriangle, 
  HelpCircle, 
  Scale, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  BookOpen
} from 'lucide-react';

interface LegalMarkdownViewProps {
  content: string;
  onProvenanceClick?: (page: number, chunkIndex?: number) => void;
}

// Inline parser for bold, italics, code, and provenance tags
export const renderInlineLegalText = (
  text: string, 
  onProvenanceClick?: (page: number, chunkIndex?: number) => void
): React.ReactNode => {
  if (!text) return null;

  // Split text by:
  // 1. Provenance citations: (e.g. Page 1, Chunk #16 or [Page 1, Chunk #22])
  // 2. Bold text: **...**
  // 3. Italic text: *...*
  // 4. Code spans: `...`
  const tokenRegex = /(\[(?:Page\s*\d+[^\]]*)\]|\bPage\s*\d+(?:,\s*Chunk\s*#?\d+)?|\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/gi;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Check for Page / Chunk Provenance
    const pageMatch = part.match(/Page\s*(\d+)(?:[,\s]*Chunk\s*#?(\d+))?/i);
    if (pageMatch) {
      const pageNum = parseInt(pageMatch[1], 10);
      const chunkNum = pageMatch[2] ? parseInt(pageMatch[2], 10) : undefined;
      const cleanLabel = part.replace(/[\[\]]/g, '').trim();

      return (
        <span
          key={idx}
          onClick={() => onProvenanceClick && onProvenanceClick(pageNum, chunkNum)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            borderRadius: '4px',
            padding: '0.08rem 0.45rem',
            fontSize: '0.74rem',
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            margin: '0 0.2rem',
            cursor: onProvenanceClick ? 'pointer' : 'default',
            verticalAlign: 'middle',
            whiteSpace: 'nowrap'
          }}
          title={`Verified Provenance: Page ${pageNum}${chunkNum ? `, Chunk #${chunkNum}` : ''}`}
        >
          {cleanLabel}
        </span>
      );
    }

    // Bold text: **...**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong key={idx} style={{ color: '#ffffff', fontWeight: 600 }}>
          {renderInlineLegalText(inner, onProvenanceClick)}
        </strong>
      );
    }

    // Italic text: *...*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      const inner = part.slice(1, -1);
      // Special styling for labels like *Gap*: or *Contradiction*:
      if (/^(gap|contradiction|dispute|note):/i.test(inner.trim())) {
        return (
          <span 
            key={idx} 
            style={{ 
              color: '#f59e0b', 
              fontWeight: 600, 
              backgroundColor: 'rgba(245, 158, 11, 0.12)', 
              padding: '0.05rem 0.35rem', 
              borderRadius: '3px',
              marginRight: '0.25rem'
            }}
          >
            {inner}
          </span>
        );
      }
      return (
        <em key={idx} style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          {renderInlineLegalText(inner, onProvenanceClick)}
        </em>
      );
    }

    // Inline code: `...`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code 
          key={idx} 
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.08)', 
            padding: '0.1rem 0.35rem', 
            borderRadius: '4px', 
            fontFamily: 'var(--font-mono)', 
            fontSize: '0.82em',
            color: '#e4e4e7'
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <span key={idx}>{part}</span>;
  });
};

export const LegalMarkdownView: React.FC<LegalMarkdownViewProps> = ({ content, onProvenanceClick }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];

  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = (tableKey: string) => {
    if (tableHeaders.length > 0 || tableRows.length > 0) {
      renderedElements.push(
        <div 
          key={`table-wrap-${tableKey}`} 
          style={{ 
            overflowX: 'auto', 
            margin: '1rem 0', 
            border: '1px solid var(--border-color)', 
            borderRadius: 'var(--radius-sm, 6px)',
            backgroundColor: 'var(--bg-secondary)'
          }}
        >
          <table 
            style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              fontSize: '0.84rem', 
              textAlign: 'left' 
            }}
          >
            {tableHeaders.length > 0 && (
              <thead style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-color)' }}>
                <tr>
                  {tableHeaders.map((th, thIdx) => (
                    <th 
                      key={thIdx} 
                      style={{ 
                        padding: '0.75rem 1rem', 
                        color: '#ffffff', 
                        fontWeight: 600, 
                        letterSpacing: '0.01em',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {renderInlineLegalText(th, onProvenanceClick)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {tableRows.map((row, rIdx) => (
                <tr 
                  key={rIdx} 
                  style={{ 
                    borderBottom: rIdx < tableRows.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                    backgroundColor: rIdx % 2 === 1 ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
                  }}
                >
                  {row.map((cell, cIdx) => (
                    <td 
                      key={cIdx} 
                      style={{ 
                        padding: '0.75rem 1rem', 
                        color: 'var(--text-primary)', 
                        verticalAlign: 'top',
                        lineHeight: '1.55'
                      }}
                    >
                      {renderInlineLegalText(cell, onProvenanceClick)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    inTable = false;
    tableHeaders = [];
    tableRows = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check if line is a table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map(c => c.trim());

      // Check if delimiter row like |---|---|---|
      const isDelimiter = cells.every(c => /^:?-+:?$/.test(c));
      if (isDelimiter) {
        // Just the divider line between headers and rows
        inTable = true;
        continue;
      }

      if (!inTable && tableHeaders.length === 0) {
        tableHeaders = cells;
        inTable = true;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      // End of table block reached
      flushTable(`table-${i}`);
    }

    // Blank lines
    if (!trimmed) {
      renderedElements.push(<div key={`blank-${i}`} style={{ height: '0.65rem' }} />);
      continue;
    }

    // Check for Major Section Headings like **I. Disputed Claims Identified in the Petition** or ### Heading
    const romanHeadingMatch = trimmed.match(/^\*\*(?:([I|V|X]+)\.\s*)([^*]+)\*\*$/i) ||
                             trimmed.match(/^#{1,4}\s+(?:([I|V|X]+)\.\s*)?(.+)$/i);

    if (romanHeadingMatch) {
      const numeral = romanHeadingMatch[1];
      const headingTitle = romanHeadingMatch[2];

      renderedElements.push(
        <div 
          key={`heading-${i}`} 
          style={{ 
            margin: '1.4rem 0 0.75rem 0', 
            paddingBottom: '0.45rem', 
            borderBottom: '1px solid var(--border-color)',
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.6rem' 
          }}
        >
          <Scale size={17} style={{ color: '#818cf8', flexShrink: 0 }} />
          <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            {numeral && <span style={{ color: '#818cf8', marginRight: '0.35rem' }}>{numeral}.</span>}
            {headingTitle}
          </h3>
        </div>
      );
      continue;
    }

    // Secondary subheadings: **1. Title** or ### Subheading
    const subHeadingMatch = trimmed.match(/^(\d+[\.\)])\s+\*\*([^*]+)\*\*$/) ||
                           trimmed.match(/^\*\*([A-Z0-9\s\.\-–—]+)\*\*$/);

    if (subHeadingMatch && !trimmed.includes('|')) {
      renderedElements.push(
        <div 
          key={`subhead-${i}`} 
          style={{ 
            fontSize: '0.9rem', 
            fontWeight: 600, 
            color: '#ffffff', 
            margin: '0.9rem 0 0.35rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <span style={{ color: 'var(--status-verified)' }}>▸</span>
          <span>{renderInlineLegalText(trimmed.replace(/^\*\*|\*\*$/g, ''), onProvenanceClick)}</span>
        </div>
      );
      continue;
    }

    // Bullet points (- or * )
    if (/^[-*]\s+/.test(trimmed)) {
      const bulletText = trimmed.replace(/^[-*]\s+/, '');
      renderedElements.push(
        <div 
          key={`bullet-${i}`} 
          style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '0.55rem', 
            marginBottom: '0.45rem', 
            paddingLeft: '0.5rem',
            lineHeight: '1.6'
          }}
        >
          <span style={{ color: '#818cf8', fontSize: '1rem', lineHeight: '1.2' }}>•</span>
          <div style={{ flex: 1, color: 'var(--text-primary)', fontSize: '0.86rem' }}>
            {renderInlineLegalText(bulletText, onProvenanceClick)}
          </div>
        </div>
      );
      continue;
    }

    // Numbered List Items (1. , 2. )
    const numListMatch = trimmed.match(/^(\d+)[\.\)]\s+(.+)$/);
    if (numListMatch) {
      const num = numListMatch[1];
      const rest = numListMatch[2];
      renderedElements.push(
        <div 
          key={`num-${i}`} 
          style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '0.55rem', 
            marginBottom: '0.5rem', 
            paddingLeft: '0.4rem',
            lineHeight: '1.6'
          }}
        >
          <span 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              minWidth: '20px', 
              height: '20px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(255, 255, 255, 0.08)', 
              color: '#ffffff', 
              fontSize: '0.72rem', 
              fontWeight: 700,
              marginTop: '0.15rem'
            }}
          >
            {num}
          </span>
          <div style={{ flex: 1, color: 'var(--text-primary)', fontSize: '0.86rem' }}>
            {renderInlineLegalText(rest, onProvenanceClick)}
          </div>
        </div>
      );
      continue;
    }

    // Standard Paragraph
    renderedElements.push(
      <p 
        key={`p-${i}`} 
        style={{ 
          fontSize: '0.86rem', 
          lineHeight: '1.65', 
          color: 'var(--text-primary)', 
          margin: '0 0 0.55rem 0' 
        }}
      >
        {renderInlineLegalText(trimmed, onProvenanceClick)}
      </p>
    );
  }

  // Final flush if table was at the end of the text
  if (inTable) {
    flushTable('end');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {renderedElements}
    </div>
  );
};
