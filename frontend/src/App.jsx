import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import SettingsModal from './components/SettingsModal';
import {
  fetchHealth,
  fetchModels,
  fetchSessions,
  createSession,
  deleteSession,
  saveMessage,
  streamChat,
} from './services/api';

const DEFAULT_CONFIG = {
  baseUrl: 'http://localhost:8000/v1',
  apiKey: 'dummy',
  model: 'Qwen/Qwen3-0.6B',
  temperature: 0.7,
  maxTokens: 512,
  systemPrompt:
    'You are KittuBot, a smart, friendly, and helpful AI assistant powered by local vLLM. Provide accurate, insightful, and well-structured answers.',
};

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [vllmConnected, setVllmConnected] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);

  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('kittubot_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const abortControllerRef = useRef(null);

  // Load configuration and initial data
  useEffect(() => {
    loadSessions();
    checkConnection();
  }, []);

  const checkConnection = async (targetBaseUrl) => {
    setCheckingHealth(true);
    try {
      const urlToTest = targetBaseUrl || config.baseUrl;
      const health = await fetchHealth(urlToTest);
      setVllmConnected(health.vllm_connected);
      const modelsData = await fetchModels(urlToTest);
      setAvailableModels(modelsData);
    } catch (err) {
      setVllmConnected(false);
    } finally {
      setCheckingHealth(false);
    }
  };

  const loadSessions = async () => {
    try {
      const data = await fetchSessions();
      setSessions(data);
      if (data.length > 0 && !activeSessionId) {
        setActiveSessionId(data[0].id);
        setMessages(data[0].messages || []);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const handleSelectSession = (id) => {
    setActiveSessionId(id);
    const session = sessions.find((s) => s.id === id);
    if (session) {
      setMessages(session.messages || []);
    }
  };

  const handleNewChat = async () => {
    try {
      const newSession = await createSession('New Chat');
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create new session:', err);
    }
  };

  const handleDeleteSession = async (id) => {
    try {
      await deleteSession(id);
      const remaining = sessions.filter((s) => s.id !== id);
      setSessions(remaining);
      if (activeSessionId === id) {
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
          setMessages(remaining[0].messages || []);
        } else {
          setActiveSessionId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleSaveSettings = (newConfig) => {
    setConfig(newConfig);
    localStorage.setItem('kittubot_config', JSON.stringify(newConfig));
    checkConnection(newConfig.baseUrl);
  };

  const handleSendMessage = async (customPrompt) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || isStreaming) return;

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      try {
        const newSession = await createSession(textToSend.slice(0, 30));
        setSessions([newSession, ...sessions]);
        currentSessionId = newSession.id;
        setActiveSessionId(newSession.id);
      } catch (err) {
        console.error('Session create error:', err);
      }
    }

    const userMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now() / 1000,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    // Save user message to backend
    if (currentSessionId) {
      saveMessage(currentSessionId, userMessage).catch(console.error);
    }

    // Prepare assistant message placeholder
    const assistantMessageId = 'msg-bot-' + Date.now();
    const assistantPlaceholder = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      model: config.model,
      timestamp: Date.now() / 1000,
    };

    setMessages([...newMessages, assistantPlaceholder]);
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let accumulatedContent = '';

    await streamChat(
      {
        messages: newMessages,
        model: config.model,
        base_url: config.baseUrl,
        api_key: config.apiKey,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        system_prompt: config.systemPrompt,
        session_id: currentSessionId,
      },
      {
        signal: abortController.signal,
        onChunk: (chunk) => {
          accumulatedContent += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: accumulatedContent }
                : m
            )
          );
        },
        onDone: (metrics) => {
          setIsStreaming(false);
          const finalAssistantMsg = {
            id: assistantMessageId,
            role: 'assistant',
            content: accumulatedContent,
            model: metrics.model || config.model,
            ttft: metrics.ttft,
            latency: metrics.latency,
            timestamp: Date.now() / 1000,
          };

          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMessageId ? finalAssistantMsg : m))
          );

          if (currentSessionId) {
            saveMessage(currentSessionId, finalAssistantMsg).catch(console.error);
            loadSessions(); // update session titles and ordering
          }
        },
        onError: (errMsg) => {
          setIsStreaming(false);
          const errorMsg = {
            id: assistantMessageId,
            role: 'assistant',
            content: accumulatedContent
              ? accumulatedContent + `\n\n⚠️ **Error:** ${errMsg}`
              : `⚠️ **Error connecting to KittuBot Engine:**\n\n${errMsg}`,
            model: config.model,
            timestamp: Date.now() / 1000,
          };

          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMessageId ? errorMsg : m))
          );

          if (currentSessionId) {
            saveMessage(currentSessionId, errorMsg).catch(console.error);
          }
        },
      }
    );
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        modelName={config.model}
        vllmConnected={vllmConnected}
      />

      <main className="main-chat">
        <ChatHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenSettings={() => setSettingsOpen(true)}
          vllmConnected={vllmConnected}
          modelName={config.model}
          onRefreshHealth={() => checkConnection()}
          checkingHealth={checkingHealth}
        />

        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          onSelectPrompt={(prompt) => handleSendMessage(prompt)}
        />

        <ChatInput
          input={input}
          setInput={setInput}
          onSend={() => handleSendMessage()}
          onStop={handleStopStreaming}
          isStreaming={isStreaming}
        />
      </main>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        config={config}
        onSave={handleSaveSettings}
        availableModels={availableModels}
      />
    </div>
  );
}

