import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api, getAccess } from "../api/ApiClient.jsx";
import { useToast } from "../context/ToastContext.jsx";
import "./ChatView.css";

function SourcesPanel({ sources }) {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="sources-panel">
      <button className="sources-toggle" onClick={() => setExpanded(e => !e)}>
        <span>📎 Sources ({sources.length})</span>
        <span className={`sources-chevron${expanded ? " expanded" : ""}`}>▾</span>
      </button>
      {expanded && (
        <div className="sources-list">
          {sources.map((s, i) => (
            <div key={i} className="source-card">
              <div className="source-card-header">
                <span className="source-filename">{s.filename}</span>
                <span className="source-chunk">chunk {s.chunkIndex + 1}</span>
              </div>
              <p className="source-excerpt">{s.excerpt}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChatView({ chatId, chatPath }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [streamingSources, setStreamingSources] = useState([]);

  const apiUrl = import.meta.env.VITE_API_URL;
  const { showToast } = useToast();

  useEffect(() => {
    if (!chatId) return;

    setLoading(true);
    async function loadMessages() {
      try {
        const { data } = await api.get(`/messages/${chatId}`);
        setMessages(data.map(m => ({
          ...m,
          sources: m.sources ? JSON.parse(m.sources) : null
        })));
      } catch {
        showToast("Failed to load messages.", "error");
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [chatId, showToast]);

  // Sends/retries the request to the LLM for an already-recorded user message.
  // The backend is idempotent: if this exact user message was already saved
  // (e.g. a previous failed attempt), it won't be saved again.
  async function requestAssistantReply(userMessageId, userMessage) {
    setIsStreaming(true);
    setStreamingMessage("");
    setStreamingSources([]);

    let fullResponse = "";
    let collectedSources = [];
    let gotDone = false;
    let gotError = null;

    try {
      const res = await fetch(`${apiUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getAccess()}`
        },
        body: JSON.stringify({ chat_id: chatId, content: userMessage }),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      readLoop:
      while (!gotDone && !gotError) {
        let chunkResult;
        try {
          chunkResult = await reader.read();
        } catch (readErr) {
          // The connection can drop right as the server finishes streaming
          // (a known SseEmitter/chunked-encoding quirk) even though the full
          // answer already arrived via "chunk" events. Fall back to whatever
          // we've accumulated so far instead of treating this as a failure.
          console.warn("Stream read interrupted:", readErr);
          break;
        }

        const { done, value } = chunkResult;
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          // Spring's SseEmitter writes the prefix as "data:" with no space.
          if (!line.startsWith("data:")) continue;

          let payload = line.slice(5);
          if (payload.startsWith(" ")) payload = payload.slice(1);

          let data;
          try {
            data = JSON.parse(payload);
          } catch (parseErr) {
            console.error("JSON parse error:", parseErr, line);
            continue;
          }

          if (data.error) {
            gotError = data.error;
            break readLoop;
          }

          if (data.done) {
            gotDone = true;
            fullResponse = data.full_response || fullResponse;
            break readLoop;
          } else if (data.sources) {
            collectedSources = data.sources;
            setStreamingSources(collectedSources);
          } else if (data.chunk) {
            fullResponse += data.chunk;
            setStreamingMessage(fullResponse);
          }
        }
      }
    } catch (e) {
      console.error("Send failed:", e);
      gotError = gotError || e.message;
    } finally {
      setStreamingMessage("");
      setStreamingSources([]);
      setIsStreaming(false);
    }

    // Treat it as successful if the server explicitly said "done", or if we
    // never got an error and still received some answer text via "chunk"
    // events (covers the dropped-final-event case above).
    if (gotError || (!gotDone && !fullResponse)) {
      if (gotError) console.error("LLM error:", gotError);
      setMessages(prev => prev.map(m =>
        m.id === userMessageId ? { ...m, status: "failed" } : m
      ));
      return;
    }

    setMessages(prev => [
      ...prev.map(m => m.id === userMessageId ? { ...m, status: "sent" } : m),
      {
        id: Date.now() + 1,
        chat_id: chatId,
        author: "system",
        message: fullResponse,
        role: "assistant",
        sources: collectedSources.length > 0 ? collectedSources : null
      }
    ]);
  }

  async function sendMessage() {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    const messageId = Date.now();
    setInput("");

    setMessages(prev => [...prev, {
      id: messageId,
      chat_id: chatId,
      author: "user",
      message: userMessage,
      role: "user",
      status: "pending"
    }]);

    await requestAssistantReply(messageId, userMessage);
  }

  async function retryMessage(message) {
    if (isStreaming) return;

    setMessages(prev => prev.map(m =>
      m.id === message.id ? { ...m, status: "pending" } : m
    ));

    await requestAssistantReply(message.id, message.message);
  }

  function handleKeyPress(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="chat-view">
      <div className="chat-header">
        {chatPath ? (
          <h3 className="chat-path">
            {chatPath.studyTitle && (
              <>
                <span className="chat-path-part">{chatPath.studyTitle}</span>
                <span className="chat-path-sep">›</span>
              </>
            )}
            {chatPath.topicTitle && (
              <>
                <span className="chat-path-part">{chatPath.topicTitle}</span>
                <span className="chat-path-sep">›</span>
              </>
            )}
            <span className="chat-path-part current">{chatPath.title}</span>
          </h3>
        ) : (
          <h3>Chat</h3>
        )}
      </div>

      <div className="messages">
        {loading && <p className="chat-loading">Loading…</p>}

        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.author}${m.status === "failed" ? " failed" : ""}`}>
            <b>{m.author === "user" ? "You" : "AI"}</b>
            <Markdown remarkPlugins={[remarkGfm]}>{m.message}</Markdown>
            {m.author === "system" && <SourcesPanel sources={m.sources} />}
            {m.status === "failed" && (
              <div className="msg-error">
                <span className="msg-error-text">Message failed to send.</span>
                <button
                  className="msg-retry-btn"
                  onClick={() => retryMessage(m)}
                  disabled={isStreaming}
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        ))}

        {isStreaming && streamingMessage && (
          <div className="msg system streaming">
            <b>AI</b>
            <Markdown remarkPlugins={[remarkGfm]}>{streamingMessage}</Markdown>
            <span className="cursor-blink">▊</span>
            <SourcesPanel sources={streamingSources} />
          </div>
        )}
      </div>

      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={isStreaming}
        />
        <button onClick={sendMessage} disabled={isStreaming}>
          {isStreaming ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
