// Decorative backdrop for the login screen: horizontal rows of outlined type
// streaming in alternate directions. Only `translate` animates, so the browser
// paints the text once and slides it on the compositor: no JavaScript per frame
// and no repaint. Motion stops for people who ask for reduced motion.
import React from 'react';
import '@fontsource/rubik-mono-one';

// One phrase set per row, top to bottom: the kinds of contribution Moa records,
// the brand, and the idea that the process behind a result is what counts.
const ROWS = [
  ['RESEARCH', 'IDEAS', 'MEETINGS', 'FEEDBACK'],
  ['MOA', 'TOGETHER'],
  ['DESIGN', 'CODE', 'DOCS', 'DRAFTS'],
  ['EVERY CONTRIBUTION MATTERS'],
  ['PROCESS', 'BEHIND THE RESULT'],
  ['TEAMWORK', 'EVERY STEP COUNTS'],
  ['MOA', 'SHARED WORK', 'MOA', 'SMALL WINS'],
];
// Rubik Mono One is monospaced, so one space is already as wide as a letter:
// one space between words and two between repeats keep the gaps a little
// uneven without opening holes around short words like MOA.
// Each run has to be wider than the widest screen, so short sets repeat more.
const run = words => {
  const once = words.join(' ');
  return Array(Math.max(2, Math.ceil(40 / once.length))).fill(once).join('  ');
};

const CSS = `
.type-backdrop {
  position: absolute;
  inset: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: var(--background);
  pointer-events: none;
}
.type-backdrop-row {
  display: flex;
  width: max-content;
  white-space: pre;
  font-family: 'Rubik Mono One', sans-serif;
  font-size: max(48px, min(12vh, 16vw));
  line-height: 1.02;
  color: transparent;
  -webkit-text-stroke: 1.4px var(--primary);
  opacity: 0.45;
  will-change: translate;
  animation: type-backdrop-flow var(--flow) linear infinite var(--direction);
}
.type-backdrop-row > span { padding-right: 2ch; }
@keyframes type-backdrop-flow {
  from { translate: 0 0; }
  to { translate: -50% 0; }
}
@media (prefers-reduced-motion: reduce) {
  .type-backdrop-row { animation: none; }
}
`;

export function TypeBackdrop() {
  return (
    <div className="type-backdrop" aria-hidden="true">
      <style>{CSS}</style>
      {/* The set repeats so tall, narrow screens are covered too; rows past
          the edges are clipped and never painted. */}
      {[...ROWS, ...ROWS].map((words, row) => {
        const text = run(words);
        return (
          <div
            key={row}
            className="type-backdrop-row"
            // Longer runs travel further per loop, so their duration scales with
            // length to keep every row moving at a similar, unhurried pace.
            style={{ '--flow': `${Math.round(text.length * (1.5 + (row % ROWS.length) * 0.12))}s`, '--direction': row % 2 ? 'reverse' : 'normal' }}
          >
            {/* Two identical runs: shifting by half the row loops seamlessly. */}
            <span>{text}</span>
            <span>{text}</span>
          </div>
        );
      })}
    </div>
  );
}
