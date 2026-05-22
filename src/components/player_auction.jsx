import { useState, useEffect, useRef } from "react";
import AddPlayer from "./AddPlayer";

const CAPTAIN_COLORS = [
  { color: "#00C9FF", accent: "#0066FF" },
  { color: "#FF6B35", accent: "#FF2D55" },
  { color: "#FFD700", accent: "#FF9500" },
  { color: "#9B59B6", accent: "#6C3483" },
  { color: "#2ECC71", accent: "#1ABC9C" },
  { color: "#E74C3C", accent: "#C0392B" },
  { color: "#F39C12", accent: "#D68910" },
  { color: "#1ABC9C", accent: "#16A085" },
];


function Particle({ x, y, color }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        pointerEvents: "none",
        animation: "particlePop 0.8s ease-out forwards",
      }}
    />
  );
}

export default function Auction() {
  const [playerIndex, setPlayerIndex] = useState(0);
  const [bids, setBids] = useState({});
  const [soldPlayers, setSoldPlayers] = useState([]);

  const [flashCap, setFlashCap] = useState(null);
  const [particles, setParticles] = useState([]);
  const [soldAnim, setSoldAnim] = useState(false);
  const [timer, setTimer] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);
  const [captains, setCaptains] = useState([]);
  const [PLAYERS, setPlayers] = useState([]);
  const [showLoading, setLoading] = useState(false);
  const [auctionName, setAuctionName] = useState("");
  const [setupDone, setSetupDone] = useState(false);
  const [captainInputs, setCaptainInputs] = useState([{ name: "" }]);
  const [budget, setBudget] = useState(20000);

  const currentPlayer = PLAYERS[playerIndex];
  const currentBids = bids[currentPlayer?.id] || {};
  const highestBid = Object.values(currentBids).length
    ? Math.max(...Object.values(currentBids))
    : 0;
  const highestCap = Object.entries(currentBids).find(
    ([, v]) => v === highestBid
  )?.[0];
  const highestCapObj = captains.find(
    (c) => String(c.id) === String(highestCap)
  );

  useEffect(() => {
    if (timerActive && timer > 0) {
      timerRef.current = setTimeout(() => setTimer((t) => t - 1), 1000);
      
    }
    return () => clearTimeout(timerRef.current);
  }, [timer, timerActive]);

  useEffect(() => {
    const storedSetup = localStorage.getItem("auctionSetup");
    if (storedSetup) {
      const { auctionName: name, captains: caps, budget: b } = JSON.parse(storedSetup);
      setAuctionName(name || "CPL Auction");
      setCaptains(caps || []);
      setBudget(b || 20000);
      setSetupDone(true);
    }

    const storedData = localStorage.getItem("auctionData");
    if (storedData) {
      const { soldPlayers, bids } = JSON.parse(storedData);
      setSoldPlayers(soldPlayers || []);
      setBids(bids || {});
    }
  }, []);

  const spawnParticles = (color) => {
    const newP = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 600,
      y: Math.random() * 300,
      color,
    }));
    setParticles(newP);
    setTimeout(() => setParticles([]), 900);
  };

  const placeBid = (captainId, amount) => {
    const captain = captains.find((c) => c.id === captainId);

    if (!amount || isNaN(amount) || amount <= highestBid) return;

    // if (amount > remaining) {
    //   alert("Not enough balance");
    //   return;
    // }

    setBids((prev) => ({
      ...prev,
      [currentPlayer.id]: {
        ...(prev[currentPlayer.id] || {}),
        [captainId]: Number(amount),
      },
    }));

    setFlashCap(captainId);
    setTimeout(() => setFlashCap(null), 600);

    spawnParticles(captain?.color || "#fff");

    setTimer(30);
    setTimerActive(true);
  };

  const handleSold = () => {
    if (!highestCapObj) return;

    setSoldAnim(true);
    spawnParticles(highestCapObj.color);

    setTimeout(() => {
      // ✅ update captains (budget deduction)
      const updatedCaptains = captains.map((c) =>
        c.id === highestCapObj.id ? { ...c, spent: c.spent + highestBid } : c
      );
      setCaptains(updatedCaptains);

      // ✅ new sold entry
      const newEntry = {
        player: currentPlayer,
        winner: highestCapObj,
        amount: highestBid,
      };

      const updatedSoldPlayers = [...soldPlayers, newEntry];
      setSoldPlayers(updatedSoldPlayers);

      // ✅ 🔥 STORE in localStorage
      localStorage.setItem(
        "auctionData",
        JSON.stringify({
          soldPlayers: updatedSoldPlayers,
          bids,
        })
      );

      localStorage.setItem(
        "auctionSetup",
        JSON.stringify({ auctionName, captains: updatedCaptains })
      );
      setBids((prev) => {
        const updatedBids = { ...prev };
        delete updatedBids[currentPlayer.id];
        return updatedBids;
      });
      setSoldAnim(false);
      setTimerActive(false);
      setTimer(30);
      setPlayers([]);
      setLoading(true)

      if (playerIndex + 1 < PLAYERS.length) {
        setPlayerIndex((i) => i + 1);
      }
    }, 2000);

  };

  useEffect(() => {
    if (showLoading) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000); // Simulate loading for 2 seconds

      return () => clearTimeout(timer);
    } 
  },[showLoading])

  const handleUnsold = () => {
    setTimerActive(false);
    setTimer(30);
    if (playerIndex + 1 < PLAYERS.length) setPlayerIndex((i) => i + 1);
  };

  const groupedPlayers = soldPlayers.reduce((acc, entry) => {
    const key = entry.winner?.short || "UNSOLD";

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(entry);
    return acc;
  }, {});
