export interface LoungeTrack {
  title: string;
  artist: string;
  /** Path under /public — e.g. "/studio/music/track-01.mp3". */
  src: string;
}

// Empty on purpose — no royalty-free music library exists anywhere in
// this codebase or accessible to the assistant that built this file, so
// none was invented. Drop real, cleared-for-use audio files under
// public/studio/music/ and add one entry per track here (title, artist,
// the file's /public path) to populate the Lounge room's AirPods player
// (StudioMusicPlayer.tsx) — it already handles any number of real tracks,
// and honestly shows "Aucune piste" while this stays empty.
export const LOUNGE_TRACKS: LoungeTrack[] = [];
