import { Container } from "postcss";
import { react } from "react";

export default function Dashboard(props) {
    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Studies</h2>
        </div>
    )
}

const styles = {
    container: {
        top: "0px",
        left: "250px",
        height: "7vh",
        width: "calc(100% - 250px)",
        position: "fixed",
        padding: "10px",
        backgroundColor: "#56569eff",
    },
    title: {
        color: "white",
        textAlign: "left",
        marginLeft: "20px",
    }
};