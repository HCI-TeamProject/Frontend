# AGENTS.md

Guidance for AI coding agents working on the Moa frontend.

UI is built with shadcn/ui (new-york style, JSX) on Tailwind CSS v4.
- Components live in `src/components/ui/` and are owned code: edit them freely.
- Add a component with `npx shadcn@4.23.0 add <name>`. Afterwards check that
  imports read `@/lib/utils`. The CLI has rewritten them to a package named
  `cn` and added `cn` to package.json; undo both if it happens again.
- Colors, radius and fonts are CSS variables in `src/index.css` (`:root` and
  `@theme inline`). The primary color is Konkuk University green (#00703C);
  the font is Pretendard. Change tokens there, not with hex values in components.
- Style with Tailwind classes and the `cn()` helper from `@/lib/utils`.
- `src/style.css` is the old hand-written CSS, loaded in the `legacy` layer so
  Tailwind utilities always win. Screens not yet moved to shadcn still use it;
  move a screen's markup to shadcn before deleting its rules.
- Charts use Recharts through `@/components/ui/chart`.

Tests: `npx vitest run` (Testing Library, `src/test`). Query by role and
accessible name, so keep real headings, labels and button names.
