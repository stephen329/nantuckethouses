import { Clock } from "lucide-react";

type Props = {
  minutes: number;
  className?: string;
};

export function ReadingTime({ minutes, className = "" }: Props) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs text-[var(--nantucket-gray)] font-sans ${className}`}>
      <Clock className="w-3 h-3" />
      {minutes} min read
    </span>
  );
}
