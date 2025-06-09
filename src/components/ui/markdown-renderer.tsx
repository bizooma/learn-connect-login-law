
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer = ({ content, className = "" }: MarkdownRendererProps) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={`prose prose-sm max-w-none ${className}`}
      components={{
        // Customize heading styles to match design system
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold text-foreground mb-4">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-semibold text-foreground mb-3">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-medium text-foreground mb-2">{children}</h3>
        ),
        // Style paragraphs
        p: ({ children }) => (
          <p className="text-foreground leading-relaxed mb-3">{children}</p>
        ),
        // Style lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside text-foreground mb-3 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside text-foreground mb-3 space-y-1">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-foreground">{children}</li>
        ),
        // Style code blocks and inline code
        code: ({ inline, children }) => {
          if (inline) {
            return (
              <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono text-foreground">
                {children}
              </code>
            );
          }
          return (
            <pre className="bg-muted p-3 rounded-md overflow-x-auto mb-3">
              <code className="text-sm font-mono text-foreground">{children}</code>
            </pre>
          );
        },
        // Style blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-border pl-4 italic text-muted-foreground mb-3">
            {children}
          </blockquote>
        ),
        // Style tables
        table: ({ children }) => (
          <div className="overflow-x-auto mb-3">
            <table className="min-w-full border-collapse border border-border">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-border bg-muted px-3 py-2 text-left font-medium text-foreground">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-3 py-2 text-foreground">
            {children}
          </td>
        ),
        // Style links
        a: ({ children, href }) => (
          <a
            href={href}
            className="text-primary underline hover:text-primary/80 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        // Style horizontal rules
        hr: () => <hr className="border-border my-4" />,
        // Style strong and emphasis
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-foreground">{children}</em>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
