import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  caption?: string;
};

export function ArticleImage({ src, alt, caption }: Props) {
  return (
    <figure className="my-8">
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-[var(--nantucket-gray)]/10">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 65vw"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-xs text-[var(--nantucket-gray)] text-center font-sans">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
