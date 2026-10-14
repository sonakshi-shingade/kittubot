import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import { Bot, Zap, Cpu, Sparkles, Terminal } from 'lucide-react';

const STARTER_PROMPTS = [
  {
    icon: <Cpu size={18} style={{ color: '#06b6d4' }} />,
    title: 'Explain continuous batching in vLLM',
    desc: 'How vLLM dynamically batches requests at token-level iteration',
    prompt: 'Explain continuous batching in vLLM.',
  },
  {
    icon: <Zap size={18} style={{ color: '#8b5cf6' }} />,
    title: 'Explain KV cache in detail',
    desc: 'Why key-value caching is essential for autoregressive LLMs',
    prompt: 'Explain KV cache in detail.',
  },
  {
    icon: <Sparkles size={18} style={{ color: '#ec4899' }} />,
    title: 'PagedAttention in vLLM',
    desc: 'How virtual memory paging inspired memory management in vLLM',
    prompt: 'Explain PagedAttention in vLLM and how it eliminates memory fragmentation.',
  },
  {
    icon: <Terminal size={18} style={{ color: '#10b981' }} />,
    title: 'Benchmark TTFT & Latency',
    desc: 'How Time To First Token and End-to-End latency are measured',
    prompt: 'How do you measure Time To First Token (TTFT) and End-to-End (E2E) latency in LLM inference?',
  },
];

export default function MessageList({ messages, isStreaming, onSelectPrompt }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="messages-container">
        <div className="empty-state">
          <div className="empty-logo">
            <Bot size={40} />
          </div>
          <h1 className="empty-title">Hello, I'm KittuBot!</h1>
          <p className="empty-subtitle">
            Your high-performance AI chat assistant powered by FastAPI and local vLLM.
            Ask me anything about LLM inference, coding, or architecture!
          </p>

          <div className="prompt-suggestions">
            {STARTER_PROMPTS.map((p, idx) => (
              <div
                key={idx}
                className="prompt-card"
                onClick={() => onSelectPrompt(p.prompt)}
              >
                <div className="prompt-title">
                  {p.icon}
                  <span>{p.title}</span>
                </div>
                <div className="prompt-desc">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      <div className="messages-inner">
        {messages.map((msg, index) => {
          const isCurrentStreaming =
            isStreaming && index === messages.length - 1 && msg.role === 'assistant';
          return (
            <MessageItem
              key={msg.id || index}
              message={msg}
              isStreaming={isCurrentStreaming}
            />
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}

