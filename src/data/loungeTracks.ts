export interface LoungeTrack {
  title: string;
  artist: string;
  /** Path under /public — e.g. "/studio/music/track-01.mp3". */
  src: string;
}

// Real tracks supplied by the user (Epidemic Sound exports — "ES_<Title>
// - <Artist>.mp3" filenames), transcoded to 128kbps/44.1kHz stereo for
// web delivery and placed under public/studio/music/. Title/artist below
// are read directly from those original filenames, not invented.
export const LOUNGE_TRACKS: LoungeTrack[] = [
  { title: "Orizon", artist: "Bonsaye", src: "/studio/music/orizon.mp3" },
  { title: "Ocean Waves", artist: "Phello", src: "/studio/music/ocean-waves.mp3" },
  { title: "Palm Oil", artist: "Guustavv", src: "/studio/music/palm-oil.mp3" },
  { title: "Unseen", artist: "Elin Piel", src: "/studio/music/unseen.mp3" },
  { title: "The Night Is Ours (Instrumental)", artist: "Heyson", src: "/studio/music/the-night-is-ours.mp3" },
  { title: "Lost & Found", artist: "Bonsaye", src: "/studio/music/lost-and-found.mp3" },
  { title: "Rotating Landscapes", artist: "Aleph One", src: "/studio/music/rotating-landscapes.mp3" },
  { title: "Live for the Weekend (Instrumental)", artist: "The Yard Woman", src: "/studio/music/live-for-the-weekend.mp3" },
  { title: "SLIDA", artist: "Jiggz", src: "/studio/music/slida.mp3" },
];
