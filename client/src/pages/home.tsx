import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import HeroSection from "@/components/sections/hero-section";
import BrandScroll from "@/components/sections/brand-scroll";
import ProductGrid from "@/components/sections/product-grid";
import FeaturedCarousel from "@/components/sections/featured-carousel";
import RecentlyViewed from "@/components/sections/recently-viewed";
import AIRecommendations from "@/components/ai/recommendations";
import { ErrorBoundary } from "@/components/ui/error-boundary";

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
      <ErrorBoundary fallback={<div className="text-red-500 p-4">Error in Hero Section</div>}>
        <HeroSection />
      </ErrorBoundary>
      
      {/* Only show Featured Brands when not in ReWeara Originals mode */}
      {shopType !== 'originals' && (
        <section className="section-y" aria-label="Featured Brands">
          <ErrorBoundary fallback={<div className="text-red-500 p-4">Error in Brand Scroll</div>}>
            <BrandScroll />
          </ErrorBoundary>
        </section>
      )}
      
      <section className="section-y" aria-label="Featured Products">
        <ErrorBoundary fallback={<div className="text-red-500 p-4">Error in Featured Carousel</div>}>
          <FeaturedCarousel />
        </ErrorBoundary>
      </section>
      
      <section className="section-y" aria-label="AI Recommendations">
        <div className="container-custom">
          <ErrorBoundary fallback={<div className="text-red-500 p-4">Error in AI Recommendations</div>}>
            <AIRecommendations 
              title="AI Recommendations For You" 
              maxItems={6}
            />
          </ErrorBoundary>
        </div>
      </section>
      
      <section className="section-y" aria-label="All Products">
        <ErrorBoundary fallback={<div className="text-red-500 p-4">Error in Product Grid</div>}>
          <ProductGrid />
        </ErrorBoundary>
      </section>
      
      <section className="section-y" aria-label="Recently Viewed">
        <ErrorBoundary fallback={<div className="text-red-500 p-4">Error in Recently Viewed</div>}>
          <RecentlyViewed />
        </ErrorBoundary>
      </section>
    </div>
  );
}
