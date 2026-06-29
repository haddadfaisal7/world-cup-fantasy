import "./App.css";
import { useState, useEffect } from "react";
import { auth } from "./firebase";
import { db } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";

function App() {
const [user, setUser] = useState(null);
const [page, setPage] = useState("home");
const [picks, setPicks] = useState({}); 
const [playerPicks, setPlayerPicks] = useState({});
const [leaderboard, setLeaderboard] = useState([]);
const [points, setPoints] = useState(0);
const [todaysMatches, setTodaysMatches] = useState([]);
const [scorePicks, setScorePicks] = useState({});
const [adminMatchId, setAdminMatchId] = useState("");
const [selectedMatch, setSelectedMatch] = useState("");
const [allPredictions, setAllPredictions] = useState([]);
const [communityStats, setCommunityStats] = useState([]);
const [adminWinner, setAdminWinner] = useState(""); 
const [adminTeam1Score, setAdminTeam1Score] = useState("");
const [adminTeam2Score, setAdminTeam2Score] = useState("");
const [adminPlayerGoals, setAdminPlayerGoals] = useState("");
useEffect(() => {
  loadMatches("matches");
  loadLeaderboard();
  loadAllPredictions();
loadCommunityStats();
}, []);
const upcomingMatches = [...todaysMatches]
  .filter((match) => new Date(match.kickoffTime || match.kickofftime) > new Date())
  .sort(
    (a, b) =>
      new Date(a.kickoffTime || a.kickofftime) -
      new Date(b.kickoffTime || b.kickofftime)
  
  );
const latestResults = [...todaysMatches]
  .filter((match) => match.completed === true)
  .sort(
    (a, b) =>
      new Date(b.kickoffTime || b.kickofftime) -
      new Date(a.kickoffTime || a.kickofftime)
  );
  const flags = {
  Mexico: "mx",
  "South Africa": "za",
  "South Korea": "kr",
  Czechia: "cz",

  Canada: "ca",
  Bosnia: "ba",
  Qatar: "qa",
  Switzerland: "ch",

  Brazil: "br",
  Morocco: "ma",
  Haiti: "ht",
  Scotland: "gb-sct",

  USA: "us",
  Paraguay: "py",
  Australia: "au",
  Turkey: "tr",

  Germany: "de",
  Curacao: "cw",
  Ecuador: "ec",
  "Ivory Coast": "ci",

  Netherlands: "nl",
  Japan: "jp",
  Sweden: "se",
  Tunisia: "tn",

  Belgium: "be",
  Egypt: "eg",
  Iran: "ir",
  "New Zealand": "nz",

  Spain: "es",
  "Cape Verde": "cv",
  "Saudi Arabia": "sa",
  Uruguay: "uy",

  France: "fr",
  Senegal: "sn",
  Iraq: "iq",
  Norway: "no",

  Argentina: "ar",
  Algeria: "dz",
  Austria: "at",
  Jordan: "jo",

  Portugal: "pt",
  "DR Congo": "cd",
  Uzbekistan: "uz",
  Colombia: "co",

  England: "gb-eng",
  Croatia: "hr",
  Ghana: "gh",
  Panama: "pa"
};
const ADMIN_EMAIL = "haddad.faisal7@gmail.com";
if (page === "predictions") {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px",
        background: "linear-gradient(180deg, #dff4ff 0%, #ccecff 100%)",
        color: "#102525",
        textAlign: "center",
      }}
    >
      <h1>👥 Everyone's Predictions</h1>

      <button onClick={() => setPage("matches")}>Back</button>

      <div style={{ marginTop: "25px" }}>
        {allPredictions.length === 0 ? (
          <p>No predictions yet for this match.</p>
        ) : (
          allPredictions.map((pick, index) => (
            <div
              key={index}
              style={{
                background: "rgba(255,255,255,0.9)",
                borderRadius: "18px",
                padding: "16px",
                margin: "14px auto",
                maxWidth: "550px",
                boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
              }}
            >
              <h3>{pick.name || pick.user}</h3>
              <p>🏆 Winner: {pick.winner || "None"}</p>
              <p>
                📊 Score: {pick.scorePrediction?.team1 ?? "-"} -{" "}
                {pick.scorePrediction?.team2 ?? "-"}
              </p>
              <p>⚽ Player: {pick.playerPick || "None"}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
if (page === "myPicks") {
  return (
    <div style={{ padding: "20px", color: "white", background: "#0f172a", minHeight: "100vh" }}>
      <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  }}
>
  <h1 style={{ margin: 0 }}>📋 My Picks</h1>

  <button
    onClick={() => setPage("home")}
    style={{
      background: "white",
      color: "1e293b",
      border: "1xp solid #dbeafe",
      borderRadius: "999px",
      padding: "10px 20px",
      cursor: "pointer",
      fontWeight: "600",
    }}
  >
    ← Home
  </button>
</div>

<p style={{ color: "#dbeafe", marginBottom: "25px" }}>
  {Object.keys(picks).length} predictions locked in.
</p>
      
      

      {Object.entries(picks).length === 0 ? (
        <p>No picks yet.</p>
      ) : (
        Object.entries(picks).map(([matchId, choice]) => (
          <div
            key={matchId}
            style={{
              background: "rgba(255,255,255,0.12)",
              padding: "15px",
              borderRadius: "12px",
              marginBottom: "12px",
              width: "300px"
            }}
          >
            <h3>{choice.matchName}</h3>
            <p>Winner: {choice.winner}</p>
<p>Score: {choice.score1} - {choice.score2}</p>
<p>⚽ Player: {choice.player}</p>
          </div>
        ))
      )}
    </div>
  );
}
const signIn = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    setUser(result.user);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };


const savePick = async (matchId, choice) => {
  setPicks((prev) => ({
  ...prev,
  [matchId]: choice,
}));
  const existingDoc = await getDoc(
    doc(db, "picks", user.uid + "_" + matchId)
  );

  if (existingDoc.exists()) {
    alert("🔒 Pick already locked!");
    return;
  }

   
  setPicks((prev) => ({
  ...prev,
  [matchId]: choice,
}));

const selectedMatch = todaysMatches.find(
  m => m.id === matchId
);
  await setDoc(doc(db, "picks", user.uid + "_" + matchId), {
  userId: user.uid,
  name: user.displayName,
  matchId: matchId,
  matchName: selectedMatch
  ? `${selectedMatch.team1} vs ${selectedMatch.team2}`
  : matchId,
  winnerPick: choice,
  playerPick: playerPicks[matchId] || "",
  scorePrediction: scorePicks[matchId] || {
    team1: 0,
    team2: 0,
  },
  points: 0,
});

  alert("Pick saved!");
};
const loadMatches = async (nextPage = "Matches") => {
  console.log("LOAD MATCHES CLICKED");
  const q = collection(db, "Matches");
  
  

const snapshot = await getDocs(q);

 const matches = snapshot.docs.map((doc) => ({
  id: doc.id,
  ...doc.data(),
}));

setTodaysMatches(matches);
setPage(nextPage);
};

 const loadPick = async () => {
  const snapshot = await getDocs(collection(db, "picks"));

  const userPicks = {};

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
   const match = todaysMatches.find(
  m => m.id === data.matchId
);
   if (data.userId === user.uid) {
      userPicks[data.matchId] = {
  matchName: match
    ? `${match.team1} vs ${match.team2}`
    : data.matchId,
  winner: data.winnerPick,
  player: data.playerPick,
  score1: data.scorePrediction?.team1 ?? 0,
  score2: data.scorePrediction?.team2 ?? 0,
};
    }
  });
