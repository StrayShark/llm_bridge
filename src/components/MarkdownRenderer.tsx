import ReactMarkdown from 'react-markdown'

interface MarkdownRendererProps {
  content: string
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown className="prose prose-sm max-w-none">
      {content}
    </ReactMarkdown>
  )
}
