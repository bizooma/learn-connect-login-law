import DOMPurify from 'dompurify';

interface SafeHtmlContentProps {
  content: string;
  className?: string;
  allowedTags?: string[];
  allowedAttributes?: string[];
}

const SafeHtmlContent = ({ 
  content, 
  className = "prose max-w-none",
  allowedTags = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'],
  allowedAttributes = ['href', 'target', 'rel']
}: SafeHtmlContentProps) => {
  // Configure DOMPurify with strict settings
  const cleanHtml = DOMPurify.sanitize(content.replace(/\n/g, '<br>'), {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttributes,
    KEEP_CONTENT: true,
    USE_PROFILES: {
      html: true
    }
  });

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
};

export default SafeHtmlContent;