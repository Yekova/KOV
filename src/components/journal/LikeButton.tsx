"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const STORAGE_KEY = "kov_liked_posts";

function readLikedIds(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeLikedIds(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage unavailable (private mode, quota) — like state just won't persist
  }
}

export function LikeButton({ postId, initialLikes }: { postId: string; initialLikes: number }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // localStorage can only be read client-side, after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLiked(readLikedIds().includes(postId));
  }, [postId]);

  async function handleClick() {
    if (pending) return;
    setPending(true);

    const nextLiked = !liked;
    const delta = nextLiked ? 1 : -1;

    setLiked(nextLiked);
    setLikes((n) => Math.max(0, n + delta));

    const ids = readLikedIds();
    writeLikedIds(nextLiked ? [...ids, postId] : ids.filter((id) => id !== postId));

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.rpc("toggle_post_like", { post_id: postId, delta });

    if (error) {
      setLiked(!nextLiked);
      setLikes((n) => Math.max(0, n - delta));
      writeLikedIds(ids);
      toast.error("Impossible d'enregistrer votre réaction.");
    }

    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={liked}
      aria-label={liked ? "Retirer le like" : "Aimer cet article"}
      className="flex items-center gap-2 h-10 px-4 transition-colors disabled:opacity-60"
      style={{
        background: liked ? "rgba(227, 30, 36, 0.12)" : "var(--kov-carbon)",
        border: `1px solid ${liked ? "var(--kov-red)" : "var(--kov-border)"}`,
        borderRadius: "var(--radius-pill)",
      }}
    >
      <motion.span
        key={liked ? "liked" : "unliked"}
        initial={{ scale: 0.7 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className="flex items-center"
      >
        <Heart size={16} strokeWidth={1.5} fill={liked ? "var(--kov-red)" : "none"} color={liked ? "var(--kov-red)" : "currentColor"} className={liked ? "" : "text-kov-bone"} />
      </motion.span>
      <span className="text-sm text-kov-bone tabular-nums">{likes}</span>
    </button>
  );
}
