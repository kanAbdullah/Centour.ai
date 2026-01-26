import { api, clearTokens } from "../api/ApiClient";

export default function SidebarBottomMenu(props) {

  const handleLogout = async () => {
    try {
      //await api.post("/logout"); // Backend'e logout isteği gönder
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      clearTokens(); // Token'ları temizle
      window.location.href = "/login"; // Kullanıcıyı login sayfasına yönlendir
    }
  };
  return (
    <div style={styles.sidebar_bottom_menu}>
      <button style={styles.button} onClick={props.resetChat}>Dashboard</button>
      <button style={styles.button}>Settings</button>
      <button style={styles.button} onClick={handleLogout}>Logout</button>
    </div >
  );
}
const styles = {
  sidebar_bottom_menu:
  {
    borderTop: "1px solid #444",
    paddingTop: "10px",
  },
  button:
  {
    width: "30%",
    padding: "10px",
    backgroundColor: "#3f3fff",
    border: "black",
    color: "white",
    borderRadius: "8px",
    cursor: "pointer",
  },
}