console.log("USER PICKS:", userPicks);
  setPicks(userPicks);
  setPage("myPicks");

};
const saveResult = async () => {
  await setDoc(doc(db, "results", adminMatchId), {
    winner: adminWinner,
    team1Score: Number(adminTeam1Score),
    team2Score: Number(adminTeam2Score),
    playerGoals: adminPlayerGoals,
    completed: true,
  });

  await setDoc(
    doc(db, "Matches", adminMatchId),
    {
      winner: adminWinner,
      team1Score: Number(adminTeam1Score),
      team2Score: Number(adminTeam2Score),
      playerGoals: adminPlayerGoals,
      completed: true,
    },
    { merge: true }
  );


const picksSnapshot = await getDocs(collection(db, "picks"));

picksSnapshot.docs.forEach(async (pickDoc) => {
  const pick = pickDoc.data();

  if (pick.matchId === adminMatchId) {
    const exactScore =
      Number(pick.scorePrediction?.team1) === Number(adminTeam1Score) &&
      Number(pick.scorePrediction?.team2) === Number(adminTeam2Score);

    await setDoc(
      doc(db, "picks", pickDoc.id),
      { exactScore: exactScore },
      { merge: true }
    );
  }
});


  alert("Result saved!");
  loadMatches("matches");
};

  
const loadAllPredictions = async () => {
  const snapshot = await getDocs(collection(db, "picks"));

  const data = snapshot.docs.map((doc) => doc.data());

  setAllPredictions(data);
  setPage("allpredictions");
};
const loadCommunityStats = async () => {
  const picksSnapshot = await getDocs(collection(db, "picks"));
  const matchesSnapshot = await getDocs(collection(db, "Matches"));

  const picksData = picksSnapshot.docs.map((doc) => doc.data());

  const matchesData = matchesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const lockedMatches = matchesData.filter(
    (match) => new Date() > new Date(match.kickoffTime || match.kickofftime)
  );

  const stats = lockedMatches
  .sort(
    (a, b) =>
      new Date(b.kickoffTime || b.kickofftime) -
      new Date(a.kickoffTime || a.kickofftime)
  )
  .slice(0, 3)
  .map((match) => {
    const matchPicks = picksData.filter(
      (pick) => pick.matchid === match.id || pick.matchId === match.id
    );

    const total = matchPicks.length || 1;

    const team1Count = matchPicks.filter((pick) => pick.winnerPick === match.team1).length;
    const drawCount = matchPicks.filter((pick) => pick.winnerPick === "Draw").length;
    const team2Count = matchPicks.filter((pick) => pick.winnerPick === match.team2).length;

    const players = {};
    matchPicks.forEach((pick) => {
      const player = pick.playerPick || pick.playerPickName || "";
      if (player) {
        players[player] = (players[player] || 0) + 1;
      }
    });

    const topPlayer =
      Object.entries(players).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

    return {
      match: `${match.team1} vs ${match.team2}`,
      team1: match.team1,
      team2: match.team2,
      totalPredictions: total,
      team1Percent: Math.round((team1Count / total) * 100),
      drawPercent: Math.round((drawCount / total) * 100),
      team2Percent: Math.round((team2Count / total) * 100),
      topPlayer,
    };
  });

  setCommunityStats(stats);
};
const loadPredictions = async (matchId) => {
  const snapshot = await getDocs(collection(db, "picks"));

  const predictions = snapshot.docs
    .map(doc => doc.data())
    .filter(pick => pick.matchid === matchid || pick.matchId === matchid);

  setAllPredictions(predictions);
};
const loadLeaderboard = async () => {
  const picksSnapshot = await getDocs(collection(db, "picks"));
const resultsSnapshot = await getDocs(collection(db, "results"));

const results = {};
resultsSnapshot.docs.forEach((doc) => {
  results[doc.id] = doc.data();
});

const players = {};

picksSnapshot.docs.forEach((doc) => {
  const pick = doc.data();
  const result = results[pick.matchId];

  let points = 0;

if (result && result.completed === true) {
  const pickWinner = String(pick.winnerPick || "").trim().toLowerCase();
  const resultWinner = String(result.winner || "").trim().toLowerCase();

  if (pickWinner === resultWinner) {
    points += 1;
  }
// Exact score prediction = 3 points
// Exact score prediction = 3 points
if (
  Number(pick.scorePrediction?.team1) === Number(result.team1Score) &&
  Number(pick.scorePrediction?.team2) === Number(result.team2Score)
) {
  points += 3;
}
// Player goals = 1 point per goal
if (pick.playerPick && result.playerGoals) {
  const goals = result.playerGoals
    .toLowerCase()
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name === pick.playerPick.toLowerCase().trim()).length;

  points += goals;
}
}

if (!players[pick.userId]) {
  players[pick.userId] = {
    name: pick.name,
  points: 0,
lastPick: pick.winnerPick,  
};
}
players[pick.userId].points += points;
});

