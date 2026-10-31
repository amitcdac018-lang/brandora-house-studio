import Image from "next/image";
import Link from "next/link";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center ${className}`}
      aria-label="Elora Kicks home"
    >
      <Image
        src="/logo-mark.png"
        alt="Elora Kicks"
        width={160}
        height={160}
        priority
        className="h-10 w-10 object-contain sm:h-11 sm:w-11"
      />
      <span className="ml-2 hidden font-display text-xl tracking-wide text-brand-ink sm:inline">
        Elora <span className="text-brand-gold">Kicks</span>
      </span>
    </Link>
  );
}
