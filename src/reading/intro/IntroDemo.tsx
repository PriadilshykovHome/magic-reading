import { useEffect, useState } from 'react';
import { sfx } from '../../core/audio/sfx';
import { voice } from '../../core/audio/voice';
import type { IntroDemoProps } from '../../core/game';
import { content } from '../content/load';
import { itemText } from '../engine/content';
import type { Level } from '../engine/schema';
import { useDisplayText } from '../tasks/shared/helpers';
import './IntroDemo.css';

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

/**
 * After Соня's introduction: the new syllables merging, a word sliding together from its
 * syllables, or a sentence read word by word. While she talks, the first step waits on the card.
 */
export function IntroDemo({ level: coreLevel, waiting, playing }: IntroDemoProps) {
  const level = coreLevel as Level;
  const show = useDisplayText();
  const { demo } = level.intro;
  // The demo card is never empty: first letters (or the sentence) show while Соня introduces it.
  const [step, setStep] = useState(demo.type === 'readAlong' ? -1 : 0);
  const [part, setPart] = useState(-1);
  const [merged, setMerged] = useState(false);

  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    void (async () => {
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
    };
  }, [playing, demo]);

  if (demo.type === 'wordMerge') {
    return (
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
    );
  }
  if (demo.type === 'syllableMerge') {
    return (
      step >= 0 && (
        <div key={step} className={`intro-merge ${merged ? 'is-merged' : ''} ${waiting ? 'is-waiting' : ''}`}>
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
    );
  }
  return (
    <p className="read-sentence intro-sentence">
      {show(demo.items[0]!)
        .split(/\s+/)
        .map((word, i) => (
          <span key={i} className={`intro-word ${i === step ? 'is-reading' : ''}`}>
            {word}{' '}
          </span>
        ))}
    </p>
  );
}
