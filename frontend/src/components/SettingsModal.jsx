import React, { useState } from 'react';
import { X, RotateCcw, Save } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  config,
  onSave,
  availableModels,
}) {
  const [baseUrl, setBaseUrl] = useState(config.baseUrl || 'http://localhost:8000/v1');
  const [apiKey, setApiKey] = useState(config.apiKey || 'dummy');
  const [model, setModel] = useState(config.model || 'Qwen/Qwen3-0.6B');
  const [temperature, setTemperature] = useState(config.temperature ?? 0.7);
  const [maxTokens, setMaxTokens] = useState(config.maxTokens ?? 512);
  const [systemPrompt, setSystemPrompt] = useState(
    config.systemPrompt ||
      'You are KittuBot, a smart, friendly, and helpful AI assistant powered by local vLLM. Provide accurate, insightful, and well-structured answers.'
  );

  if (!isOpen) return null;

  const handleReset = () => {
    setBaseUrl('http://localhost:8000/v1');
    setApiKey('dummy');
    setModel('Qwen/Qwen3-0.6B');
    setTemperature(0.7);
    setMaxTokens(512);
    setSystemPrompt(
      'You are KittuBot, a smart, friendly, and helpful AI assistant powered by local vLLM. Provide accurate, insightful, and well-structured answers.'
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      baseUrl,
      apiKey,
      model,
      temperature: parseFloat(temperature),
      maxTokens: parseInt(maxTokens, 10),
      systemPrompt,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">KittuBot Settings</div>
          <button className="icon-btn" onClick={onClose} style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">vLLM Base URL</label>
              <input
                className="form-input"
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:8000/v1"
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                Target OpenAI-compatible endpoint (from streamlit.py)
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">API Key</label>
              <input
                className="form-input"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="dummy or your-api-key"
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                Local vLLM uses "dummy"; OpenAI uses sk-...
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Model Name</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-input"
                  style={{ flex: 1 }}
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Qwen/Qwen3-0.6B"
                />
              </div>
              {availableModels && availableModels.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  {availableModels.map((m) => (
                    <span
                      key={m.id}
                      onClick={() => setModel(m.id)}
                      style={{
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: model === m.id ? 'var(--accent-cyan)' : 'var(--bg-tertiary)',
                        color: model === m.id ? '#000' : 'var(--text-muted)',
                      }}
                    >
                      {m.id}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Temperature ({temperature})</label>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Max Tokens</label>
                <input
                  className="form-input"
                  type="number"
                  min="50"
                  max="4096"
                  step="50"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">System Prompt</label>
              <textarea
                className="form-input"
                rows={3}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Define KittuBot's persona..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={handleReset}>
              <RotateCcw size={14} style={{ display: 'inline', marginRight: 4 }} />
              Reset
            </button>
            <button type="submit" className="btn-primary">
              <Save size={14} style={{ display: 'inline', marginRight: 4 }} />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

