import { useEffect, useState } from 'react';
import './Blog.css';

const CATEGORY_COLORS = {
  'Nutrition': '#f59e0b',
  'Mindset':   '#8b5cf6',
  'Training':  '#e53e3e',
  'Recovery':  '#10b981',
  'General':   '#3b82f6',
};

// BlogImage — handles lazy loading with a smooth fade-in.
// Uses a real <img> tag instead of CSS background-image so the browser
// can apply its native lazy loading, decoding optimizations, and caching.
// While the image hasn't loaded yet, a gradient placeholder is shown so
// the card layout doesn't shift or flash.
function BlogImage({ src, alt, accentColor }) {
  // loaded tracks whether the image has finished downloading.
  // Starts false — image is invisible until onLoad fires.
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="blog-card-img-wrapper">

      {/* Gradient placeholder — always rendered but hidden once image loads.
          Uses the category accent color so each card's placeholder matches
          its badge color instead of a generic grey. */}
      <div
        className={`blog-img-placeholder ${loaded ? 'hidden' : ''}`}
        style={{
          background: `linear-gradient(135deg, #1a1a2e, ${accentColor}55)`
        }}
      />

      {/* Real <img> tag with:
          loading="lazy"   — browser only fetches when near the viewport
          decoding="async" — image decoding runs off the main thread (faster paint)
          onLoad           — fires when image is fully downloaded and decoded */}
      {src && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`blog-img ${loaded ? 'visible' : ''}`}
          onLoad={() => setLoaded(true)}
        />
      )}

      {/* Category badge always on top */}
      <span
        className="blog-category-badge"
        style={{ background: accentColor }}
      >
        {alt}
      </span>
    </div>
  );
}

export default function Blog() {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res  = await fetch(`${import.meta.env.VITE_API_URL}/api/blog`);
        const data = await res.json();
        if (data.success) setPosts(data.posts);
      } catch (err) {
        console.error('Blog fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <section className="blog-section">
      <div className="blog-inner">

        <div className="blog-header">
          <p className="blog-eyebrow">Tips & Insights</p>
          <h2 className="blog-title">Fitness Knowledge Hub</h2>
          <p className="blog-subtitle">
            Expert advice on training, nutrition, and recovery to fuel your journey.
          </p>
        </div>

        {loading ? (
          <div className="blog-grid">
            {[...Array(3)].map((_, i) => (
              <div className="blog-card skeleton-card" key={i}>
                <div className="skeleton-img" />
                <div className="blog-card-body">
                  <div className="skeleton-line short" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line short" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="blog-grid">
            {posts.map(post => {
              const accentColor = CATEGORY_COLORS[post.category] || CATEGORY_COLORS['General'];

              return (
                <article className="blog-card" key={post.id}>

                  <BlogImage
                    src={post.cover_image}
                    alt={post.category}
                    accentColor={accentColor}
                  />

                  <div className="blog-card-body">

                    <h3 className="blog-card-title">{post.title}</h3>

                    <div className="blog-meta">
                      <span className="blog-author">✍️ {post.author}</span>
                      <span className="blog-date">
                        {new Date(post.created_at).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </span>
                    </div>

                    <div
                      className="blog-content-scroll"
                      style={{ borderColor: accentColor + '33' }}
                    >
                      <p className="blog-content">{post.content}</p>
                    </div>

                  </div>
                </article>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
