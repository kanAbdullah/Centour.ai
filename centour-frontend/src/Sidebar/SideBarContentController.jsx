import { useEffect, useState, useRef } from 'react';
import { api } from '../api/ApiClient.jsx';
import { useToast } from '../context/ToastContext.jsx';
import MaterialsModal from './MaterialsModal.jsx';
import './SideBarContentController.css';

export default function SideBarContentController({ onSelectChat, resetChat, activeChat }) {
  const [currentBarContent, setCurrentBarContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentState, setCurrentState] = useState("studies");
  const [isAdding, setIsAdding] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [breadcrumb, setBreadcrumb] = useState({ study: null, topic: null });
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showMaterials, setShowMaterials] = useState(false);

  const studyIdRef = useRef(null);
  const topicIdRef = useRef(null);

  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/studies');
        setCurrentBarContent(data);
      } catch {
        showToast("Failed to load studies.", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showToast]);

  async function onSelect(item) {
    let fetchUrl = "";

    if (currentState === "studies") {
      studyIdRef.current = item.id;
      setBreadcrumb({ study: { id: item.id, title: item.title }, topic: null });
      fetchUrl = `/topics/${item.id}`;
      setCurrentState("topics");
    } else if (currentState === "topics") {
      topicIdRef.current = item.id;
      setBreadcrumb(prev => ({ ...prev, topic: { id: item.id, title: item.title } }));
      fetchUrl = `/chats/${item.id}`;
      setCurrentState("chats");
    } else if (currentState === "chats") {
      onSelectChat?.({
        id: item.id,
        title: item.title,
        topicId: topicIdRef.current,
        topicTitle: breadcrumb.topic?.title,
        studyId: studyIdRef.current,
        studyTitle: breadcrumb.study?.title,
      });
      return;
    }

    try {
      const { data } = await api.get(fetchUrl);
      setCurrentBarContent(data);
    } catch {
      showToast("Failed to load items.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function goPreviousMenu() {
    let fetchUrl = "";

    if (currentState === "chats") {
      fetchUrl = `/topics/${studyIdRef.current}`;
      setBreadcrumb(prev => ({ ...prev, topic: null }));
      setCurrentState("topics");
    } else if (currentState === "topics") {
      fetchUrl = `/studies`;
      setBreadcrumb({ study: null, topic: null });
      setCurrentState("studies");
    } else {
      return;
    }

    try {
      const { data } = await api.get(fetchUrl);
      setCurrentBarContent(data);
    } catch {
      showToast("Failed to load items.", "error");
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
    }

    try {
      const { data: newItem } = await api.post(fetchUrl, bodyData);
      const newId = newItem.study_id ?? newItem.topic_id;
      const title = newItemTitle.trim();
      setCurrentBarContent(prev => [...prev, { id: newId, title }]);
      setNewItemTitle("");
      setIsAdding(false);
    } catch {
      showToast(`Failed to create ${addLabel}.`, "error");
    }
  }

  async function handleAddChat() {
    try {
      const { data } = await api.post('/chats', { topic_id: topicIdRef.current });
      const newChat = { id: data.chat_id, title: data.title };
      setCurrentBarContent(prev => [...prev, newChat]);
      onSelectChat?.({
        id: newChat.id,
        title: newChat.title,
        topicId: topicIdRef.current,
        topicTitle: breadcrumb.topic?.title,
        studyId: studyIdRef.current,
        studyTitle: breadcrumb.study?.title,
      });
    } catch {
      showToast("Failed to create chat.", "error");
    }
  }

  function startRename(item) {
    setConfirmDeleteId(null);
    setEditingId(item.id);
    setEditingTitle(item.title);
  }

  async function confirmRename(item) {
    const title = editingTitle.trim();
    setEditingId(null);
    if (!title || title === item.title) return;

    const url =
      currentState === "studies" ? `/studies/${item.id}` :
      currentState === "topics" ? `/topics/${item.id}` :
      `/chats/${item.id}`;

    try {
      await api.patch(url, { title });
      setCurrentBarContent(prev => prev.map(c => c.id === item.id ? { ...c, title } : c));

      if (currentState === "studies") {
        setBreadcrumb(prev => prev.study?.id === item.id ? { ...prev, study: { ...prev.study, title } } : prev);
        if (activeChat?.studyId === item.id) onSelectChat?.({ ...activeChat, studyTitle: title });
      } else if (currentState === "topics") {
        setBreadcrumb(prev => prev.topic?.id === item.id ? { ...prev, topic: { ...prev.topic, title } } : prev);
        if (activeChat?.topicId === item.id) onSelectChat?.({ ...activeChat, topicTitle: title });
      } else if (currentState === "chats") {
        if (activeChat?.id === item.id) onSelectChat?.({ ...activeChat, title });
      }
    } catch {
      showToast(`Failed to rename ${addLabel}.`, "error");
    }
  }

  async function handleDelete(item) {
    const url =
      currentState === "studies" ? `/studies/${item.id}` :
      currentState === "topics" ? `/topics/${item.id}` :
      `/chats/${item.id}`;

    try {
      await api.delete(url);
      setCurrentBarContent(prev => prev.filter(c => c.id !== item.id));
      setConfirmDeleteId(null);

      const affectsActive =
        (currentState === "chats" && activeChat?.id === item.id) ||
        (currentState === "topics" && activeChat?.topicId === item.id) ||
        (currentState === "studies" && activeChat?.studyId === item.id);

      if (affectsActive) resetChat?.();
    } catch {
      showToast(`Failed to delete ${addLabel}.`, "error");
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

      {(breadcrumb.study || breadcrumb.topic) && (
        <div className="sidebar-breadcrumb">
          {breadcrumb.study && <span className="breadcrumb-item">{breadcrumb.study.title}</span>}
          {breadcrumb.topic && (
            <>
              <span className="breadcrumb-sep">›</span>
              <span className="breadcrumb-item">{breadcrumb.topic.title}</span>
            </>
          )}
        </div>
      )}

      {breadcrumb.study && (
        <button className="sidebar-materials-btn" onClick={() => setShowMaterials(true)}>
          📎 Materials
        </button>
      )}

      {showMaterials && (
        <MaterialsModal
          studyId={studyIdRef.current}
          studyTitle={breadcrumb.study?.title}
          onClose={() => setShowMaterials(false)}
        />
      )}

      <p className="sidebar-section-label">{heading}</p>

      {loading && <p className="sidebar-loading">Loading…</p>}

      <ul className="sidebar-list">
        {!loading && currentBarContent.length === 0 ? (
          <p className="sidebar-empty">No items</p>
        ) : (
          currentBarContent.map((c, index) => (
            <li key={c.id || index} className="sidebar-item-row">
              {editingId === c.id ? (
                <div className="sidebar-edit-row">
                  <input
                    className="sidebar-edit-input"
                    autoFocus
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmRename(c);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <button className="sidebar-icon-btn" title="Save" onClick={() => confirmRename(c)}>✓</button>
                  <button className="sidebar-icon-btn" title="Cancel" onClick={() => setEditingId(null)}>✕</button>
                </div>
              ) : (
                <>
                  <button className="sidebar-item-btn" onClick={() => onSelect(c)}>
                    {c.title}
                  </button>
                  <div className="sidebar-item-actions">
                    {confirmDeleteId === c.id ? (
                      <span className="sidebar-confirm-delete">
                        <button className="sidebar-confirm-yes" onClick={() => handleDelete(c)}>Yes</button>
                        <button className="sidebar-confirm-no" onClick={() => setConfirmDeleteId(null)}>No</button>
                      </span>
                    ) : (
                      <>
                        <button className="sidebar-icon-btn" title="Rename" onClick={() => startRename(c)}>✎</button>
                        <button className="sidebar-icon-btn delete" title="Delete" onClick={() => setConfirmDeleteId(c.id)}>🗑</button>
                      </>
                    )}
                  </div>
                </>
              )}
            </li>
          ))
        )}
      </ul>

      {currentState === "chats" ? (
        <button className="sidebar-add-btn" onClick={handleAddChat}>
          + New chat
        </button>
      ) : isAdding ? (
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
