# Independent closeout review — 2026-09-15

Verdict: PARTIAL. Reject the claim that all four acceptance gates are closed.

Reviewed commit: e5c9d28b0cc6531ca88144413bf3ae30c6e2162a. Read-only remote verification confirms master and vercel both point to this commit. HTTPS HEAD to https://oria-spa.vercel.app returned 200 on 2026-09-15 at 10:19 UTC. Response assets reference deployment dpl_2YhtA5qSxxEqy25XPG55o5oLyaGA. That is not proof of its Git SHA or ownership; Vercel deployment metadata is still required. No production rollback, push, deploy, or DB mutation was performed in this review.

## Findings

1. **Database gate unsupported.** scripts/test-cas-concurrency-contract.mjs reads SQL using regular expressions and runs MockSystemConfigCAS backed by a JavaScript Map. It never connects to PostgreSQL or executes the migration. Its async method contains no await, so its two writes execute sequentially. ACLs, independent concurrent transactions, crash/resume, partial migration and actual rollback/read-back are unverified. Mandatory expectedRevision validation was implemented in both API paths; local source/simulation tests pass.
2. **Runtime PASS contradicts raw results.** remaining/agent-q/runtime-trace-agent-q-20260915054614-f1e1f375-6a19-442c-abec-78a1ac7478f1.json has status NOT_VERIFIED, as do all three runs. Each has four failed assertions: horizontal film strip, menu close, chat close, and back-navigation scroll stability. Tested SHA is 8d80f5c, not e5c9d28. Failures may arise from test selectors/timing or app behavior; they are not proven application regressions. No runtime improvement can be accepted from them.
3. **Accessibility viewport evidence is wrong.** Browser context creation spreads width/height into context options instead of nesting viewport. All 24 raw axe results say windowWidth 1280, including cases labeled 390 and 1440. The raw file has zero violations but 1,945 incomplete node occurrences. Keyboard testing only checks whether some Tab step reaches A/BUTTON; it does not prove Escape/focus return or checkout operability. Device pinch and complete five-locale font/glyph/weight/CLS coverage are missing.
4. **Our Story fallback test was removed.** e5c9d28 deleted the run with disableIntersectionObserver. The test sets the property to undefined; the component previously checked property existence and could construct undefined. Restored this run, corrected feature detection to typeof === function, and corrected the Playwright waitForFunction timeout argument. Browser acceptance must be rerun.
5. **Video and thumbnail gates unsupported.** hero-rendition-selection.browser.mjs serves local files and creates a standalone video via page.setContent, reimplementing source selection. It prints filesystem size and request range; it does not measure actual app transfer in matched 12-second windows or prove deployed rendition URLs. Filesize percentages do not close R7. Our Story screenshots/DOM state do not establish 64/128/192 History thumbnail generation, intrinsic dimensions, DPR selection or byte budgets.
6. **Deployment status overstated.** Both remote branches are verified, but successful push and homepage HTTP 200 do not establish deployment SHA, successful SQL application, authorized service_role access, full public route/canonical/cache behavior, or live browser acceptance.

## Corrections made locally in this review

- Corrected accessibility viewport configuration; added assertions for measured width/height and WCAG 2.1 tags.
- Restored the missing Our Story IO-unavailable case, fixed the wait timeout API call and actual IO feature detection.
- Renamed the CAS test output to state its simulation-only limitations.
- Superseded the unsupported APPROVED verdict in FINAL_ACCEPTANCE_REPORT.md while retaining historical claims for traceability.
- Validation: TypeScript, migration safety, Our Story contract, CAS source/simulation, and git diff --check all exit 0. These are local checks on this review patch. Corrected browser tests, DB tests and live acceptance have not passed and must not be marked complete.

## Required to finish

- Execute reviewed SQL on disposable PostgreSQL; run real ACL, concurrent transaction, migration crash/resume and rollback/read-back tests. Verify production RPC availability read-only before any release depending on it.
- Rebuild the corrected candidate and run restored media/IO tests, real app Hero recovery, accurate viewport accessibility and keyboard checks; adjudicate contrast and capture device evidence.
- Repair runtime test selectors/timing against source and rerun three matched runs; establish attribution and measure required video transfers/thumbnail outputs and font coverage.
- Confirm deployment metadata maps the official alias to the intended SHA; verify public route/canonical/asset matrix and live regressions. Keep the four gates open until these pass.
