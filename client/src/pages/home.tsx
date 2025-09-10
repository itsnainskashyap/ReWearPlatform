import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import HeroSection from "@/components/sections/hero-section";
import BrandScroll from "@/components/sections/brand-scroll";
import ProductGrid from "@/components/sections/product-grid";
import FeaturedCarousel from "@/components/sections/featured-carousel";
import RecentlyViewed from "@/components/sections/recently-viewed";
import AIRecommendations from "@/components/ai/recommendations";

export default function Home() {
  const [shopType, setShopType] = useState<'all' | 'thrift' | 'originals'>('all');

  // Check for URL params to determine shop type
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type') as 'all' | 'thrift' | 'originals';
    if (type) {
      setShopType(type);
    }
  }, []);

  return (
    <div className="animate-fade-in">
      <HeroSection />
      {/* Only show Featured Brands when not in ReWeara Originals mode */}
      {shopType !== 'originals' && <BrandScroll />}
      <AIRecommendations 
        title="AI Recommendations For You" 
        maxItems={6}
      />
      <ProductGrid />
      <FeaturedCarousel />
      <RecentlyViewed />
    </div>
  );
}
