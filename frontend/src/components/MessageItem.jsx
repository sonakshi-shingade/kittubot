import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Check, Copy, Clock, Zap } from 'lucide-react';

function CodeBlock({ language, value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-wrapper">
      <div className="code-header">
        <span>{language || 'code'}</span>
        <button className="copy-btn" onClick={handleCopy}>
          {copied ? (
            <>
              <Check size={13} style={{ color: '#10b981' }} />
              <span style={{ color: '#10b981' }}>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre>
        <code>{value}</code>
      </pre>
    </div>
  );
}

export default function MessageItem({ message, isStreaming }) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className={`avatar ${isUser ? 'user' : 'assistant'}`}>
        {isUser ? <User size={18} /> : <Bot size={20} />}
      </div>

      <div className="message-bubble">
        <div className="message-body">
          {isUser ? (
            <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeText = String(children).replace(/\n$/, '');
                    if (!inline && match) {
                      return <CodeBlock language={match[1]} value={codeText} />;
                    } else if (!inline && codeText.includes('\n')) {
                      return <CodeBlock language="" value={codeText} />;
                    }
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>

              {isStreaming && <span className="typing-cursor" />}
            </div>
          )}
        </div>

        <div className="message-meta">
          {message.timestamp && <span>{formatTime(message.timestamp)}</span>}

          {isAssistant && message.latency && (
            <span className="metric-pill" title="Total response latency">
              <Clock size={11} />
              {message.latency}s
            </span>
          )}

          {isAssistant && message.ttft && (
            <span className="metric-pill" title="Time to first token (TTFT)">
              <Zap size={11} style={{ color: '#f59e0b' }} />
              TTFT: {Math.round(message.ttft * 1000)}ms
            </span>
          )}

          {isAssistant && message.model && (
            <span style={{ opacity: 0.6 }}>{message.model}</span>
          )}
        </div>
      </div>
    </div>
  );
}

