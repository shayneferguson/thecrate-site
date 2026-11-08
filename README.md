The Crate — Institute for Creative Thought

A responsive record-label placeholder for https://thecrate.ca, hosted on GitHub Pages. Typography is real HTML; the worn paper and spindle are a separate background image.

The soundtrack is Out the Crate (74 BPM, 3:29), the approved full vocal arrangement over Throop Avenue Last Call. The original instrumental and editable studio sources are preserved outside this deployment.

Interaction
- Sound and the 9.55-second typography reveal start together when the browser permits autoplay.
- Browsers that require a gesture display the complete static label first. Touching the label starts sound and the reveal together.
- The label is an invisible, circular native button. Tap, Enter or Space toggles playback.
- Drag anywhere in the black background to scratch the actual stereo audio forwards or backwards. Vertical movement also sweeps the tone. Holding still stops the sound; releasing continues at the sample actually being heard, without jumping back to an earlier timeline.
- Pointer capture retains the gesture across the label and outside the original hit area. Cancellation releases the scratch; hiding the page pauses playback.
- Typography advances during playback, holds during pause/scratch and stays revealed afterwards. Reduced-motion visitors see stationary typography.

Implementation
sound.js handles loading, browser audio activation and Pointer Events. scratch-processor.js performs bidirectional interpolation, variable speed, smoothing and playhead reporting in an AudioWorklet. The full 320 kbps MP3 is fetched and decoded once. PCM channels are transferred to the audio thread. sound.css contains the circular hit area and minimal instructions. motion.js / motion.css contain the reveal. The label copy and positions remain in index.html.

Fallbacks
No JavaScript, or browsers without AudioWorklet, retain native audio controls. Network/decode errors offer a label-tap retry. No microphone permission is needed. Browser autoplay policies cannot be bypassed.

Verification
Run node --test tests/scratch-processor.test.cjs for forward/reverse playback, pause, held silence, release continuity, boundaries and replay. Local browser checks cover label/keyboard activation, reverse/vertical dragging, release, and a 390 × 844 viewport.
Run locally: python3 -m http.server 8767

Editable FigCraft and DesignCraft documents and original source assets remain in the studio project outside this public repository.
