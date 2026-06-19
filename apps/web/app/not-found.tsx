import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 bg-background">
      {/* Subtle ambient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/4 h-[360px] w-[360px] rounded-full bg-primary/8 blur-[100px]"
      />

      <div className="relative z-10 flex flex-col items-center gap-8 text-center">
        {/* Logo — swaps with theme */}
        <Link
          href="/"
          aria-label="FeelAI home"
          className="mb-2 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg"
        >
          <Image
            src="/logo-transparent.png"
            alt="FeelAI"
            width={120}
            height={36}
            priority
            className="block h-9 w-auto dark:hidden"
          />
          <Image
            src="/logo-transparent.png"
            alt="FeelAI"
            width={120}
            height={36}
            priority
            className="hidden h-9 w-auto dark:block"
          />
        </Link>

        {/* 404 number */}
        <p className="text-[7rem] font-bold leading-none tracking-tight text-foreground/[0.07] select-none dark:text-foreground/[0.06]">
          404
        </p>

        {/* Headline + description */}
        <div className="-mt-6 flex flex-col items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Page not found
          </h1>
          <p className="max-w-xs text-sm text-muted-foreground text-pretty leading-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Back to home */}
        <Link
          href="/"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-[0_4px_20px_-6px_rgba(0,0,0,0.4)] transition-[background-color,transform] hover:bg-primary/85 active:translate-y-px"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
