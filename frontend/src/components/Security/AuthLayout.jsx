// Authentication layout component for login/register pages
const AuthLayout = ({ title, children }) => {
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>{title}</h2>
        {children}
      </div>
    </div>
  );
};

// Inline styles for the auth layout
const styles = {
  wrapper: {
    minHeight: "90vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "16px",
    background: "linear-gradient(135deg, #0f766e, #2563eb)"
  },

  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#fff",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,.2)"
  },

  title: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#0f172a",
    fontSize: "1.5rem",
    fontWeight: "600"
  }
};

export default AuthLayout;