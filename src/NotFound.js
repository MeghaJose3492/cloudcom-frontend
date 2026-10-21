import { Link } from 'react-router-dom';
import './NotFound.css';

function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-content">
        <p className="not-found-code">ERROR 404 <span>•</span> PAGE NOT FOUND</p>
        <h1>This page isn't here.</h1>
        <p className="not-found-copy">The address may be incorrect, or the page may have moved.</p>
        <Link className="not-found-home" to="/">Return to CloudCom</Link>
      </div>
    </main>
  );
}

export default NotFound;