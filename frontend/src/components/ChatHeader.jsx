import React from 'react';
import { Menu, Settings, Cpu, RefreshCw, Activity } from 'lucide-react';

export default function ChatHeader({
  onToggleSidebar,
  onOpenSettings,
  vllmConnected,
  modelName,
  onRefreshHealth,
  checkingHealth,
}) {
  return (
    <header className="chat-header">
      <div className="header-left">
        <button className="mobile-menu-btn" onClick={onToggleSidebar} aria-label="Toggle Menu">
          <Menu size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="status-badge">
            <span className={`status-dot ${vllmConnected ? 'online' : 'offline'}`} />
            <span>{vllmConnected ? 'vLLM Connected' : 'vLLM Offline'}</span>
          </div>

          <div className="model-tag" title="Active Model">
            <Cpu size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            {modelName}
          </div>
        </div>
      </div>

      <div className="header-actions">
        <button
          className="icon-btn"
          title="Check vLLM Connection"
          onClick={onRefreshHealth}
          disabled={checkingHealth}
        >
          <RefreshCw size={16} className={checkingHealth ? 'animate-spin' : ''} />
        </button>

        <button className="icon-btn" title="KittuBot Settings" onClick={onOpenSettings}>
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}

