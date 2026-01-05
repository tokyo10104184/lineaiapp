import React, { useEffect, useRef } from 'react';

export const DmmBanner = () => {
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bannerRef.current) return;

    // Prevent double injection
    if (bannerRef.current.querySelector('script.widget-banner-script')) return;

    const script = document.createElement('script');
    script.className = "widget-banner-script";
    script.src = "https://widget-view.dmm.co.jp/js/banner_placement.js?affiliate_id=AIHENKAN-003&banner_id=1390_300_250";
    script.async = true;

    bannerRef.current.appendChild(script);

    return () => {
        // Cleanup typically handled by the widget itself or ignored as standard React unmount cleans DOM
    };
  }, []);

  return (
    <div ref={bannerRef} className="flex justify-center items-center py-4">
      <ins className="widget-banner"></ins>
    </div>
  );
};
