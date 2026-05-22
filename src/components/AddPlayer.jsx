import React, { useState } from "react";

const AddPlayer = ({ onAddPlayer }) => {
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;

    const newPlayer = {
      id: Date.now(),
      name: name.trim(),
    };

    onAddPlayer(newPlayer);

    setName("");
    setOpen(false);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} style={addBtn}>
        + Add Player
      </button>

      {open && (
        <div style={overlay}>
          <div style={modal}>
            <div style={closeBtn} onClick={() => setOpen(false)}>
              ✕
            </div>

            <div style={title}>Add Player</div>

            <input
              placeholder="Player Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />

            <button onClick={handleSubmit} style={submitBtn}>
              Add Player
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AddPlayer;

const addBtn = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: "linear-gradient(135deg, #22c55e, #4ade80)",
  color: "#000",
  fontWeight: 700,
  cursor: "pointer",
};

const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modal = {
  background: "#0f172a",
  padding: 20,
  borderRadius: 16,
  width: 520,
  position: "relative",
  boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
  animation: "fadeIn 0.25s ease",
};

const closeBtn = {
  position: "absolute",
  top: 10,
  right: 12,
  cursor: "pointer",
  color: "#aaa",
  fontSize: 16,
};

const title = {
  color: "#fff",
  fontWeight: 700,
  marginBottom: 12,
  fontSize: 16,
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: 10,
  borderRadius: 10,
  border: "1px solid #334155",
  background: "#020617",
  color: "#fff",
};

const submitBtn = {
  width: "100%",
  padding: "10px",
  borderRadius: 10,
  border: "none",
  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};
