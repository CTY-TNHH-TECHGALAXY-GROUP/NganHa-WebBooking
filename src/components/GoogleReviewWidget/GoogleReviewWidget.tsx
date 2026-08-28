'use client';

import React, { useEffect, useState } from 'react';

const GoogleReviewWidget = () => {
  const [data, setData] = useState({ rating: 4.8, user_ratings_total: 1330 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/google-reviews')
      .then(res => res.json())
      .then(json => {
        if (json.rating) setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <a
      href="https://maps.app.goo.gl/EKiLEodAGZHDD4nP6"
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-24 md:bottom-6 left-4 md:left-6 z-[990] flex items-center gap-3 px-4 py-2 rounded-md shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl ${loading ? 'opacity-70' : 'opacity-100'}`}
      style={{ backgroundColor: '#FDF8E7', border: '1px solid #E8D399' }}
      aria-label="View our Google Reviews"
    >
      {/* Score */}
      <div className="flex items-baseline gap-1 text-black">
        <span className="text-2xl font-bold leading-none">{data.rating.toFixed(1)}</span>
        <span className="text-sm font-semibold leading-none">/5</span>
      </div>

      {/* Text Info */}
      <div className="flex flex-col text-black">
        <span className="text-sm font-bold leading-tight">Excellent</span>
        <span className="text-xs text-gray-700 leading-tight">
          {data.user_ratings_total} reviews on <span className="font-semibold">Google</span>
        </span>
      </div>
    </a>
  );
};

export default GoogleReviewWidget;
