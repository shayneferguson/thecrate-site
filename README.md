The Crate — Institute for Creative Thought

A responsive record-label placeholder for https://thecrate.ca, hosted on GitHub Pages. Typography is real HTML; the worn paper and spindle are a separate background image.

The soundtrack is Out the Crate (74 BPM, 3:29), the approved full vocal arrangement over Throop Avenue Last Call. The original instrumental and editable studio sources are preserved outside this deployment.

Interaction
- The 9.55-second typography reveal runs once on page load, after the paper and fonts are ready. It completes independently of audio permission, playback or label taps, then holds the finished layout.
- Sound attempts to play automatically. Where the browser requires a gesture, touching the label starts only the audio.
- The label is an invisible, circular native button. Tap, Enter or Space toggles audio play/pause. Resuming sound never restarts the typography.
- Eighteen white vector grooves surround the stationary label at 60% group opacity. Each follows its own continuous 48–138 second rotation, with varied offsets and directions. They move on load, then pause/resume with the label’s audio controls without resetting their angles. Autoplay denial leaves the introductory visual moving until audio is started.
- The black background has no sound interaction. Scratching and warping remain removed.
- Hiding the page pauses audio. Reduced-motion visitors see stationary typography and grooves.

Implementation
sound.js uses native HTML audio playback, independent of motion.js / motion.css. sound.css contains the responsive record stage, independent groove animations, circular hit area and minimal instructions. The inline SVG is editable vector geometry. The label copy and positions remain in index.html. No AudioWorklet or full-track PCM decoding is needed.

Fallbacks
Without JavaScript the original static label and native audio controls remain available. A bounded startup fallback prevents hidden text if assets fail. Audio errors offer a label-tap retry.

Run locally: python3 -m http.server 8767

Editable FigCraft and DesignCraft documents and original source assets remain in the studio project outside this public repository.
