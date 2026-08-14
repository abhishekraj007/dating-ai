"use client";

import { cn } from "@/lib/utils";

type CharacterPickCardProps = {
  name: string;
  tagline: string;
  occupation: string | null;
  avatarUrl: string | null;
  isTrending: boolean;
  selected: boolean;
  onSelect: () => void;
};

export function CharacterPickCard({
  name,
  tagline,
  occupation,
  avatarUrl,
  isTrending,
  selected,
  onSelect,
}: CharacterPickCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative h-[460px] w-[min(100%,340px)] shrink-0 overflow-hidden rounded-[28px] text-left transition-transform active:scale-[0.98]",
        selected ? "ring-2 ring-white" : "ring-1 ring-white/10",
      )}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-zinc-900" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      {isTrending ? (
        <span className="absolute left-4 top-4 rounded-full bg-white/16 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.4px] text-white">
          Trending
        </span>
      ) : null}
      <div className="absolute inset-x-5 bottom-5 space-y-1 text-white">
        <p className="text-[32px] font-extrabold leading-none tracking-tight">
          {name}
        </p>
        <p className="text-[15px] font-semibold text-white/82">
          {occupation ?? tagline}
        </p>
        {occupation ? (
          <p className="line-clamp-2 text-sm leading-5 text-white/70">
            {tagline}
          </p>
        ) : null}
      </div>
    </button>
  );
}
