import React, { useState, useEffect } from 'react';
import { fetchDisasterNews } from '../services/news';

const filters = [
  { id: 'all', label: 'All' },
  { id: 'flood', label: '🌊 Floods' },
  { id: 'heatwave', label: '🌡️ Heatwave' },
  { id: 'cyclone', label: '🌀 Cyclone' },
  { id: 'drought', label: '🏜️ Drought' },
  { id: 'climate', label: '🌍 Climate' },
];

const categoryEmojis = {
  flood: '🌊',
  heatwave: '🌡️',
  cyclone: '🌀',
  drought: '🏜️',
  climate: '🌍',
};

function detectCategory(title, description) {
  const text = (title + ' ' + (description || '')).toLowerCase();
  if (text.includes('flood') || text.includes('rain') || text.includes('water')) return { label: '🌊 Flood', color: '#3b82f6', key: 'flood' };
  if (text.includes('heat') || text.includes('temperature') || text.includes('hot')) return { label: '🌡️ Heat', color: '#ef4444', key: 'heatwave' };
  if (text.includes('cyclone') || text.includes('storm') || text.includes('hurricane') || text.includes('typhoon')) return { label: '🌀 Cyclone', color: '#8b5cf6', key: 'cyclone' };
  if (text.includes('drought') || text.includes('scarcity') || text.includes('dry')) return { label: '🏜️ Drought', color: '#f59e0b', key: 'drought' };
  return { label: '🌍 Climate', color: '#10b981', key: 'climate' };
}

function timeAgo(dateString) {
  const now = new Date();
  const published = new Date(dateString);
  const diffHours = Math.floor((now - published) / (1000 * 60 * 60));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return published.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function DisasterNewsFeed({ locationName, riskData }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDisasterNews(locationName, activeFilter);
      setArticles(data || []);
    } catch (err) {
      console.error(err);
      setError('Could not load news feed. This does not affect your risk analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (locationName) {
      loadNews();
    }
  }, [locationName, activeFilter]);

  const handleCardClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="news-section mt-8">
        <div className="compare-header-row mb-4">
          <div>
            <h3 className="section-title">Live Disaster News Feed</h3>
            <p className="section-subtitle">Loading latest climate headlines for {locationName}...</p>
          </div>
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span>LIVE</span>
          </div>
        </div>

        <div className="news-filter-bar">
          {filters.map((filter) => (
            <button
              key={filter.id}
              className={`filter-pill ${activeFilter === filter.id ? 'filter-pill-active' : ''}`}
              disabled
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="news-grid">
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className="news-card news-skeleton" style={{ height: '340px' }}>
              <div className="news-skeleton" style={{ height: '160px', width: '100%', borderRadius: '12px 12px 0 0' }}></div>
              <div className="news-card-body">
                <div className="news-skeleton" style={{ height: '12px', width: '30%', marginBottom: '12px' }}></div>
                <div className="news-skeleton" style={{ height: '18px', width: '80%', marginBottom: '12px' }}></div>
                <div className="news-skeleton" style={{ height: '14px', width: '90%', marginBottom: '8px' }}></div>
                <div className="news-skeleton" style={{ height: '14px', width: '70%', marginBottom: '16px' }}></div>
                <div className="news-card-footer">
                  <div className="news-skeleton" style={{ height: '12px', width: '25%' }}></div>
                  <div className="news-skeleton" style={{ height: '18px', width: '20%', borderRadius: '999px' }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="news-section mt-8 text-center p-8 error-state">
        <h3 className="section-title mb-2">Live Disaster News Feed</h3>
        <p className="error-message text-red mb-4">{error}</p>
        <button onClick={loadNews} className="search-button btn-small">
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="news-section mt-8">
      <div className="compare-header-row mb-4">
        <div>
          <h3 className="section-title">Live Disaster News Feed</h3>
          <p className="section-subtitle">Recent climate and disaster headlines for {locationName}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span>LIVE</span>
          </div>
          <div className="info-pill-container">
            <span className="info-pill">{articles.length} headlines found</span>
          </div>
        </div>
      </div>

      <div className="news-filter-bar">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`filter-pill ${activeFilter === filter.id ? 'filter-pill-active' : ''}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {articles.length === 0 ? (
        <div className="text-center p-8 card bg-transparent border-none">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
          <h4 className="section-title mb-1" style={{ fontSize: '1.1rem' }}>No recent news found for this location</h4>
          <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>Try a different filter or check back later</p>
          <button onClick={loadNews} className="search-button btn-small">
            Refresh Feed
          </button>
        </div>
      ) : (
        <div className="news-grid">
          {articles.slice(0, 8).map((article, idx) => {
            const catInfo = detectCategory(article.title, article.description);
            const defaultEmoji = categoryEmojis[catInfo.key] || '⚠️';

            return (
              <div
                key={idx}
                className="news-card"
                onClick={() => handleCardClick(article.url)}
              >
                {!article.image ? (
                  <div className="news-card-placeholder">
                    {defaultEmoji}
                  </div>
                ) : (
                  <div className="news-card-media-wrapper" style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
                    <img
                      src={article.image}
                      alt={article.title}
                      className="news-card-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const sibling = e.target.nextSibling;
                        if (sibling) sibling.style.display = 'flex';
                      }}
                    />
                    <div className="news-card-placeholder" style={{ display: 'none', height: '100%' }}>
                      {defaultEmoji}
                    </div>
                  </div>
                )}

                <div className="news-card-body">
                  <div className="news-meta">
                    <span className="news-source">{article.source.name}</span>
                    <span className="news-time">{timeAgo(article.publishedAt)}</span>
                  </div>

                  <h4 className="news-title" title={article.title}>
                    {article.title}
                  </h4>

                  <p className="news-description">
                    {article.description}
                  </p>

                  <div className="news-card-footer">
                    <span className="news-read-more">Read more →</span>
                    <span
                      className="news-category-tag"
                      style={{
                        color: catInfo.color,
                        borderColor: `${catInfo.color}4D`,
                        backgroundColor: `${catInfo.color}1A`,
                      }}
                    >
                      {catInfo.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DisasterNewsFeed;
