# Sticker pack 01

Interaction reference: https://www.bubbbly.com/sticker-pack

The user's six inline reference images were not exposed as local attachments in this session. This first pack uses matching publicly available logo artwork from the sources below, with backgrounds removed, excess space cropped, and a white die-cut border added. The Spider-Man source is a matching round mask, not the exact distressed photograph in the reference. No generative artwork was used. Logos and character artwork belong to their respective owners; these source links are provenance, not a license claim.

| Sticker | Downloaded source |
| --- | --- |
| Omnitrix | https://www.liblogo.com/img-logo/be4497b33d-ben-10-logo-ben-10-omnitrix-logo-ben-10-ben-10-birthday-ben-10-party.png |
| Marvel Comics | https://www.citypng.com/public/uploads/preview/marvel-comics-logo-hd-png-701751694711772mokzztl5l7.png |
| The Dark Knight | https://inkyprinty.in/cdn/shop/files/the-dark-knight-logo-sticker-india-600x800.jpg?v=1728367171&width=1445 |
| Spider-Man | https://i.ebayimg.com/images/g/hzIAAOSwPGxlHZD9/s-l1200.jpg |
| Offline Dino | https://ih1.redbubble.net/image.780233655.8285/st%2Csmall%2C507x507-pad%2C600x600%2Cf8f8f8.jpg |
| OpenAI | https://www.magnolia-cms.com/dam/jcr%3A606b86b7-cb7b-48d3-8325-741d0c212162/openai-logo-black_transparent.png |

The four box walls share a continuous perimeter coordinate. Stickers crossing a vertical corner fold onto the next face while preserving their UVs. Lid stickers remain attached to the moving lid and are kept inside its top surface. A short press-down curl settles after placement; reduced motion settles immediately. Gloss uses a clear-coated physical material; Holo adds iridescence.

Each sticker is a single cutout mesh with a white paper reverse. Explicit insertion order makes the newest sticker draw on top, while box depth still hides stickers on the far side. Stickers do not write depth against one another, avoiding flickering when curls overlap. Drag previews reuse their geometry, material and buffers, then become the placed sticker. Camera framing and the floor use the cardboard bounds, excluding animated sticker curls; the scene skips its settled update work when idle.

Arrangements are capped at 24 stickers and saved only in this browser's local storage (`phillip-shortbox-stickers-v1`). There are no uploads or shared public changes. Undo retains the last 20 changes during the session, including clearing the box. Stored entries are validated before loading. Storage failure falls back to a session-only arrangement.

Run the geometric and saved-data checks with `node --test off-the-clock/stickers.test.mjs` from the repository root. The eight checks include preview reuse, rotated lid fitting and exact saved transforms, cutout-aware picking, and 24 overlapping stickers through placement, animation, save/reload, clear and undo. Visual checks should include a rotated sticker across a front/side corner, the rear and left corners, a lid sticker while opening the box, overlapping cutouts, undo/clear, reload persistence, and the phone layout.

## Mobile controls

The mobile ruler treatment is inspired by https://www.bubbbly.com/app/flower-life.html#magnolia. It is an original HTML/CSS implementation over native range inputs: graduated ticks, a moving marker, and value badges. Comic browsing snaps to each edition and stays synchronized with the series selector. Sticker size and angle use the same visual treatment, with native keyboard controls and spoken values.

On phones, the collection has a stable scene height in normal document flow, so more sections can be added below. Vertical gestures over the box scroll the page; horizontal drags turn the box. Its ruler runs vertically on the right, from the first comic at the top to the last at the bottom, and owns comic browsing. Neither vertical touch gestures nor wheel events over the mobile collection advance comics. The floating Reset View button is removed; R still resets a focused collection or comic.

The sticker studio uses a right-side vertical ruler with Size/Angle switches, a separate tools tray, and a Stick here button for the active preview. Both the current size and angle appear beside the preview status, including while just one ruler is shown. Within that modal, only the tools content scrolls; touch-device landscape uses a side tray. Desktop wheel browsing, navigation and horizontal range controls keep their existing behavior. The responsive cutoff is 700px; the wider landscape layout also requires a coarse pointer, so a short desktop window does not enable the rulers. The same native inputs move between the mobile rail and desktop panel, preserving values on resize and exposing the correct accessible orientation.


## Drag and drop

Pick a sticker to preview it on a visible box surface, or drag it from the pack and drop it onto a wall, corner, or lid. Dropping leaves the preview editable. Size, angle and finish always apply to that visible preview. Drag the cutout itself to reposition it, or tap another box surface; dragging bare box turns the box. Cutout-aware picking ignores transparent corners and previews behind the box. A drag keeps the original grab offset and transform, including across corners. The floating cutout reflects the selected angle and size, while the projected preview shows its actual size on the box.

Choose **Stick here** (or focus the scene and press Enter) to save the current preview. Arrow keys nudge it; Escape or the cancel button discards it. Controls are inactive without a preview, so changing a slider cannot silently configure a future sticker. Size moves in 1% increments. If a rotated sticker must shrink to fit a surface, the actual fitted value updates the preview, range input and label together. Passing across a smaller surface during a drag does not permanently shrink the sticker before dropping. Placed stickers can be undone, and previews are never saved automatically.

Surface updates run at most once per animation frame. Invalid drops and interrupted drags restore the previous preview, including its artwork, size, angle and position. Pointer cancellation, lost capture, Escape, window blur and closing the studio clean up pointer capture and the floating cutout. Native image dragging and touch scrolling on sticker tiles are disabled. There is no turn/position mode switch; the mobile rulers remain vertical on the right and the scene stays fixed inside the studio.
