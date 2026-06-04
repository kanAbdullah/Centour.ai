import { useEffect, useState, useRef } from 'react';
import { api } from '../api/ApiClient.jsx';
import './SideBarContentController.css';

export default function SideBarContentController({ onSelectChat }) {
  const [currentBarContent, setCurrentBarContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentState, setCurrentState] = useState("studies");
  const [isAdding, setIsAdding] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");

  const studyIdRef = useRef(null);
  const topicIdRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/studies');
        setCurrentBarContent(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function onSelect(id) {
    let fetchUrl = "";

    if (currentState === "studies") {
      studyIdRef.current = id;
      fetchUrl = `/topics/${id}`;
      setCurrentState("topics");
    } else if (currentState === "topics") {
      topicIdRef.current = id;
      fetchUrl = `/chats/${id}`;
      setCurrentState("chats");
    } else if (currentState === "chats") {
      if (id != null) onSelectChat?.(id);
      return;
    }

    try {
      const { data } = await api.get(fetchUrl);
      setCurrentBarContent(data);
    } catch (e) {
      console.error("Fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }

  async function goPreviousMenu() {
    let fetchUrl = "";

    if (currentState === "chats") {
      fetchUrl = `/topics/${studyIdRef.current}`;
      setCurrentState("topics");
    } else if (currentState === "topics") {
      fetchUrl = `/studies`;
      setCurrentState("studies");
    } else {
      return;
    }

    try {
      const { data } = await api.get(fetchUrl);
      setCurrentBarContent(data);
    } catch (e) {
      console.error("Fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!newItemTitle.trim()) return;

    let fetchUrl = "";
    let bodyData = {};

    if (currentState === "studies") {
      fetchUrl = '/studies';
      bodyData = { title: newItemTitle.trim() };
    } else if (currentState === "topics") {
      fetchUrl = '/topics';
      bodyData = { title: newItemTitle.trim(), study_id: studyIdRef.current };
    } else if (currentState === "chats") {
      fetchUrl = '/chats';
      bodyData = { title: newItemTitle.trim(), topic_id: topicIdRef.current };
    }

    try {
      const { data: newItem } = await api.post(fetchUrl, bodyData);
      setCurrentBarContent(prev => [...prev, { id: newItem.id, title: newItemTitle.trim() }]);
      setNewItemTitle("");
      setIsAdding(false);
    } catch (e) {
      console.error("POST failed:", e);
    }
  }

  const addLabel = currentState === "studies" ? "study" : currentState === "topics" ? "topic" : "chat";
  const heading = currentState === "studies" ? "Studies" : currentState === "topics" ? "Topics" : "Chats";

  return (
    <div>
      <button
        className="sidebar-back-btn"
        onClick={goPreviousMenu}
        disabled={currentState === "studies"}
      >
        ← Back
      </button>

      <p className="sidebar-section-label">{heading}</p>

      {loading && <p className="sidebar-loading">Loading…</p>}

      <ul className="sidebar-list">
        {!loading && currentBarContent.length === 0 ? (
          <p className="sidebar-empty">No items</p>
        ) : (
          currentBarContent.map((c, index) => (
            <li key={c.id || index}>
              <button className="sidebar-item-btn" onClick={() => onSelect(c.id)}>
                {c.title}
              </button>
            </li>
          ))
        )}
      </ul>

      {isAdding ? (
        <div className="sidebar-add-form">
          <input
            className="sidebar-add-input"
            autoFocus
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") { setIsAdding(false); setNewItemTitle(""); }
            }}
            placeholder={`${addLabel} name`}
          />
          <div className="sidebar-add-actions">
            <button className="sidebar-add-confirm" onClick={handleAdd}>Add</button>
            <button className="sidebar-add-cancel" onClick={() => { setIsAdding(false); setNewItemTitle(""); }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button className="sidebar-add-btn" onClick={() => setIsAdding(true)}>
          + Add {addLabel}
        </button>
      )}
    </div>
  );
}
