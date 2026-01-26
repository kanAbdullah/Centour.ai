import { useEffect, useState, useRef } from 'react';

export default function SideBarContentController(props) {

  const [currentBarContent, setcurrentBarContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentState, setCurrentState] = useState("studies");

  const studyIdRef = useRef(null);
  const topicIdRef = useRef(null);
  const chatIdRef = useRef(null);


  useEffect(() => {

    const token = localStorage.getItem("access_token");
    console.log("access_token in SideBarContentController.jsx:", token);
    if (!token) return;

    async function load() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/studies`, {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('Network err');
        const data = await res.json();
        setcurrentBarContent(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function onSelect(id) {
    console.log("Selected study ID:", id);
    console.log("currentstate:", currentState);

    let fetchUrl = "";

    if (currentState === "studies") {
      studyIdRef.current = id;
      fetchUrl = `${import.meta.env.VITE_API_URL}/topics/${id}`;
      setCurrentState("topics");
    } else if (currentState === "topics") {
      //this case for topic selection among the topics
      // that under the selected study
      topicIdRef.current = id;
      fetchUrl = `${import.meta.env.VITE_API_URL}/chats/${id}`;
      setCurrentState("chats");
    } else if (currentState === "chats") {
      /**
       * this case for chat selection among the chats
       * that under the selected topic
       */
      chatIdRef.current = id;
      props.onSelectChat?.(id); // burada chat seçimini bildir
      console.log("Chat selected, notifying parent with ID:", id);
    }
    console.log("Fetching URL:", fetchUrl);

    try {
      const res = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        }
      });
      if (!res.ok) throw new Error(`Network error: ${res.status}`);
      const data = await res.json();
      setcurrentBarContent(data);
    } catch (e) {
      console.error("Fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }

  async function goPreviousMenu(id) {
    console.log("Going back from currentstate:", currentState);

    let fetchUrl = ``;

    if (currentState === "chats") {
      fetchUrl = `${import.meta.env.VITE_API_URL}/topics/${studyIdRef.current}`;
      setCurrentState("topics");
    } else if (currentState === "topics") {
      fetchUrl = `${import.meta.env.VITE_API_URL}/studies`;
      setCurrentState("studies");
    }
    console.log("Fetching URL:", fetchUrl);

    try {
      const res = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          "authorization": `Bearer ${localStorage.getItem("access_token")}`
        }
      });
      if (!res.ok) throw new Error(`Network error: ${res.status}`);
      const data = await res.json();
      setcurrentBarContent(data);
    } catch (e) {
      console.error("Fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    let fetchUrl = "";
    let bodyData = {};

    // 1. Hangi state'teyiz, ona göre endpoint ve veri belirle
    if (currentState === "studies") {
      fetchUrl = `${import.meta.env.VITE_API_URL}/studies`;
      bodyData = { title: prompt("Yeni study ismi:") };
    }
    else if (currentState === "topics") {
      fetchUrl = `${import.meta.env.VITE_API_URL}/topics`;
      bodyData = {
        title: prompt("Yeni topic ismi:"),
        study_id: studyIdRef.current
      };
    }
    else if (currentState === "chats") {
      fetchUrl = `${import.meta.env.VITE_API_URL}/chats`;
      bodyData = {
        title: prompt("Yeni chat ismi:"),
        topic_id: topicIdRef.current
      };
    }

    if (!bodyData.title) return; // kullanıcı boş bırakırsa çık

    try {
      const res = await fetch(fetchUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) throw new Error(`Network error: ${res.status}`);

      const newItem = await res.json();

      // listeyi anında güncelle (UI refresh için)
      setcurrentBarContent([...currentBarContent, { id: newItem.id, title: bodyData.title }]);
    } catch (e) {
      console.error("POST failed:", e);
    }
  }


  return (
    <div>
      <button onClick={() => goPreviousMenu()}>Back Menu</button>
      <h2>Geçmiş Chatler</h2>
      {loading && <p>Yükleniyor…</p>}

      <ul>
        {currentBarContent.length === 0 ? (
          <p>No items available</p>
        ) : (
          currentBarContent.map((c, index) => (
            <li key={c.id || index}>
              <button onClick={() => onSelect?.(c.id)}>{c.title}</button>
            </li>
          ))
        )}
      </ul>
      <button onClick={() => handleAdd()}>
        + Add {
          (() => {
            if (currentState === "studies") return "study";
            else if (currentState === "topics") return "topic";
            else if (currentState === "chats") return "chat";
          })()
        }
      </button>
    </div>
  )
}