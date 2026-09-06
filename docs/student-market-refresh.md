# Student Market case-study refresh — September 2026

The refreshed case study shows the product before introducing its implementation details. It replaces the long opening and repeated engineering cards with visible workflow evidence and three decisions: recoverable selling, consistent conversation history, and explicit review authority. Existing portfolio typography, colours and galleries are reused; the new stylesheet is loaded only by this page.

## Screenshot sources

- `student-market-catalogue-sep2026.png`: fresh capture of the live public marketplace in an unauthenticated guest browser, 1440 × 1000.
- `student-market-queue-mobile-sep2026.png`: implemented September listing queue with synthetic demonstration records, 390 × 844.
- `student-market-review-mobile-sep2026.png`: implemented September listing review, with the image decoded before capture, 390 × 844.
- `student-market-photo-mobile-sep2026.png`: the shared listing photo viewer, 390 × 844.

The three moderation captures use the actual application components in a local fixture. Only Next.js developer tooling was hidden; the application UI and demonstration records were not rewritten for the screenshots. Existing conversation and original gallery images are retained as earlier demo evidence. No real private conversation or moderation record was newly captured. All four new images are PNGs with matching dimensions and file extensions.

## Evidence and status

The 322-test figure comes from the 6 September Student Market implementation at `acedbfe99301f0f3652c964a355bffeb1793f01b` and [the successful Linux/macOS CI run](https://github.com/EdoiseO/student-market-of-toronto/actions/runs/34047072337). Repository file counts were removed from the hero, and school-domain checks are not described as verified student enrollment or inbox ownership.

The new moderation UI is explicitly labelled a release preview. Student Market's final hosted checks and production rollout remain pending. Update this status only after rollout is verified. This portfolio branch is a review draft; publishing it is separate from the Student Market production deployment.

## Browser checks

- No horizontal page overflow at 320, 390, 768, 1024 and 1440 CSS pixels.
- All 11 gallery links open their matching image; zoom, Escape and focus restoration pass.
- Gallery arrow navigation, engineering disclosures and the mobile dialog pass.
- Direct screenshot links work with JavaScript disabled.
- No page exceptions or failed HTTP responses during the local portfolio checks.

These are browser and static checks, not a full assistive-technology or device certification. The original portfolio checkout is preserved; this work is on `agent/student-market-case-study-refresh`.
