The Crate — Institute for Creative Thought

Responsive jazz-sleeve homepage for https://thecrate.ca, hosted on GitHub Pages.

Design
- Burnt-orange and black vinyl artwork, created from the approved Instagram jazz cover with its baked lettering removed.
- Real HTML typography: staggered cream credits, a right-aligned orange title stack and cream wordmark on the same baseline.
- Responsive desktop and portrait crops, with a compact footer above the viewport edge.
- Website metadata shares the approved full jazz cover.

Motion
- Artwork glitches and fades in over 1.2 seconds once its image and fonts are ready.
- Typography then reveals sequentially over 2 seconds, finishing at 3.2 seconds.
- The opening runs once per page load. Completed animation layers are released; sound controls never restart it.
- The background uses a freshly generated, text-free vinyl video, made into a repeating loop. Typography stays separate in HTML. Reduced-motion visitors see a stationary poster.

Sound
- The approved balanced vocal mix of Out the Crate, 74 BPM, is preserved.
- Audio attempts autoplay; browsers requiring a gesture can use the record touch region or footer control.
- Tap, Enter or Space fades in over 1.2 seconds or fades out over 0.9 seconds before pausing. Rapid taps reverse the fade smoothly.
- Video starts with actual soundtrack playback, pauses during audio buffering, stops when the audio fade-out finishes and resumes from its held frame. Video has no audio track and never resets the typography. Hiding the page pauses both.
- Native audio controls are available without JavaScript. Failed artwork or script loading cannot indefinitely hide the text.

Files
index.html: accessible typography and page structure.
hero.css: layout, artwork, animation and responsive treatment.
motion.js: one-time opening and reduced-motion handling.
sound.js: soundtrack and shared playback controls.
Previous circular-label assets and styles remain in version history and the studio files.

Run locally: python3 -m http.server 8765
