import "./App.css";
import { useState } from "react";
import { auth } from "./firebase";
import { db } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
function App() {
const [user, setUser] = useState(null);
const [page, setPage] = useState("home");
const [picks, setPicks] = useState({}); 
const [playerPicks, setPlayerPicks] = useState({});
const [leaderboard, setLeaderboard] = useState([]);
const [todaysMatches, setTodaysMatches] = useState([]);
const [allPredictions, setAllPredictions] = useState([]); 
const [scorePicks, setScorePicks] = useState({});
const [adminMatchId, setAdminMatchId] = useState("");
const [adminWinner, setAdminWinner] = useState(""); 
const ADMIN_EMAIL = "haddad.faisal7@gmail.com";
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

  await setDoc(doc(db, "picks", user.uid + "_" + matchId), {
  userId: user.uid,
  name: user.displayName,
  matchId: matchId,
  match: matchId,
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
const loadPick = async () => {
  const snapshot = await getDocs(collection(db, "picks"));

  const userPicks = {};

  snapshot.docs.forEach((doc) => {
    const data = doc.data();

    if (data.userId === user.uid) {
    userPicks[data.matchId] =
  data.winnerPick + " | Player: " + data.playerPick;
    }
  });

  setPicks(userPicks);
  setPage("mypicks");
};
const loadMatches = async () => {
  const snapshot = await getDocs(collection(db, "Matches"));

  const matches = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  setTodaysMatches(matches);
  setPage("matches");
};
const saveResult = async () => {
  await setDoc(doc(db, "results", adminMatchId), {
    winner: adminWinner,
    completed: true,
  });

  alert("Result saved!");
};
const loadAllPredictions = async () => {
  const snapshot = await getDocs(collection(db, "picks"));

  const data = snapshot.docs.map((doc) => doc.data());

  setAllPredictions(data);
  setPage("allpredictions");
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
}

if (!players[pick.userId]) {
  players[pick.userId] = {
    name: pick.name,
  points: 0,
lastPick: pick.winnerPick,  
};
}
players[pick.userId].points = players[pick.userId].points + points;
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

      <input
        placeholder="Match ID"
        value={adminMatchId}
        onChange={(e) => setAdminMatchId(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Winner"
        value={adminWinner}
        onChange={(e) => setAdminWinner(e.target.value)}
      />

      <br /><br />

      <button onClick={saveResult}>Save Result</button>
    </div>
  );
}
if (page === "allpredictions") {
  return (
    <div style={{ padding: "20px", color: "white", background: "#0f172a", minHeight: "100vh" }}>
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
    <div style={{ padding: "20px", color: "white", background: "#0f172a", minHeight: "100vh" }}>
      <h1>🏆 Leaderboard</h1>

      <button onClick={() => setPage("home")}>Back</button>

      {leaderboard.map((player, index) => (
        <div key={index}>
          <h3>
            #{index + 1} {player.name}
          </h3>
          <p>Pick: {player.lastPick}</p>
          <p>Points: {player.points || 0}</p>
          <hr />
        </div>
      ))}
    </div>
  );
}
if (page === "matches") {
  return (
    <div style={{ padding: "20px", color: "white", background: "#0f172a", minHeight: "100vh" }}>
      <h1>⚽ Match Predictions</h1>

      <button onClick={() => setPage("home")}>Back</button>

      {todaysMatches.map((match) => {
  const isLocked = new Date() > new Date(match.kickoffTime);

  return (
    
  <div key={match.id} className="match-card">
    <h3>{match.team1} vs {match.team2}</h3>
{isLocked && (
  <p style={{ color: "red", fontWeight: "bold" }}>
    🔒 Picks Locked
  </p>
)}
    <button
  disabled={isLocked}
  onClick={() => savePick(match.id, match.team1)}
>
      {match.team1}
    </button>

  
  <button
  disabled={isLocked}
  onClick={() => savePick(match.id, "Draw")}
>
      Draw
    </button>
<button
  disabled={isLocked}
  onClick={() => savePick(match.id, match.team2)}
>
  {match.team2}
</button>
<br />

<input
  type="number"
  min="0"
  placeholder={`${match.team1} score`}
  value={scorePicks[match.id]?.team1 || ""}
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
  value={scorePicks[match.id]?.team2 || ""}
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
    
    <p>Your pick: {picks[match.id] || "None"}</p>

    <hr />
  </div>
)})}
</div>);
}

if (page === "mypicks") {
  return (
    <div style={{ padding: "20px", color: "white", background: "#0f172a", minHeight: "100vh" }}>
      <h1>📋 My Picks</h1>

      <button onClick={() => setPage("home")}>Back</button>

    {Object.entries(picks).map(([matchId, choice]) => (
  <p key={matchId}>{matchId}: {choice}</p>
))}
    </div>
  );
}

return (
    <div style={{
      minHeight: "100vh",
      background: "#0f172a",
      color: "white",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: "14px"
    }}>
      <h1>🏆 World Cup Fantasy</h1>

      {user ? (
        <>
          <h2>Welcome, {user.displayName}</h2>
          <p>Points: 0</p>
          <button onClick={loadMatches}>
  Predict Matches
</button>
          <button onClick={loadLeaderboard}>Leaderboard</button>
         <button onClick={loadAllPredictions}>Everyone's Predictions</button>
          <button onClick={loadPick}>My Picks</button>
         {user?.email === ADMIN_EMAIL && (
  <button onClick={() => setPage("admin")}>
    Admin
  </button>
)}
          <button onClick={logout}>Sign Out</button>
        </>
      ) : (
        <>
          <p>Predict World Cup matches and earn points!</p>
          <button onClick={signIn}>Sign In</button>
        </>
      )}
    </div>
  );
}

export default App;