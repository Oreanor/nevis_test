import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <>
      <title>Page not found · Nevis</title>
      <h1 className="text-2xl font-normal sm:text-title">Page not found</h1>
      <p className="text-body text-muted">
        The page you are looking for does not exist.{' '}
        <Link to="/" className="text-ink underline underline-offset-2">
          Go to Clients
        </Link>
      </p>
    </>
  );
}
