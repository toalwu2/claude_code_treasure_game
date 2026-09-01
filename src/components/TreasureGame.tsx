import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import closedChest from '../assets/treasure_closed.png';
import treasureChest from '../assets/treasure_opened.png';
import skeletonChest from '../assets/treasure_opened_skeleton.png';
import chestOpenSound from '../audios/chest_open.mp3';
import evilLaughSound from '../audios/chest_open_with_evil_laugh.mp3';
import keyCursor from '../assets/key.png';
import { useAuth } from '../contexts/AuthContext';
import { fetchScoreHistory, submitScore, type GameResult, type ScoreRecord } from '../lib/api';

interface Box {
  id: number;
  isOpen: boolean;
  hasTreasure: boolean;
}

function resultFor(score: number): GameResult {
  return score > 0 ? 'win' : score < 0 ? 'loss' : 'tie';
}

export function TreasureGame() {
  const { mode, user, signOut, exitGuest } = useAuth();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [best, setBest] = useState<number | null>(null);
  const [history, setHistory] = useState<ScoreRecord[]>([]);
  const scoreSubmittedRef = useRef(false);

  const initializeGame = () => {
    // Randomly assign treasure to one box
    const treasureBoxIndex = Math.floor(Math.random() * 3);
    const newBoxes: Box[] = Array.from({ length: 3 }, (_, index) => ({
      id: index,
      isOpen: false,
      hasTreasure: index === treasureBoxIndex,
    }));

    scoreSubmittedRef.current = false;
    setBoxes(newBoxes);
    setScore(0);
    setGameEnded(false);
  };

  // Initialize game automatically when component mounts
  useEffect(() => {
    initializeGame();
  }, []);

  const loadHistory = useCallback(() => {
    fetchScoreHistory()
      .then(({ history, best }) => {
        setHistory(history);
        setBest(best);
      })
      .catch(() => {
        // score history is a nice-to-have; ignore failures here
      });
  }, []);

  // Signed-in players see their past results as soon as they arrive
  useEffect(() => {
    if (mode === 'signed-in') loadHistory();
  }, [mode, loadHistory]);

  // Persist the final score for signed-in players once per completed game
  useEffect(() => {
    if (mode !== 'signed-in' || !gameEnded || scoreSubmittedRef.current) return;
    scoreSubmittedRef.current = true;
    submitScore(score, resultFor(score))
      .then(loadHistory)
      .catch(() => {
        // saving the score shouldn't block the player from seeing their result
      });
  }, [mode, gameEnded, score, loadHistory]);

  const openBox = (boxId: number) => {
    if (gameEnded) return;

    setBoxes(prevBoxes => {
      const updatedBoxes = prevBoxes.map(box => {
        if (box.id === boxId && !box.isOpen) {
          const newScore = box.hasTreasure ? score + 200 : score - 50;
          setScore(newScore);
          new Audio(box.hasTreasure ? chestOpenSound : evilLaughSound).play();
          return { ...box, isOpen: true };
        }
        return box;
      });

      // Check if treasure is found or all boxes are opened
      const treasureFound = updatedBoxes.some(box => box.isOpen && box.hasTreasure);
      const allOpened = updatedBoxes.every(box => box.isOpen);
      if (treasureFound || allOpened) {
        setGameEnded(true);
      }

      return updatedBoxes;
    });
  };

  const resetGame = () => {
    initializeGame();
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-8">
      <div className="absolute top-4 right-4 flex items-center gap-3 text-sm text-amber-800">
        {mode === 'signed-in' ? (
          <>
            <span>
              Signed in as <span className="text-amber-900">{user?.username}</span>
            </span>
            <button className="underline" onClick={() => void signOut()}>
              Sign Out
            </button>
          </>
        ) : (
          <>
            <span>Playing as Guest (scores won't be saved)</span>
            <button className="underline" onClick={exitGuest}>
              Sign In
            </button>
          </>
        )}
      </div>

      <div className="text-center mb-8">
        <h1 className="text-4xl mb-4 text-amber-900">🏴‍☠️ Treasure Hunt Game 🏴‍☠️</h1>
        <p className="text-amber-800 mb-4">
          Click on the treasure chests to discover what's inside!
        </p>
        <p className="text-amber-700 text-sm">
          💰 Treasure: +$200 | 💀 Skeleton: -$50
        </p>
      </div>

      <div className="mb-8 flex items-center gap-4">
        <div className="text-2xl text-center p-4 bg-amber-200/80 backdrop-blur-sm rounded-lg shadow-lg border-2 border-amber-400">
          <span className="text-amber-900">Current Score: </span>
          <span className={`${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${score}
          </span>
        </div>
        {gameEnded && (
          <span
            className={`text-lg ${
              score > 0
                ? 'text-green-600'
                : score < 0
                ? 'text-red-600'
                : 'text-amber-700'
            }`}
          >
            {score > 0 ? 'Win' : score < 0 ? 'Loss' : 'Tie'}
          </span>
        )}
      </div>

      {mode === 'signed-in' && (best !== null || history.length > 0) && (
        <div className="mb-8 text-center text-amber-800 text-sm">
          {best !== null && <p>Your best score: ${best}</p>}
          {history.length > 0 && (
            <p className="mt-1">
              Recent games:{' '}
              {history.slice(0, 5).map((game) => (
                <span key={game.id} className="ml-1">
                  {game.result === 'win' ? '🏆' : game.result === 'loss' ? '💀' : '🤝'} ${game.score}
                </span>
              ))}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {boxes.map((box) => (
              <motion.div
                key={box.id}
                className="flex flex-col items-center"
                style={{ cursor: box.isOpen ? 'default' : `url(${keyCursor}), auto` }}
                whileHover={{ scale: box.isOpen ? 1 : 1.05 }}
                whileTap={{ scale: box.isOpen ? 1 : 0.95 }}
                onClick={() => openBox(box.id)}
              >
                <motion.div
                  initial={{ rotateY: 0 }}
                  animate={{
                    rotateY: box.isOpen ? 180 : 0,
                    scale: box.isOpen ? 1.1 : 1
                  }}
                  transition={{
                    duration: 0.6,
                    ease: "easeInOut"
                  }}
                  className="relative"
                >
                  <img
                    src={box.isOpen
                      ? (box.hasTreasure ? treasureChest : skeletonChest)
                      : closedChest
                    }
                    alt={box.isOpen
                      ? (box.hasTreasure ? "Treasure!" : "Skeleton!")
                      : "Treasure Chest"
                    }
                    className="w-48 h-48 object-contain drop-shadow-lg"
                  />

                  {box.isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                    >
                      {box.hasTreasure ? (
                        <div className="text-2xl animate-bounce">✨💰✨</div>
                      ) : (
                        <div className="text-2xl animate-pulse">💀👻💀</div>
                      )}
                    </motion.div>
                  )}
                </motion.div>

                <div className="mt-4 text-center">
                  {box.isOpen ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                      className={`text-lg p-2 rounded-lg ${
                        box.hasTreasure
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                    >
                      {box.hasTreasure ? '+$200' : '-$50'}
                    </motion.div>
                  ) : (
                    <div className="text-amber-700 p-2">
                      Click to open!
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
      </div>

      {gameEnded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="mb-4 p-6 bg-amber-200/80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-amber-400">
                <h2 className="text-2xl mb-2 text-amber-900">Game Over!</h2>
                <p className="text-lg text-amber-800">
                  Final Score: <span className={`${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${score}
                  </span>
                </p>
                <p className="text-sm text-amber-600 mt-2">
                  {boxes.some(box => box.isOpen && box.hasTreasure)
                    ? 'Treasure found! Well done, treasure hunter! 🎉'
                    : 'No treasure found this time! Better luck next time! 💀'}
                </p>
              </div>

              <Button
                onClick={resetGame}
                className="text-lg px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white"
              >
                Play Again
              </Button>
            </motion.div>
          )}
    </div>
  );
}
