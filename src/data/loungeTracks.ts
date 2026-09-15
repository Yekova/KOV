export interface LoungeTrack {
  title: string;
  artist: string;
  /** MP3 fallback, for browsers that can't take the Opus version below. */
  src: string;
  /** Same track as WebM/Opus at 96kbps — preferred wherever the browser
   * reports it can play it (Chrome, Edge, Firefox, Safari 17+).
   *
   * Two reasons, one of them the point. It is better and smaller than the
   * 128kbps MP3 it replaces (the whole set drops from ~30MB to ~25MB at
   * higher quality). And it reaches a completely different decoder inside
   * the browser: nothing about playing Opus in WebM goes through the MP3
   * path, which is the one that has been taking the tab down. */
  srcOpus: string;
  /** Path under /public to real cover art, if supplied — e.g.
   * "/studio/music/covers/orizon.webp". None of the tracks below have one
   * (no cover art was provided for these Epidemic Sound exports), so the
   * player falls back to a plain abstract mark rather than a fabricated
   * image. Add this once real artwork exists for a track. */
  cover?: string;
}

// Both encodings of a track live under the same basename, so there is one
// name to get right rather than two paths to keep in step.
function track(title: string, artist: string, slug: string): LoungeTrack {
  return {
    title,
    artist,
    src: `/studio/music/${slug}.mp3`,
    srcOpus: `/studio/music/${slug}.webm`,
  };
}

// Real tracks supplied by the user (Epidemic Sound exports — "ES_<Title>
// - <Artist>.mp3" filenames), transcoded for web delivery and placed under
// public/studio/music/. Title/artist below are read directly from those
// original filenames, not invented.
export const LOUNGE_TRACKS: LoungeTrack[] = [
  track("Orizon", "Bonsaye", "orizon"),
  track("Ocean Waves", "Phello", "ocean-waves"),
  track("Palm Oil", "Guustavv", "palm-oil"),
  track("Unseen", "Elin Piel", "unseen"),
  track("The Night Is Ours (Instrumental)", "Heyson", "the-night-is-ours"),
  track("Lost & Found", "Bonsaye", "lost-and-found"),
  track("Rotating Landscapes", "Aleph One", "rotating-landscapes"),
  track("Live for the Weekend (Instrumental)", "The Yard Woman", "live-for-the-weekend"),
  track("SLIDA", "Jiggz", "slida"),
];
