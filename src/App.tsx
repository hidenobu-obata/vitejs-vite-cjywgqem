import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// 歌詞の章節データ（すべてひらがな・記号なし）
const LYRICS_STANZAS = [
  "ごめんきいてないあなたのしてきは",
  "あたまはもうあしたのよてい",
  "ぐちとわかってるならばなおのこと",
  "くちにずるなよとしせん",
  "せきたってじはんきでてぃをのみ",
  "よしつーあうあーず",
  "やっとつーあうあーず",
  "おふのためにいきてるぞ",
  "やあつーあうあーず",
  "はろーつーあうあーず",
  "おふのためにいきてるぞ",
  "すうじひゃくにはいいてみたけれど",
  "あたまもうすでにかうんとだうん",
  "これをしあげたらきょうはおわりだよ",
  "とけいちらみしてしせん",
  "あしたなにをしようかなべつせかい",
  "よしつーあうあーず",
  "やっとつーあうあーず",
  "おふのためにいきてるぞ",
  "やあつーあうあーず",
  "はろーつーあうあーず",
  "おふのためにいきてるぞ"
];

interface RankingItem {
  name: string;
  score: number;
}

export default function App() {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [timeLeft, setTimeLeft] = useState<number>(150);
  const [score, setScore] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [inputVal, setInputVal] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);

  const [rankings, setRankings] = useState<RankingItem[]>(() => {
    const saved = localStorage.getItem('hirafuri_rankings');
    return saved ? JSON.parse(saved) : [];
  });
  const [nickname, setNickname] = useState<string>('');
  const [isRankIn, setIsRankIn] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // タイマー処理
  useEffect(() => {
    if (gameState !== 'playing') return;

    if (timeLeft <= 0) {
      setGameState('gameover');
      if (rankings.length < 5 || score > rankings[rankings.length - 1].score) {
        setIsRankIn(true);
      } else {
        setIsRankIn(false);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeLeft, score, rankings]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(150);
    setCurrentIndex(0);
    setInputVal('');
    setIsError(false);
    setIsRankIn(false);
    setNickname('');
    setGameState('playing');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);

    const targetStanza = LYRICS_STANZAS[currentIndex];

    if (targetStanza.startsWith(val)) {
      setIsError(false);
      if (val === targetStanza) {
        setScore(prev => prev + 1);
        setInputVal('');
        setCurrentIndex(prev => (prev + 1) % LYRICS_STANZAS.length);
      }
    } else {
      setIsError(true);
      setScore(prev => prev - 1);
    }
  };

  const handlePlayMusic = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/25.mp3');
    }
    audioRef.current.play().catch(err => {
      console.log("音声の再生に失敗しました", err);
      alert("楽曲「TWO HOURS」 (25.mp3) を再生します");
    });
  };

  const handleSaveRank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    const newRankings = [...rankings, { name: nickname.slice(0, 10), score }]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    setRankings(newRankings);
    localStorage.setItem('hirafuri_rankings', JSON.stringify(newRankings));
    setIsRankIn(false);
  };

  return (
    <div className="hirafuri-container">
      <button className="music-btn" onClick={handlePlayMusic} title="TWO HOURSを聴く">
        ♪
      </button>

      {gameState === 'start' && (
        <div className="screen start-screen">
          <h1 className="game-title">ひらふり</h1>
          <p className="song-subtitle">楽曲: TWO HOURS</p>
          <button className="start-btn" onClick={startGame}>
            スタート
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="screen playing-screen">
          <div className="game-header">
            <div className="time-box">
              タイム: <span className="highlight">{timeLeft}</span>
            </div>
            <div className="score-box">
              スコア: <span className="highlight">{score}</span>
            </div>
          </div>

          <div className="quiz-area">
            <p className="instruction-label">以下のひらがなを入力してね！</p>
            <div className="target-stanza">
              {LYRICS_STANZAS[currentIndex]}
            </div>

            <div className="input-area">
              <input 
                type="text"
                value={inputVal}
                onChange={handleInputChange}
                placeholder="ここに入力..."
                autoFocus
                autoComplete="off"
                autoCapitalize="off"
                className={`text-input ${isError ? 'error-input' : ''}`}
              />
            </div>
            {isError && <p className="error-msg">⚠️ 間違っています (-1点)</p>}
          </div>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="screen gameover-screen">
          <h2 className="gameover-title">タイムアップ！</h2>
          <p className="final-score">最終スコア: <strong>{score} 点</strong></p>

          {isRankIn ? (
            <form onSubmit={handleSaveRank} className="rank-form">
              <p className="rank-in-notice">🎉 トップ5ランクイン！</p>
              <input 
                type="text"
                placeholder="ニックネーム (10文字以下)"
                maxLength={10}
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                className="nickname-input"
                required
              />
              <button type="submit" className="save-btn">スコアを登録</button>
            </form>
          ) : (
            <button className="retry-btn" onClick={startGame}>もう一度プレイ</button>
          )}

          <div className="ranking-section">
            <h3>🏆 TOP 5 ランキング</h3>
            {rankings.length === 0 ? (
              <p className="no-ranking">まだ記録がありません</p>
            ) : (
              <ol className="ranking-list">
                {rankings.map((r, idx) => (
                  <li key={idx} className="ranking-item">
                    <span>{idx + 1}. {r.name}</span>
                    <span>{r.score} 点</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {!isRankIn && (
            <button className="retry-btn secondary" onClick={() => setGameState('start')}>
              タイトルに戻る
            </button>
          )}
        </div>
      )}
    </div>
  );
}