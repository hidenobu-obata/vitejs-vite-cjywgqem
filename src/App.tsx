import React, { useState, useEffect, useRef, useMemo } from 'react';
import './App.css';

// 歌詞の章節データ
const LYRICS_STANZAS = [
  "ごめん 聞いてない あなたの指摘は",
  "頭はもう明日の予定",
  "ぐちと わかってる ならば なおのこと",
  "口にするなよと 視線",
  "席立って自販機でティを飲み",
  "よし、TWO HOURS",
  "やっと TWO HOURS",
  "オフの為にいきてるぞ",
  "やあ TWO HOURS",
  "ハロー TWO HOURS",
  "オフの為にいきてるぞ",
  "数字 １２０ 書いて みたけれど",
  "頭 もうすでに カウントダウン",
  "これを仕上げたら 今日は 終わりだよ",
  "時計 チラ見して 視線",
  "明日何をしようかな 別世界",
  "よし、TWO HOURS",
  "やっと TWO HOURS",
  "オフの為にいきてるぞ",
  "やあ TWO HOURS",
  "ハロー TWO HOURS",
  "オフの為にいきてるぞ"
];

interface RankingItem {
  name: string;
  score: number;
}

export default function App() {
  // ゲームの状態: 'start'（タイトル） | 'playing'（プレイ中） | 'gameover'（結果・ランキング入力）
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  
  // タイマー（150秒 = 2分30秒）
  const [timeLeft, setTimeLeft] = useState<number>(150);
  // スコア
  const [score, setScore] = useState<number>(0);
  // 現在の歌詞のインデックス
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  // 入力フィールドの値
  const [inputVal, setInputVal] = useState<string>('');
  // 間違い判定（赤文字用）
  const [isError, setIsError] = useState<boolean>(false);

  // ランキングデータ（LocalStorage保存）
  const [rankings, setRankings] = useState<RankingItem[]>(() => {
    const saved = localStorage.getItem('hirafuri_rankings');
    return saved ? JSON.parse(saved) : [];
  });
  const [nickname, setNickname] = useState<string>('');
  const [isRankIn, setIsRankIn] = useState<boolean>(false);

  // 音楽再生用の参照
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. タイマー処理
  useEffect(() => {
    if (gameState !== 'playing') return;

    if (timeLeft <= 0) {
      setGameState('gameover');
      checkRanking(score);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // ランキングチェック
  const checkRanking = (finalScore: number) => {
    // 上位5名に入るか、まだ5名未満か
    if (rankings.length < 5 || finalScore > rankings[rankings.length - 1].score) {
      setIsRankIn(true);
    } else {
      setIsRankIn(false);
    }
  };

  // ゲームスタート
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

  // 入力チェック（フリック・ソフトウェアキーボード対応）
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);

    const targetStanza = LYRICS_STANZAS[currentIndex];

    // 入力途中が正しいかチェック
    if (targetStanza.startsWith(val)) {
      setIsError(false);
      // 完全一致したら次へ進む
      if (val === targetStanza) {
        setScore(prev => prev + 1);
        setInputVal('');
        // 次の章節へ（ループさせる）
        setCurrentIndex(prev => (prev + 1) % LYRICS_STANZAS.length);
      }
    } else {
      // 間違っている場合
      setIsError(true);
      setScore(prev => prev - 1);
    }
  };

  // 音楽再生ボタン（♪マーク）
  const handlePlayMusic = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://boncrescent-erifan.jp/special/songsprobon/25.mp3');
    }
    audioRef.current.play().catch(err => {
      console.log("音声の再生に失敗しました（ファイルが存在するか確認してください）", err);
      alert("楽曲「TWO HOURS」 (25.mp3) を再生します");
    });
  };

  // ランキング登録
  const handleSaveRank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    const newRankings = [...rankings, { name: nickname.slice(0, 10), score }]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // 上位5名まで

    setRankings(newRankings);
    localStorage.setItem('hirafuri_rankings', JSON.stringify(newRankings));
    setIsRankIn(false);
  };

  return (
    <div className="hirafuri-container">
      
      {/* 画面右上：点滅する♪マーク */}
      <button className="music-btn" onClick={handlePlayMusic} title="TWO HOURSを聴く">
        ♪
      </button>

      {/* --- 1. スタート画面 --- */}
      {gameState === 'start' && (
        <div className="screen start-screen">
          <h1 className="game-title">ひらふり</h1>
          <p className="song-subtitle">楽曲: TWO HOURS</p>
          <button className="start-btn" onClick={startGame}>
            スタート
          </button>
        </div>
      )}

      {/* --- 2. プレイ画面 --- */}
      {gameState === 'playing' && (
        <div className="screen playing-screen">
          
          {/* 上部ヘッダー（左端：タイム / 上部中央：スコア） */}
          <div className="game-header">
            <div className="time-box">
              タイム: <span className="highlight">{timeLeft}</span>
            </div>
            <div className="score-box">
              スコア: <span className="highlight">{score}</span>
            </div>
          </div>

          {/* 質問文（1章節ごと表示） */}
          <div className="quiz-area">
            <p className="instruction-label">以下の歌詞を入力してね！</p>
            <div className="target-stanza">
              {LYRICS_STANZAS[currentIndex]}
            </div>

            {/* すぐ下のインプットフィールド */}
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

      {/* --- 3. ゲームオーバー・ランキング画面 --- */}
      {gameState === 'gameover' && (
        <div className="screen gameover-screen">
          <h2 className="gameover-title">タイムアップ！</h2>
          <p className="final-score">最終スコア: <strong>{score} 点</strong></p>

          {/* 上位5名入力フォーム */}
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

          {/* ランキング表示 */}
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