console.log('cap', groupedPlayers)
  const handleAddPlayer = (player) => {
    setPlayers((prev) => [...prev, player]);
  };

  const teamNames = Object.fromEntries(
    captains.map((c) => [c.short, `${c.name}'s Team`])
  );


const handleRemovePlayer = (playerId) => {
  // Remove from soldPlayers
  const updatedSoldPlayers = soldPlayers.filter(
    (p) => p.player.id !== playerId
  );

  // (Optional) also remove captain if needed
  const updatedCaptains = captains.filter(
    (c) => c.player?.id !== playerId
  );

  // Update state
  setSoldPlayers(updatedSoldPlayers);
  setCaptains(updatedCaptains);

  // Update localStorage
  localStorage.setItem(
    "auctionData",
    JSON.stringify({
      soldPlayers: updatedSoldPlayers,
      bids,
    })
  );

  localStorage.setItem(
    "auctionSetup",
    JSON.stringify({ auctionName, captains: updatedCaptains })
  );
};

  const handleAddCaptain = () => {
    if (captainInputs.length >= 8) return;
    setCaptainInputs([...captainInputs, { name: "" }]);
  };

  const handleRemoveCaptain = (index) => {
    if (captainInputs.length <= 1) return;
    setCaptainInputs(captainInputs.filter((_, i) => i !== index));
  };

  const handleCaptainNameChange = (index, value) => {
    const updated = [...captainInputs];
    updated[index] = { name: value };
    setCaptainInputs(updated);
  };

  const handleSetupSubmit = () => {
    const names = captainInputs
      .map((c) => c.name.trim())
      .filter((n) => n.length > 0);
    if (!auctionName.trim()) return;
    if (names.length === 0) return;

    const newCaptains = names.map((name, i) => ({
      id: i + 1,
      name,
      short: name.slice(0, 3).toUpperCase(),
      color: CAPTAIN_COLORS[i % CAPTAIN_COLORS.length].color,
      accent: CAPTAIN_COLORS[i % CAPTAIN_COLORS.length].accent,
      budget: Number(budget),
      spent: 0,
    }));

    setCaptains(newCaptains);
    setSetupDone(true);
    localStorage.setItem(
      "auctionSetup",
      JSON.stringify({ auctionName, captains: newCaptains, budget: Number(budget) })
    );
  };

  return (
    <div>
      {!setupDone ? (
        <div
          style={{
            minHeight: "100vh",
            background: "#0A0A0F",
            fontFamily: "'Syne', sans-serif",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');
            ::-webkit-scrollbar { width: 4px; }
            ::-webkit-scrollbar-track { background: #111; }
            ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
          `}</style>
          <div
            style={{
              background: "linear-gradient(135deg, #13131A 0%, #1C1C2E 100%)",
              border: "1px solid #2a2a3a",
              borderRadius: 20,
              padding: "40px 48px",
              maxWidth: 520,
              width: "100%",
              margin: 20,
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: 6,
                color: "#555",
                marginBottom: 8,
                fontFamily: "'Space Mono', monospace",
                textAlign: "center",
              }}
            >
              AUCTION SETUP
            </div>
            <h1
              style={{
                fontSize: 32,
                fontWeight: 800,
                margin: "0 0 24px",
                textAlign: "center",
                background: "linear-gradient(135deg, #fff 0%, #888 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Configure Your Auction
            </h1>

            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 12,
                  color: "#888",
                  marginBottom: 6,
                  fontFamily: "'Space Mono', monospace",
                  letterSpacing: 1,
                }}
              >
                AUCTION NAME
              </div>
              <input
                placeholder="Enter auction name"
                value={auctionName}
                onChange={(e) => setAuctionName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid #2a2a3a",
                  background: "#0A0A0F",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 600,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 12,
                  color: "#888",
                  marginBottom: 6,
                  fontFamily: "'Space Mono', monospace",
                  letterSpacing: 1,
                }}
              >
                BUDGET PER CAPTAIN
              </div>
              <input
                type="number"
                placeholder="Enter budget"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid #2a2a3a",
                  background: "#0A0A0F",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 600,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 12,
                  color: "#888",
                  marginBottom: 6,
                  fontFamily: "'Space Mono', monospace",
                  letterSpacing: 1,
                }}
              >
                CAPTAINS ({captainInputs.length}/8)
              </div>
              {captainInputs.map((cap, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 8,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background:
                        CAPTAIN_COLORS[i % CAPTAIN_COLORS.length].color + "33",
                      border: `2px solid ${
                        CAPTAIN_COLORS[i % CAPTAIN_COLORS.length].color
                      }`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      fontWeight: 700,
                      color: CAPTAIN_COLORS[i % CAPTAIN_COLORS.length].color,
                      flexShrink: 0,
                    }}
                  >
                    {cap.name ? cap.name.slice(0, 3).toUpperCase() : `C${i + 1}`}
                  </div>
                  <input
                    placeholder={`Captain ${i + 1} name`}
                    value={cap.name}
                    onChange={(e) => handleCaptainNameChange(i, e.target.value)}
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #2a2a3a",
                      background: "#0A0A0F",
                      color: "#fff",
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                  {captainInputs.length > 1 && (
                    <button
                      onClick={() => handleRemoveCaptain(i)}
                      style={{
                        background: "none",
                        border: "1px solid #ff4d4f44",
                        borderRadius: 8,
                        color: "#ff4d4f",
                        cursor: "pointer",
                        padding: "6px 10px",
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {captainInputs.length < 8 && (
                <button
                  onClick={handleAddCaptain}
                  style={{
                    background: "none",
                    border: "1px dashed #2a2a3a",
                    borderRadius: 10,
                    color: "#888",
                    cursor: "pointer",
                    padding: "10px 14px",
                    fontSize: 13,
                    width: "100%",
                    marginTop: 4,
                  }}
                >
                  + Add Captain
                </button>
              )}
            </div>

            <button
              onClick={handleSetupSubmit}
              disabled={
                !auctionName.trim() ||
                captainInputs.filter((c) => c.name.trim()).length === 0
              }
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 10,
                border: "none",
                background:
                  auctionName.trim() &&
                  captainInputs.filter((c) => c.name.trim()).length > 0
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : "#1a1a1a",
                color:
                  auctionName.trim() &&
                  captainInputs.filter((c) => c.name.trim()).length > 0
                    ? "#fff"
                    : "#555",
                fontWeight: 700,
                fontSize: 16,
                cursor:
                  auctionName.trim() &&
                  captainInputs.filter((c) => c.name.trim()).length > 0
                    ? "pointer"
                    : "not-allowed",
                fontFamily: "'Syne', sans-serif",
                letterSpacing: 1,
              }}
            >
              Start Auction
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            minHeight: "100vh",
            background: "#0A0A0F",
            fontFamily: "'Syne', sans-serif",
            color: "#fff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        @keyframes particlePop { 0%{transform:scale(0) translateY(0);opacity:1} 100%{transform:scale(1) translateY(-60px);opacity:0} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes flash { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes soldBounce { 0%{transform:scale(0.5) rotate(-10deg);opacity:0} 60%{transform:scale(1.1) rotate(4deg)} 100%{transform:scale(1) rotate(-2deg);opacity:1} }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,0.2)} 50%{box-shadow:0 0 0 12px rgba(255,255,255,0)} }
        @keyframes glow { 0%,100%{text-shadow:0 0 20px currentColor} 50%{text-shadow:0 0 40px currentColor,0 0 80px currentColor} }
        @keyframes timerPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .bid-btn:hover { filter: brightness(1.2); transform: scale(1.02); }
        .bid-btn:active { transform: scale(0.97); }
        .bid-input:focus { outline: none; box-shadow: 0 0 0 2px var(--cap-color); }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #111; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>

          {/* Background grid */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
              pointerEvents: "none",
            }}
          />

          {/* Particles */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              pointerEvents: "none",
              zIndex: 99,
            }}
          >
            {particles.map((p) => (
              <Particle key={p.id} {...p} />
            ))}
          </div>

          <div
            style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 20px" }}
          >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: 6,
                  color: "#555",
                  marginBottom: 8,
                  fontFamily: "'Space Mono', monospace",
                }}
              >
                LIVE PLAYER AUCTION
              </div>
              <h1
                style={{
                  fontSize: 42,
                  fontWeight: 800,
                  margin: 0,
                  background: "linear-gradient(135deg, #fff 0%, #888 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {auctionName}
              </h1>
              <div
                style={{
                  height: 2,
                  width: 80,
                  background:
                    "linear-gradient(90deg, transparent, #fff, transparent)",
                  margin: "12px auto 0",
                }}
              />
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={() => {
                    localStorage.removeItem("auctionSetup");
                    localStorage.removeItem("auctionData");
                    setSetupDone(false);
                    setCaptains([]);
                    setSoldPlayers([]);
                    setBids({});
                    setPlayers([]);
                    setCaptainInputs([{ name: "" }]);
                    setAuctionName("");
                    setBudget(20000);
                  }}
                  style={{
                    background: "none",
                    border: "1px solid #2a2a3a",
                    borderRadius: 8,
                    color: "#ffffff",
                    cursor: "pointer",
                    padding: "4px 12px",
                    fontSize: 11,
                    fontFamily: "'Space Mono', monospace",
                    letterSpacing: 1,
                  }}
                >
                  ⚙ RECONFIGURE
                </button>
              </div>
            </div>

            <div style={{ padding: 20, display: "flex", gap: 12, alignItems: "center", justifyContent: "center" }}>
              <AddPlayer onAddPlayer={handleAddPlayer} />
            </div>

            {currentPlayer ? (
              <div style={{ animation: "fadeSlideUp 0.5s ease" }}>
                {/* Player Card */}
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #13131A 0%, #1C1C2E 100%)",
                    border: "1px solid #2a2a3a",
                    borderRadius: 20,
                    padding: "32px 40px",
                    marginBottom: 24,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {soldAnim && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(0,0,0,0.85)",
                        zIndex: 10,
                        animation: "fadeSlideUp 0.3s ease",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 72,
                          fontWeight: 800,
                          color: highestCapObj?.color,
                          animation: "soldBounce 0.8s ease",
                          textShadow: `0 0 40px ${highestCapObj?.color}`,
                        }}
                      >
                        SOLD!
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 16,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          letterSpacing: 4,
                          color: "#555",
                          marginBottom: 8,
                          fontFamily: "'Space Mono', monospace",
                        }}
                      >
                        PLAYER {playerIndex + 1} OF {PLAYERS.length}
                      </div>
                      <div
                        style={{
                          fontSize: 52,
                          fontWeight: 800,
                          lineHeight: 1.1,
                          marginBottom: 8,
                        }}
                      >
                        {currentPlayer.name}
                      </div>
                    </div>

                    {/* Highest bid display */}
                    <div style={{ textAlign: "right" }}>
                      {highestBid > 0 ? (
                        <div style={{ animation: "fadeSlideUp 0.3s ease" }}>
                          <div
                            style={{
                              fontSize: 11,
                              letterSpacing: 3,
                              color: "#555",
                              marginBottom: 4,
                              fontFamily: "'Space Mono', monospace",
                            }}
                          >
                            HIGHEST BID
                          </div>
                          <div
                            style={{
                              fontSize: 48,
                              fontWeight: 800,
                              color: highestCapObj?.color,
                              animation: "glow 2s ease infinite",
                              lineHeight: 1,
                            }}
                          >
                            ₹{highestBid.toLocaleString()}
                          </div>
                          <div
                            style={{
                              marginTop: 6,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              gap: 8,
                            }}
                          >
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: highestCapObj?.color + "33",
                                border: `2px solid ${highestCapObj?.color}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 10,
                                fontWeight: 700,
                                color: highestCapObj?.color,
                              }}
                            >
                              {highestCapObj?.short}
                            </div>
                            <span style={{ fontSize: 14, color: "#ccc" }}>
                              {highestCapObj?.name}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            fontSize: 14,
                            color: "#444",
                            fontFamily: "'Space Mono', monospace",
                          }}
                        >
                          NO BIDS YET
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timer */}
                  {timerActive && (
                    <div
                      style={{
                        marginTop: 20,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          height: 4,
                          background: "#1a1a2e",
                          borderRadius: 2,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${(timer / 30) * 100}%`,
                            background:
                              timer <= 5
                                ? "#FF2D55"
                                : timer <= 10
                                ? "#FF9500"
                                : "#00C9FF",
                            transition: "width 1s linear, background 0.3s",
                            borderRadius: 2,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: 13,
                          color: timer <= 5 ? "#FF2D55" : "#888",
                          animation:
                            timer <= 5 ? "timerPulse 0.5s infinite" : "none",
                          minWidth: 28,
                        }}
                      >
                        {timer}s
                      </span>
                    </div>
                  )}
                </div>

                {/* Captains Bidding Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                    gap: 14,
                    marginBottom: 20,
                  }}
                >
                  {captains.map((cap) => {
                    const capBid = currentBids[cap.id] || 0;
                    const isHighest = capBid === highestBid && highestBid > 0;
                    const isFlashing = flashCap === cap.id;
                    return (
                      <div
                        key={cap.id}
                        style={{
                          "--cap-color": cap.color,
                          background: isHighest ? cap.color + "18" : "#13131A",
                          border: `1.5px solid ${
                            isHighest ? cap.color : "#2a2a3a"
                          }`,
                          borderRadius: 14,
                          padding: "18px 16px",
                          animation: isFlashing ? "flash 0.3s ease 2" : "none",
                          transition: "all 0.3s ease",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        {isHighest && (
                          <div
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              height: 2,
                              background: `linear-gradient(90deg, transparent, ${cap.color}, transparent)`,
                            }}
                          />
                        )}

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 14,
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: cap.color + "22",
                              border: `2px solid ${cap.color}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              fontWeight: 700,
                              color: cap.color,
                              flexShrink: 0,
                            }}
                          >
                            {cap.short}
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 23,
                                fontWeight: 700,
                                lineHeight: 1.2,
                              }}
                            >
                              {cap.name}
                            </div>
                            {capBid > 0 && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color: cap.color,
                                  fontFamily: "'Space Mono', monospace",
                                }}
                              >
                                ₹{capBid.toLocaleString()}
                              </div>
                            )}
                          </div>
                          {isHighest && (
                            <div
                              style={{
                                marginLeft: "auto",
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: cap.color,
                                animation: "pulse 1.5s infinite",
                              }}
                            />
                          )}
                        </div>

                        <div style={{ display: "flex", gap: 6 }}>
                            {[100, 200, 500, 1000].map((inc) => (
                              <button
                                key={inc}
                                className="bid-btn"
                                onClick={() => {
                                  const newBid = highestBid + inc; // 🔥 add to current
                                  placeBid(cap.id, newBid);
                                }}
                                style={{
                                  background: cap.color,
                                  border: "none",
                                  borderRadius: 8,
                                  padding: "7px 10px",
                                  color: "#000",
                                  fontWeight: 700,
                                  fontSize: 12,
                                  cursor: "pointer",
                                }}
                              >
                                +₹{inc}
                              </button>
                            ))}
                          </div>
                      </div>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div
                  style={{ display: "flex", gap: 12, justifyContent: "center" }}
                >
                  <button
                    onClick={handleSold}
                    disabled={!highestBid}
                    style={{
                      background: highestBid ? "#FFD700" : "#1a1a1a",
                      border: `1px solid ${highestBid ? "#FFD700" : "#333"}`,
                      borderRadius: 10,
                      padding: "14px 40px",
                      color: highestBid ? "#000" : "#555",
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: highestBid ? "pointer" : "not-allowed",
                      fontFamily: "'Syne', sans-serif",
                      letterSpacing: 1,
                      transition: "all 0.2s",
                    }}
                  >
                    🔨 SOLD
                  </button>
                  <button
                    onClick={handleUnsold}
                    style={{
                      background: "#1a1a1a",
                      border: "1px solid #555",
                      borderRadius: 10,
                      padding: "14px 40px",
                      color: "#aaa",
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: "pointer",
                      fontFamily: "'Syne', sans-serif",
                      letterSpacing: 1,
                      transition: "all 0.2s",
                    }}
                  >
                    ✗ UNSOLD
                  </button>
                </div>
              </div>
            ) : (
              /* Final Results */
              <div style={{ animation: "fadeSlideUp 0.5s ease" }}>
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      background: "linear-gradient(135deg, #FFD700, #FF9500)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Stop wasting time. Send the next player.
                  </div>
                </div>
              </div>
            )}

            {/* Sold Players Log */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 20,
                marginTop: 20,
              }}
            >
              {Object.keys(groupedPlayers).map((teamKey, index) => {
                const teamPlayers = groupedPlayers[teamKey];
                return (
                  <div key={teamKey}>
                    {/* Team Header */}
                 <div
                        style={{
                          textAlign: "center",
                          marginBottom: 12,
                          padding: "10px 14px",
                          borderRadius: 12,
                          fontWeight: 800,
                          fontSize: 18,
                          letterSpacing: 1.5,

                          // 🔥 Background
                          background: "linear-gradient(135deg, #0f172a, #1e293b)",

                          // 🔥 Border
                          border: "1px solid rgba(0, 230, 255, 0.3)",

                          // 🔥 Glow effect
                          boxShadow: "0 0 12px rgba(0, 230, 255, 0.2)",

                          // 🔥 Text color
                          color: "#00e6ff",

                          // smooth look
                          backdropFilter: "blur(6px)",
                        }}
                      >
                        <div>
                          {teamNames[teamKey] || "UNSOLD PLAYERS"}

                          {captains.map(c => c.short).includes(teamKey) && (
                            <span
                              style={{
                                marginLeft: 6,
                                color: "#ffffff",
                                fontWeight: 700,
                                textShadow: "0 0 8px rgba(34,197,94,0.6)",
                                fontSize: 20,
                                fontFamily: "airly, sans-serif",
                              }}
                            >
                              - ₹{(
                                (captains.find(c => c.short === teamKey)?.budget || 20000) -
                                teamPlayers.reduce((sum, p) => sum + p.amount, 0)
                              ).toLocaleString()}
                            </span>
                          )}{(teamPlayers.length)}
                        </div>
                      </div>

                    {/* Players Vertical Stack */}
                  {teamPlayers.map((entry, i) => (
  <div
    key={i}
    style={{
      background: "#13131A",
      border: "1px solid #1e1e2e",
      borderRadius: 10,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      position: "relative", // 👈 important
      padding: 10,
    }}
  >
    {/* ❌ Remove Button */}
    <div
      onClick={() => handleRemovePlayer(entry.player.id)}
      style={{
        position: "absolute",
        top: 5,
        right: 8,
        cursor: "pointer",
        color: "#ff4d4f",
        fontSize: 14,
        fontWeight: "bold",
      }}
    >
      ✖
    </div>

    {/* Player Name */}
    <div
      style={{
        fontSize: 28,
        fontWeight: 700,
        color: "#fff",
      }}
    >
      {entry.player.name}
    </div>

    {/* Price */}
    {entry.winner ? (
      <div
        style={{
          fontSize: 23,
          marginTop: 4,
          fontWeight: 600,
          color: entry.winner.color,
          fontFamily: "'Space Mono', monospace",
        }}
      >
        ₹{entry.amount.toLocaleString()}
      </div>
    ) : (
      <div
        style={{
          fontSize: 12,
          marginTop: 4,
          color: "#555",
        }}
      >
        UNSOLD
      </div>
    )}
  </div>
))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
