import { React, use, useEffect, useState } from "react";
import SidebarBottomMenu from "./SidebarBottomMenu";
import SideBarContentController from "./SideBarContentController";

export default function Sidebar(props) {
  const [onSelectChat, setOnSelectChat] = useState(null);

  useEffect(() => {
    console.log("Sidebar comp id:", onSelectChat);
    props.onSelectChat?.(onSelectChat);
  }, [onSelectChat]);
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Sidebar</h2>
      <SideBarContentController onSelectChat={setOnSelectChat} />
      <SidebarBottomMenu resetChat={props.resetChat} />
    </div>
  );
}

const styles = {
  container: {
    position: " fixed",
    top: "0",
    left: "0",
    width: "250px",
    height: "100vh",
    backgroundColor: "#56569eff",
    color: "white",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "15px",
    boxSizing: "border-box",
  },
  title: {
    textAlign: "center",
    marginBottom: "20px",
    borderBottom: "1px solid #444",
    paddingBottom: "10px",
  },
};