const data = Object.values(players).sort((a, b) => b.points - a.points);

setLeaderboard(data);
  setPage("leaderboard");
};
if (page === "admin") {
  if (user?.email !== ADMIN_EMAIL) {
    return (
      <div style={{ padding: "20px", color: "white", background: "#0f172a", minHeight: "100vh" }}>
        <h1>Access Denied</h1>
        <button onClick={() => setPage("home")}>Back</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", color: "white", background: "#0f172a", minHeight: "100vh" }}>
      <h1>Admin Page</h1>

      <button onClick={() => setPage("home")}>Back</button>

      <br /><br />

      <select
  value={adminMatchId}
  onChange={(e) => setAdminMatchId(e.target.value)}
>
  <option value="">Select Match</option>

  {todaysMatches.map((match) => (
    <option key={match.id} value={match.id}>
      {match.team1} vs {match.team2}
    </option>
  ))}
</select>

      <br /><br />

      <select
  value={adminWinner}
  onChange={(e) => setAdminWinner(e.target.value)}
>
  <option value="">Select Winner</option>
<option value="Draw">Draw</option> 
  {todaysMatches
    .find(m => m.id === adminMatchId)
    ?.team1 && (
      <>
        <option value={todaysMatches.find(m => m.id === adminMatchId).team1}>
          {todaysMatches.find(m => m.id === adminMatchId).team1}
        </option>

        <option value={todaysMatches.find(m => m.id === adminMatchId).team2}>
          {todaysMatches.find(m => m.id === adminMatchId).team2}
        </option>
      </>
    )}
</select>

      <br /><br />
<br /><br />
<p>
  {todaysMatches.find(m => m.id === adminMatchId)?.team1}
</p>
<input
  type="number"
  placeholder="Team 1 actual score"
  value={adminTeam1Score}
  onChange={(e) => setAdminTeam1Score(e.target.value)}
/>

<br /><br />
<p>
  {todaysMatches.find(m => m.id === adminMatchId)?.team2}
</p>
<input
  type="number"
  placeholder="Team 2 actual score"
  value={adminTeam2Score}
  onChange={(e) => setAdminTeam2Score(e.target.value)}
/>
  <br /><br />

<input
  placeholder="Player goals (Son:2, Jimenez:1)"
  value={adminPlayerGoals}
  onChange={(e) => setAdminPlayerGoals(e.target.value)}
/>
      <button
  onClick={saveResult}
  style={{
    background: "#22c55e",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold"
  }}
>
  Save Result
</button>
<br />
<br />

<button
  onClick={loadLeaderboard}
  style={{
    background: "#3b82f6",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold"
  }}
>
  Recalculate Leaderboard
</button>
    </div>
  );
}
if (page === "allpredictions") {
  return (
    <div
  style={{
    minHeight: "100vh",
    padding: "30px",
    background: "linear-gradient(180deg, #dff4ff 0%, #ccecff 100%)",
    color: "#102525",
    textAlign: "center"
  }}
>
      <h1>Everyone's Predictions</h1>

      <button onClick={() => setPage("home")}>
        Back
      </button>

      {allPredictions.map((pick, index) => (
  <div key={index}>
    <h3>{pick.name}</h3>
    <p>Winner: {pick.winnerPick}</p>
    <p>Player: {pick.playerPick}</p>
    <hr />
  </div>
))}
    </div>
  );
}
if (page === "leaderboard") {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px",
        background: "linear-gradient(180deg, #dff4ff 0%, #ccecff 100%)",
        color: "#102525",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>
        🏆 Leaderboard
      </h1>

      <button onClick={() => setPage("home")}>Back</button>

      <div style={{ marginTop: "30px" }}>
        {leaderboard.map((player, index) => (
          <div
            key={index}
            style={{
              background: "rgba(255,255,255,0.9)",
              color: "#102525",
              borderRadius: "20px",
              padding: "18px 22px",
              margin: "16px auto",
              maxWidth: "600px",
              boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
            }}
          >
            <h3>
              {index === 0
                ? "🥇"
                : index === 1
                ? "🥈"
                : index === 2
                ? "🥉"
                : `#${index + 1}`}{" "}
              {player.name}
            </h3>

            <p style={{ fontWeight: "700", color: "#2563eb" }}>
              {player.points || 0} pts
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

if (page === "matches") {
  return (
    <div style={{ padding: "20px", color: "#102525", background: "#dbeafe", minHeight: "100vh" }}>
      <h1>⚽ Match Predictions</h1>

      <button onClick={() => setPage("home")}>Back</button>

      {todaysMatches.map((match) => {
  const isLocked = new Date() > new Date(match.kickoffTime);

  return (
    
  <div
  key={match.id}
  
  style={{
  background: "rgba(255,255,255,0.9)",
  color: "#102525",
  borderRadius: "24px",
  padding: "24px",
  margin: "24px auto",
  maxWidth: "650px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  textAlign: "center"
}}
>
   <h3
   style={{
    fontSize: "28px",
    marginBottom: "20px",
    fontWeight: "700"
  }}
>
  
  <img
    src={`https://flagcdn.com/w40/${flags[match.team1]}.png`}
    width="40"
  />
  {" "}{match.team1} vs{" "}
  <img
    src={`https://flagcdn.com/w40/${flags[match.team2]}.png`}
    width="40"
  />
  {" "}{match.team2}
</h3>
{isLocked && (
  <p style={{ color: "red", fontWeight: "bold" }}>
    🔒 Picks Locked
  </p>
)}
    <button
  disabled={isLocked}
  onClick={() =>
  setPicks((prev) => ({
    ...prev,
    [match.id]: match.team1,
  }))
}
  style={{
    background: picks[match.id] === match.team1 ? "#2563eb" : "#dbeafe",
    color: picks[match.id] === match.team1 ? "white" : "#102525",
    border: "1px solid #dbeafe",
    borderRadius: "999px",
    padding: "12px 24px",
    margin: "5px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s ease"
  }}
>
      {match.team1}
    </button>

  
  <button
  disabled={isLocked}
  onClick={() =>
  setPicks((prev) => ({
    ...prev,
    [match.id]: "Draw",
  }))
}
  style={{
    background: picks[match.id] === "Draw" ? "#2563eb" : "#dbeafe",
    color: picks[match.id] === "Draw" ? "white" : "#102525",
    border: "1px solid #dbeafe",
    borderRadius: "999px",
    padding: "12px 24px",
    margin: "5px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s ease"
  }}
>
      Draw
    </button>
<button
  disabled={isLocked}
  onClick={() =>
  setPicks((prev) => ({
    ...prev,
    [match.id]: match.team2,
  }))
}
   style={{
    background: picks[match.id] === match.team2 ? "#2563eb" : "#dbeafe",
    color: picks[match.id] === match.team2 ? "white" : "#102525",
    border: "1px solid #dbeafe",
    borderRadius: "999px",
    padding: "12px 24px",
    margin: "5px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s ease"
  }}
>
  {match.team2}
</button>
<br />

<input
  type="number"
  min="0"
  placeholder={`${match.team1} score`}
  value={scorePicks[match.id]?.team1 ?? ""}
  disabled={isLocked}
  onChange={(e) =>
    setScorePicks((prev) => ({
      ...prev,
      [match.id]: {
        ...prev[match.id],
        team1: Number(e.target.value)
      },
    }))
  }
/>

<input
  type="number"
  min="0"
  placeholder={`${match.team2} score`}
  value={scorePicks[match.id]?.team2 ?? ""}
  disabled={isLocked}
  onChange={(e) =>
    setScorePicks((prev) => ({
      ...prev,
      [match.id]: {
        ...prev[match.id],
       team2: Number(e.target.value)
      },
    }))
  }
/>

<br />
<input
disabled={isLocked}
  placeholder="Player you think will score"
  value={playerPicks[match.id] || ""}
  onChange={(e) =>
    setPlayerPicks((prev) => ({
      ...prev,
      [match.id]: e.target.value,
    }))
  }
/>
    <button
  onClick={() => savePick(match.id, picks[match.id])}
  disabled={!picks[match.id] || isLocked}
  style={{
    marginTop: "12px",
    padding: "10px 20px",
    background: "#22c55e",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%",
  }}
>
  💾 Save Pick
</button>

    <p>Your pick: {picks[match.id] || "None"}</p>
<button
  onClick={() => {
    setSelectedMatch(match.id);
    loadPredictions(match.id);
    setPage("predictions");
  }}
  style={{
    marginTop: "10px",
    padding: "10px 16px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%"
  }}
>
  👥 Everyone's Predictions
</button>
    <hr />
  </div>
)})}
</div>);
}

if (page === "myPicks") {
  return (
    <div style={{ padding: "20px", color: "#102525", background: "#dff4ff", minHeight: "100vh" }}>
      <h1>📌 My Picks</h1>

      <button onClick={() => setPage("home")}>Back</button>

      <br /><br />

      {Object.entries(picks).length === 0 ? (
        <p>No picks yet.</p>
      ) : (
        Object.entries(picks).map(([matchId, choice]) => (
          <div
            key={matchId}
            style={{
              background: "rgba(255,255,255,0.12)",
              padding: "15px",
              borderRadius: "12px",
              marginBottom: "12px",
              width: "300px"
            }}
          >
            <h3>{choice.matchName || matchId}</h3>
            <p>Winner: {choice.winner}</p>
<p>Score: {choice.score1} - {choice.score2}</p>
<p>⚽ Player: {choice.player}</p>
          </div>
        ))
      )}
    </div>
  );
}

return (
  <div className="app-shell">
    <h1 style={{ fontSize: "48px", marginBottom: "10px" }}>
      🏆 World Cup Fantasy
    </h1>

    {user ? (
      <>
<div className="welcome-card">
  <h2>👋 Welcome back, {user.displayName}</h2>
  <p>Ready to make your picks?</p>
</div>
        

        <button
          onClick={() => {
            console.log("PREDICT BUTTON CLICKED");
            loadMatches("matches");
          }}
        >
          Predict Matches
        </button>

        <button onClick={loadAllPredictions}>
          Everyone's Predictions
        </button>

        <button onClick={loadPick}>
          My Picks
        </button>

        {user?.email === ADMIN_EMAIL && (
          <button onClick={() => loadMatches("admin")}>
            Admin
          </button>
        )}

        <button onClick={logout}>
          Sign Out
        </button>

        <div className="dashboard-grid">
          <div
  className="dashboard-card"
  onClick={loadLeaderboard}
  style={{ cursor: "pointer" }}
>
            <h3>🏆 League Table</h3>

          {leaderboard.slice(0, 3).map((player, index) => (
  <p key={index}>
    {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"} {player.name} - {player.points || 0} pts
  </p>
))}

          </div>

          <div className="dashboard-card">
            <h3>⏰ Next 3 Matches</h3>
            {upcomingMatches.length > 0 ? (
  upcomingMatches.slice(0, 3).map((match, index) => (
    <div
  key={index}
  style={{
    padding: "10px 0",
    borderBottom: index < 2 ? "1px solid #e5e7eb" : "none",
  }}
>
  <p style={{ margin: 0, fontWeight: "700" }}>
    ⚽ {match.team1} vs {match.team2}
  </p>
  <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#6b7280" }}>
    🗓️ {match.date}
  </p>
</div>
  ))
) : (
  <p>No upcoming matches</p>
)}
          </div>

          <div className="dashboard-card">
  <h3>📋 Latest Results</h3>

  {latestResults.length > 0 ? (
    latestResults.slice(0, 3).map((match, index) => (
      <div key={index} style={{ padding: "8px 0" }}>
      <p> ⚽ {match.team1} {match.team1Score} - {match.team2Score} {match.team2} </p>
      </div>
    ))
  ) : (
    <p>No results yet</p>
  )}
</div>
        <div className="dashboard-card">
  <h3>📊 Community Stats</h3>
  {communityStats.length === 0 ? (
  <p>No community stats yet.</p>
) : (
  communityStats.map((match, index) => (
    <div key={index} style={{ marginBottom: "15px" }}>
      <strong>{match.match}</strong>

      <p>🏆 {match.team1}: {match.team1Percent}%</p>
      <p>🤝 Draw: {match.drawPercent}%</p>
      <p>🏆 {match.team2}: {match.team2Percent}%</p>

      <p>🔥 Most Picked Player</p>
      <p>{match.topPlayer}</p>

      <hr />
    </div>
  ))
)}
</div>
        </div>
      </>
    ) : (
      <>
        <p>Predict World Cup matches and earn points!</p>
        <button onClick={signIn}>
          Sign In
        </button>
      </>
    )}
  </div>
);
}
export default App;