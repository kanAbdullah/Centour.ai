import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import "./ChatView.css";

export default function ChatView({ chatId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");

  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("access_token");

  // 1️⃣ Chat mesajlarını yükle
  useEffect(() => {
    console.log("ChatView mounting or chatId changed:", chatId);
    if (!chatId) {
      console.log("No chat ID provided, skipping message load.");
      return;
    }
    console.log("Loading messages for chat ID:", chatId);
    async function loadMessages() {
      try {
        const res = await fetch(`${apiUrl}/messages/${chatId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        setMessages(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [chatId]);

  // 2️⃣ Yeni mesaj gönder (STREAMING ile)
  async function sendMessage() {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingMessage("");

    // Kullanıcı mesajını hemen ekle
    const tempUserMsg = {
      id: Date.now(), // Geçici ID
      chat_id: chatId,
      author: "user",
      message: userMessage,
      role: "user"
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`${apiUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          chat_id: chatId,
          content: userMessage
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      // SSE streaming okuma
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // SSE mesajlarını parse et (data: {...}\n\n formatında)
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || ""; // Son tamamlanmamış satırı sakla
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.substring(6);
            try {
              const data = JSON.parse(jsonStr);
              
              if (data.error) {
                console.error("Streaming error:", data.error);
                setStreamingMessage(data.error);
                break;
              }
              
              if (data.done) {
                // Streaming tamamlandı
                console.log("Streaming tamamlandı");
                fullResponse = data.full_response || fullResponse;
                
                // Tamamlanan mesajı listeye ekle
                const systemMsg = {
                  id: Date.now() + 1,
                  chat_id: chatId,
                  author: "system",
                  message: fullResponse,
                  role: "assistant"
                };
                setMessages(prev => [...prev, systemMsg]);
                setStreamingMessage("");
                setIsStreaming(false);
                
              } else if (data.chunk) {
                // Yeni chunk geldi
                fullResponse += data.chunk;
                setStreamingMessage(fullResponse);
              }
              
            } catch (e) {
              console.error("JSON parse error:", e, "Line:", jsonStr);
            }
          }
        }
      }

    } catch (e) {
      console.error("Send failed:", e);
      setIsStreaming(false);
      setStreamingMessage("");
    }
  }

  // Enter tuşu ile gönder
  function handleKeyPress(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="chat-view">
      <h3>Chat</h3>
      {loading && <p>Yükleniyor…</p>}
      
      <div className="messages">
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.author}`}>
            <b>{m.author === "user" ? "user" : "system"}: </b>
            <Markdown remarkPlugins={[remarkGfm]}>
              {m.message}
            </Markdown>
          </div>
        ))}
        
        {/* Streaming mesajı (henüz tamamlanmamış) */}
        {isStreaming && streamingMessage && (
          <div className="msg system streaming">
            <b>AI: </b>
            <Markdown remarkPlugins={[remarkGfm]}>
              {streamingMessage}
            </Markdown>
            <span className="cursor-blink">▊</span>
          </div>
        )}
      </div>

      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Mesaj yaz..."
          disabled={isStreaming}
        />
        <button onClick={sendMessage} disabled={isStreaming}>
          {isStreaming ? "Gönderiliyor..." : "Gönder"}
        </button>
      </div>
    </div>
  );
}