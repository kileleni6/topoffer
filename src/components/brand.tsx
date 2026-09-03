import { Link } from "@tanstack/react-router";

export function Logo() {
  return (
    <Link to="/" search={{ category: "all" }} className="flex items-center gap-2.5">
      <img
        src="/bid-buddy-mark.png"
        alt=""
        className="h-9 w-9 object-contain"
        width="36"
        height="36"
      />
      <span className="text-xl font-bold tracking-tight">
        BID <span className="text-primary">BUDDY</span>
      </span>
    </Link>
  );
}

export function Tile({
  initials,
  tint,
  size = "md",
}: {
  initials: string;
  tint: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-6 w-6 text-[10px] rounded-md" : "h-11 w-11 text-sm rounded-xl";
  return (
    <span
      className={`flex shrink-0 items-center justify-center font-bold text-white/95 ${dim}`}
      style={{ backgroundColor: tint }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
