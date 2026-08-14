import { useState, useRef, useEffect } from "react";
import Die from "./Die";
import { nanoid } from "nanoid";
import Confetti from "react-confetti";

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function App() {
  const [dice, setDice] = useState(() => generateAllNewDice());
  const [time, setTime] = useState(0);
  const [bestTime, setBestTime] = useState(() => {
    const stored = localStorage.getItem("bestTime");
    return stored ? Number(stored) : null;
  });
  const [gameStarted, setGameStarted] = useState(false);
  const buttonRef = useRef(null);

  const gameWon = dice.every((die) => die.isHeld) && dice.every((die) => die.value === dice[0].value);

  useEffect(() => {
    if (gameWon) {
      buttonRef.current.focus();
    }
  }, [gameWon]);

  useEffect(() => {
    if (!gameStarted || gameWon) return;

    const intervalId = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [gameStarted, gameWon]);

  function generateAllNewDice() {
    return new Array(10).fill(0).map(() => ({
      value: Math.ceil(Math.random() * 6),
      isHeld: false,
      id: nanoid(),
    }));
  }

  function rollDice() {
    if (!gameWon) {
      if (!gameStarted) setGameStarted(true);
      setDice((oldDice) => oldDice.map((die) => (die.isHeld ? die : { ...die, value: Math.ceil(Math.random() * 6) })));
    } else {
      setDice(generateAllNewDice());
      setTime(0);
      setGameStarted(false);
    }
  }

  function hold(id) {
    const newDice = dice.map((die) => (die.id === id ? { ...die, isHeld: !die.isHeld } : die));

    const won =
      gameStarted && newDice.every((die) => die.isHeld) && newDice.every((die) => die.value === newDice[0].value);

    if (won) {
      setBestTime((prev) => {
        if (prev === null || time < prev) {
          localStorage.setItem("bestTime", String(time));
          return time;
        }
        return prev;
      });
    }

    setDice(newDice);
  }

  const diceElements = dice.map((dieObj) => (
    <Die key={dieObj.id} value={dieObj.value} isHeld={dieObj.isHeld} hold={() => hold(dieObj.id)} />
  ));

  return (
    <>
      <header>
        <p className="subtitle">Roll to win!</p>
        <p className="subtitle">Match all dice and beat your best time!</p>
        <h1 className="title">Tenzies</h1>
      </header>

      <main>
        {gameWon && <Confetti />}

        <div aria-live="polite" className="sr-only">
          {gameWon && (
            <p>
              Congratulations! You won in {formatTime(time)}!{bestTime !== null && ` Best time: ${bestTime} seconds.`}{" "}
              Press "New Game" to start again.
            </p>
          )}
        </div>

        <div className="keeper-display">
          <div className="best-time">
            <p className="keeper-subtitle">Best:</p>
            {bestTime !== null && <p>{bestTime}s</p>}
          </div>
          <div className="timer">
            <p className="keeper-subtitle">Time:</p>
            {gameStarted && <p aria-live="polite">{formatTime(time)}</p>}
          </div>
          <div className="attempt">
            <p className="keeper-subtitle" aria-live="polite">
              Attempts:
            </p>
          </div>
        </div>

        <div className="dice-container">{diceElements}</div>
        <button ref={buttonRef} className="roll-dice" onClick={rollDice}>
          {gameWon ? "New Game" : "Roll"}
        </button>
      </main>
    </>
  );
}
