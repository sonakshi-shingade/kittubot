const API_BASE = '/api';

export async function fetchHealth(baseUrl = '') {
  const query = baseUrl ? `?base_url=${encodeURIComponent(baseUrl)}` : '';
  const res = await fetch(`${API_BASE}/health${query}`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return await res.json();
}

export async function fetchModels(baseUrl = '') {
  const query = baseUrl ? `?base_url=${encodeURIComponent(baseUrl)}` : '';
  const res = await fetch(`${API_BASE}/models${query}`);
  if (!res.ok) throw new Error(`Failed to load models: ${res.statusText}`);
  return await res.json();
}

export async function fetchSessions() {
  const res = await fetch(`${API_BASE}/sessions`);
  if (!res.ok) throw new Error(`Failed to fetch sessions: ${res.statusText}`);
  return await res.json();
}

export async function createSession(title = 'New Chat') {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Failed to create session: ${res.statusText}`);
  return await res.json();
}

export async function deleteSession(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete session: ${res.statusText}`);
  return await res.json();
}

export async function saveMessage(sessionId, message) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
  if (!res.ok) throw new Error(`Failed to save message: ${res.statusText}`);
  return await res.json();
}

export async function streamChat(reqData, { onChunk, onDone, onError, signal }) {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...reqData,
        stream: true,
      }),
      signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Server returned error ${res.status}: ${errText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep unfinished line

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            if (data.type === 'content') {
              onChunk(data.text);
            } else if (data.type === 'done') {
              onDone(data);
            } else if (data.type === 'error') {
              onError(data.message);
            }
          } catch (e) {
            console.error('Failed to parse SSE JSON chunk:', jsonStr, e);
          }
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      onDone({ aborted: true });
    } else {
      onError(err.message || 'Stream communication failed');
    }
  }
}

