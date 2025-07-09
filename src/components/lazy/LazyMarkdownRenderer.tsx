import { lazy, Suspense } from "react";
import type { Components } from 'react-markdown';

// Lazy load markdown renderer
const ReactMarkdown = lazy(() => import('react-markdown'));

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Loading component for markdown
const MarkdownLoader = () => (
  <div className="animate-pulse bg-gray-200 h-20 w-full rounded"></div>
);

const LazyMarkdownRenderer = ({ content, className = "" }: MarkdownRendererProps) => {
  const components: Components = {
    // Customize heading styles to match design system
    h1: ({ children }) => <h1 className="text-3xl font-bold mb-4 text-foreground">{children}</h1>,
    h2: ({ children }) => <h2 className="text-2xl font-semibold mb-3 text-foreground">{children}</h2>,
    h3: ({ children }) => <h3 className="text-xl font-medium mb-2 text-foreground">{children}</h3>,
    p: ({ children }) => <p className="mb-3 text-muted-foreground leading-relaxed">{children}</p>,
    ul: ({ children }) => <ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-6 mb-3 space-y-1">{children}</ol>,
    li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-3">
        {children}
      </blockquote>
    ),
    code: ({ children, className }) => {
      if (className?.includes('language-')) {
        return (
          <pre className="bg-muted p-4 rounded-md overflow-x-auto mb-3">
            <code className="text-sm">{children}</code>
          </pre>
        );
      }
      return <code className="bg-muted px-1 py-0.5 rounded text-sm">{children}</code>;
    },
    a: ({ children, href }) => (
      <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  };

  return (
    <Suspense fallback={<MarkdownLoader />}>
      <ReactMarkdown
        className={className}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </Suspense>
  );
};

export default LazyMarkdownRenderer;