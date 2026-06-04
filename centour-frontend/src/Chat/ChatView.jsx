import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api, getAccess } from "../api/ApiClient.jsx";
import "./ChatView.css";

export default function ChatView({ chatId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!chatId) return;

    async function loadMessages() {
      try {
        const { data } = await api.get(`/messages/${chatId}`);
        setMessages(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [chatId]);

  async function sendMessage() {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingMessage("");

    setMessages(prev => [...prev, {
      id: Date.now(),
      chat_id: chatId,
      author: "user",
      message: userMessage,
      role: "user"
    }]);

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
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(line.substring(6));

            if (data.error) {
              setStreamingMessage(data.error);
              break;
            }

            if (data.done) {
              fullResponse = data.full_response || fullResponse;
              setMessages(prev => [...prev, {
                id: Date.now() + 1,
                chat_id: chatId,
                author: "system",
                message: fullResponse,
                role: "assistant"
              }]);
              setStreamingMessage("");
              setIsStreaming(false);
            } else if (data.chunk) {
              fullResponse += data.chunk;
              setStreamingMessage(fullResponse);
            }
          } catch (e) {
            console.error("JSON parse error:", e);
          }
        }
      }
    } catch (e) {
      console.error("Send failed:", e);
      setIsStreaming(false);
      setStreamingMessage("");
    }
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
        <h3>Chat</h3>
      </div>

      <div className="messages">
        {loading && <p className="chat-loading">Loading…</p>}

        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.author}`}>
            <b>{m.author === "user" ? "You" : "AI"}</b>
            <Markdown remarkPlugins={[remarkGfm]}>{m.message}</Markdown>
          </div>
        ))}

        {isStreaming && streamingMessage && (
          <div className="msg system streaming">
            <b>AI</b>
            <Markdown remarkPlugins={[remarkGfm]}>{streamingMessage}</Markdown>
            <span className="cursor-blink">▊</span>
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
