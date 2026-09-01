'use client';

import React, { useEffect, useState } from 'react';

const GoogleG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

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
      href="https://search.google.com/local/reviews?placeid=ChIJ2ULTMCAvdTERA4I7Sei7vyY"
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-24 md:bottom-6 left-4 md:left-6 z-[990] flex items-center gap-3 px-4 py-2 rounded-md shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl ${loading ? 'opacity-70' : 'opacity-100'}`}
      style={{ backgroundColor: '#FDF8E7', border: '1px solid #E8D399' }}
      aria-label="View our Google Reviews"
    >
      {/* Google G Icon */}
      <GoogleG />

      {/* Score */}
      <div className="flex items-baseline gap-1 text-black">
        <span className="text-2xl font-bold leading-none">{data.rating.toFixed(1)}</span>
        <span className="text-sm font-semibold leading-none">/5</span>
      </div>

      {/* Text Info */}
      <div className="flex flex-col text-black">
        <span className="text-sm font-bold leading-tight">Excellent</span>
        <span className="text-xs text-gray-700 leading-tight">
          {data.user_ratings_total.toLocaleString()} reviews on{' '}
          <span style={{ color: '#4285F4' }} className="font-bold">G</span>
          <span style={{ color: '#EA4335' }} className="font-bold">o</span>
          <span style={{ color: '#FBBC05' }} className="font-bold">o</span>
          <span style={{ color: '#34A853' }} className="font-bold">g</span>
          <span style={{ color: '#EA4335' }} className="font-bold">l</span>
          <span style={{ color: '#4285F4' }} className="font-bold">e</span>
        </span>
      </div>
    </a>
  );
};

export default GoogleReviewWidget;
