import { Construction } from "lucide-react";
import Link from "next/link";

type Props = {
  title: string;
  description?: string;
};

export function PlaceholderPage({ title, description }: Props) {
  return (
    <section className="min-h-[60vh] flex items-center justify-center bg-[var(--sandstone)]">
      <div className="max-w-lg mx-auto px-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--atlantic-navy)]/5 mb-6">
          <Construction className="w-8 h-8 text-[var(--atlantic-navy)]/40" />
        </div>
        <h1 className="text-[var(--atlantic-navy)] text-3xl mb-3">{title}</h1>
        <p className="text-[var(--nantucket-gray)] text-sm leading-relaxed mb-8">
          {description ||
            "This section is being built. Sign up below to be the first to know when it launches."}
        </p>

        {/* Klaviyo Notify Me form */}
        <div className="klaviyo-form-WysYSe mb-6" />

        <Link
          href="/"
          className="text-sm text-[var(--privet-green)] hover:underline transition-colors"
        >
          &larr; Back to Command Center
        </Link>
      </div>
    </section>
  );
}
