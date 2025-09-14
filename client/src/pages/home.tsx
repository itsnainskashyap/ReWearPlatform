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
    <div className="motion-safe-fade-in">
      <HeroSection />
      {/* Only show Featured Brands when not in ReWeara Originals mode */}
      {shopType !== 'originals' && (
        <section className="section-y" aria-label="Featured Brands">
          <BrandScroll />
        </section>
      )}
      <section className="section-y" aria-label="AI Recommendations">
        <div className="container-custom">
          <AIRecommendations 
            title="AI Recommendations For You" 
            maxItems={6}
          />
        </div>
      </section>
      <section className="section-y" aria-label="All Products">
        <ProductGrid />
      </section>
      <section className="section-y" aria-label="Featured Products">
        <FeaturedCarousel />
      </section>
      <section className="section-y" aria-label="Recently Viewed">
        <RecentlyViewed />
      </section>
    </div>
  );
}
