import Link from 'next/link';

export default function NotFound() {
  return (
    <>
      {/* Background */}
      <div className="bg-wrap">
        <div className="bg-base" />
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
        <div className="bg-orb bg-orb-4" />
        <div className="bg-mesh" />
        <div className="bg-noise" />
      </div>

      <div className="not-found-page">
        <div className="not-found-content">
          <div className="not-found-code">404</div>
          <h1 className="not-found-title">Page not found</h1>
          <p className="not-found-desc">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link href="/" className="not-found-link">
            Back to tools
          </Link>
        </div>
      </div>
    </>
  );
}
