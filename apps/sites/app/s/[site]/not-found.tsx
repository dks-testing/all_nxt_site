import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container-site max-w-xl text-center">
        <p className="eyebrow mb-2">404</p>
        <h1 className="mb-4 text-3xl font-bold uppercase">Page not found</h1>
        <p className="mb-8 text-[var(--color-muted)]">The page you were looking for has moved or no longer exists.</p>
        <Link href="/" className="btn btn-primary">Back to home</Link>
      </div>
    </section>
  );
}
