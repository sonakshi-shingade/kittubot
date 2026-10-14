import React, { useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';

export default function ChatInput({ input, setInput, onSend, onStop, isStreaming }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="chat-input-wrapper">
      <div className="chat-input-box">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          placeholder="Message KittuBot... (e.g. Explain continuous batching in vLLM)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <div className="input-actions">
          <span className="input-hints">
            Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4 }}>Enter</kbd> to send, <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4 }}>Shift + Enter</kbd> for newline
          </span>

          {isStreaming ? (
            <button className="stop-btn" onClick={onStop} title="Stop generation">
              <Square size={16} fill="white" />
            </button>
          ) : (
            <button
              className="send-btn"
              onClick={onSend}
              disabled={!input.trim()}
              title="Send message"
            >
              <Send size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

