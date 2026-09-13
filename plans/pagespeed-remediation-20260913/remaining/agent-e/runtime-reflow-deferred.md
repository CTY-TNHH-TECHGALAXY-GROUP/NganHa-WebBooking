# Agent E handoff — runtime/reflow/animation

Status: DEFERRED pending trace attribution; no runtime code changed.

The available diagnostic baseline is a 390×844 DPR2 unthrottled capture, not a CPU/network-controlled Lighthouse trace. Homepage recorded 4 long tasks totalling about 568 ms in the earlier capture; `/history` recorded 3 totalling about 385 ms. The forced-reflow audit was unattributed (about 45 ms), and the two non-composited History animations were identified by selector/property only. This evidence does not establish a write→read layout sequence or a safe owning function.

Required next run: production build of the integration SHA, Chromium Performance trace with CPU/network profile fixed, navigation + scroll + scene change + menu/chat + checkout + locale interaction, and DevTools attribution for each long task/layout event. Record selector, function, source line, before/after screenshots and task duration. Only then batch geometry reads/writes, pause offscreen animation, or split a feature chunk. Keep existing rAF lifecycle, reduced-motion behavior, book/Galaxy transitions and interaction feedback until attribution proves a scoped change.

Gate: no new task over 200 ms from a changed file; TBT median target ≤200 ms or ≥30% reduction across three comparable runs. Do not claim INP from synthetic clicks or claim this workstream done from the current diagnostic numbers.
