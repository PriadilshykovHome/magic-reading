import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { sfx } from '../audio/sfx';
import { useMusic } from '../audio/useMusic';
import { preloadLevel, voice } from '../audio/voice';
import { Sonya } from '../characters/Sonya';
import { content, levelPath, mapPath } from '../content/load';
import { itemText } from '../engine/content';
import { isLevelUnlocked } from '../engine/rewards';
import type { Level } from '../engine/schema';
import { Scene } from '../fx/ambient/Scene';
import { useDisplayText } from '../tasks/shared/helpers';
import { useProgress } from '../store/progress';
import { t } from '../strings';
import { BackIcon, PlayIcon } from '../ui/Icons';
import { useLevel } from './useLevel';
import './LevelIntro.css';

export function LevelIntroScreen() {
  const level = useLevel();
  const progress = useProgress((s) => s.progress);
  if (!level || !isLevelUnlocked(progress, level)) return <Navigate to="/map" replace />;
  return <Intro key={level.id} level={level} />;
}

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

// Соня says today's goal, then a demo: the new syllables merging, or a sentence read word by word.
function Intro({ level }: { level: Level }) {
  const navigate = useNavigate();
  const show = useDisplayText();
  const { demo } = level.intro;
  const [talking, setTalking] = useState(false);
  // The demo card is never empty: first letters (or the sentence) show while Соня introduces it.
  const [step, setStep] = useState(demo.type === 'readAlong' ? -1 : 0);
  const [part, setPart] = useState(-1);
  const [merged, setMerged] = useState(false);
  useMusic('map');
  useEffect(() => preloadLevel(level), [level]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await wait(500);
      setTalking(true);
      await voice.say(level.intro.voice);
      if (cancelled) return;
      setTalking(false);
      if (demo.type === 'syllableMerge') {
        for (let i = 0; i < demo.items.length && !cancelled; i++) {
          setStep(i);
          setMerged(false);
          await wait(900);
          if (cancelled) return;
          setMerged(true);
          sfx.whoosh();
          await voice.item(demo.items[i]!);
          await wait(700);
        }
      } else if (demo.type === 'wordMerge') {
        // ЛИ… МОН… ЛИМОН: each syllable read, then they slide together into the word.
        for (let i = 0; i < demo.items.length && !cancelled; i++) {
          setStep(i);
          setMerged(false);
          const syllables = content.words.get(demo.items[i]!)!.syllables;
          for (let k = 0; k < syllables.length && !cancelled; k++) {
            setPart(k);
            await voice.item(syllables[k]!);
            await wait(250);
          }
          if (cancelled) return;
          setPart(-1);
          setMerged(true);
          sfx.whoosh();
          await voice.item(demo.items[i]!);
          await wait(800);
        }
      } else {
        const words = itemText(content, demo.items[0]!).split(/\s+/);
        for (let i = 0; i < words.length && !cancelled; i++) {
          setStep(i);
          await voice.text(words[i]!.replace(/[^\p{L}'’-]/gu, ''));
          await wait(250);
        }
        if (!cancelled) setStep(-1);
      }
    })();
    return () => {
      cancelled = true;
      voice.stop();
    };
  }, [level, demo]);

  const start = () => {
    sfx.tap();
    navigate(`${levelPath(level.id)}/play`);
  };

  return (
    <main className="screen intro-screen">
      <Scene moon={false} quiet />
      <button type="button" className="icon-button intro-back" aria-label={t.map.backToDoor} onClick={() => navigate(mapPath(level.id))}>
        <BackIcon />
      </button>

      <div className="intro-stage">
        <div className="intro-sonya">
          <Sonya mood={talking ? 'talk' : 'idle'} />
        </div>

        <div className="intro-demo parchment">
          {demo.type === 'wordMerge' ? (
            <div key={step} className={`intro-word-merge ${merged ? 'is-merged' : ''}`}>
              {merged ? (
                <span className="read-word intro-fused">{show(demo.items[step]!)}</span>
              ) : (
                content.words.get(demo.items[step]!)!.syllables.map((id, k) => (
                  <span key={k} className={`read-word intro-syllable ${k === part ? 'is-reading' : ''}`}>
                    {show(id)}
                  </span>
                ))
              )}
            </div>
          ) : demo.type === 'syllableMerge' ? (
            step >= 0 && (
              <div key={step} className={`intro-merge ${merged ? 'is-merged' : ''} ${talking ? 'is-waiting' : ''}`}>
                {merged ? (
                  <span className="read-syllable intro-fused">{show(demo.items[step]!)}</span>
                ) : (
                  content.syllables.get(demo.items[step]!)!.parts.map((p, i) => (
                    <span key={i} className={`read-syllable intro-letter intro-letter-${i}`}>
                      {p.toLocaleUpperCase('uk-UA')}
                    </span>
                  ))
                )}
              </div>
            )
          ) : (
            <p className="read-sentence intro-sentence">
              {show(demo.items[0]!)
                .split(/\s+/)
                .map((word, i) => (
                  <span key={i} className={`intro-word ${i === step ? 'is-reading' : ''}`}>
                    {word}{' '}
                  </span>
                ))}
            </p>
          )}
        </div>
      </div>

      <button type="button" className="big-button intro-play" aria-label={t.play.start} onClick={start} data-start>
        <PlayIcon />
      </button>
    </main>
  );
}
