# Media/runtime final evidence handoff

Date: 2026-09-15 (Asia/Ho_Chi_Minh)

## Provenance

- Tested candidate SHA: `3d5ed66f2e79d809721539f5f1c191688b3959b5`.
- Worktree: `/private/tmp/nganha-pagespeed-media-runtime`.
- Browser server: local Next production build at `http://127.0.0.1:3388`.
- No production DB/Storage write, push, or deploy was performed.

## Results

- Our Story browser replay: `PASS_LOCAL_BROWSER` for mobile cold ×2, desktop cold, and IntersectionObserver-absent. Storage read-back and live currentSrc remain `NOT_VERIFIED`.
- Final-candidate replay after the menu/Hero fixes: `PASS_LOCAL_BROWSER` on candidate `f5f62436a90b764222cea73066473f81bdb9f179`, using the same four profiles. Raw report and screenshots are under `final-candidate/`.
- Hero active CDP replay: actual encodedDataLength was captured for three runs per mobile and desktop profile over a 12-second window. The active local config selected the original Supabase MP4; no matched baseline/candidate rendition pair was available, so the ≥70% transfer reduction gate is `NOT_VERIFIED`. Several runs transferred approximately 25–27 MB, which must not be reported as a reduction.
- Profiles: mobile 390×844 DPR2 and desktop 1440×900 DPR1.

## Residuals

1. Publish/read back versioned 64/128/192 thumbnails from approved staging Storage and verify intrinsic dimensions/currentSrc.
2. Produce matched baseline/candidate Hero transfer runs using the same published clip, config, network, CPU and browser profile.
3. Run final media suite again after any asset publication and on the frozen candidate SHA.

## Rollback

Evidence is additive and can be removed without changing application behavior. No runtime source files were changed in this role.
