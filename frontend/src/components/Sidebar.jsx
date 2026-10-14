import React from 'react';
import { Plus, MessageSquare, Trash2, Bot, Layers, Sparkles } from 'lucide-react';

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isOpen,
  onClose,
  modelName,
  vllmConnected
}) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="brand-badge">
          <div className="brand-icon">
            <Bot size={20} />
          </div>
          <span>KittuBot</span>
        </div>
      </div>

      <button className="new-chat-btn" onClick={onNewChat}>
        <Plus size={18} />
        <span>New Chat</span>
      </button>

      <div className="sessions-list">
        {sessions.length === 0 ? (
          <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.85rem' }}>
            No chat history yet. Start a new conversation!
          </div>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className={`session-item ${s.id === activeSessionId ? 'active' : ''}`}
              onClick={() => {
                onSelectSession(s.id);
                if (window.innerWidth <= 768) onClose();
              }}
            >
              <MessageSquare size={16} style={{ flexShrink: 0, marginRight: 8, opacity: 0.7 }} />
              <span className="session-title">{s.title || 'Untitled Chat'}</span>
              <button
                className="session-delete-btn"
                title="Delete Chat"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(s.id);
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={14} />
            <span style={{ fontSize: '0.78rem' }}>Backend: vLLM (Qwen)</span>
          </div>
          <span
            className={`status-dot ${vllmConnected ? 'online' : 'offline'}`}
            title={vllmConnected ? 'vLLM Connected' : 'vLLM Offline'}
          />
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
          KittuBot v1.0 • React + FastAPI
        </div>
      </div>
    </aside>
  );
}

