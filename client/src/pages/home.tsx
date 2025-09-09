import { useQuery } from "@tanstack/react-query";
import HeroSection from "@/components/sections/hero-section";
import BrandScroll from "@/components/sections/brand-scroll";
import ProductGrid from "@/components/sections/product-grid";
import FeaturedCarousel from "@/components/sections/featured-carousel";
import RecentlyViewed from "@/components/sections/recently-viewed";

export default function Home() {
  return (
    <div className="animate-fade-in">
      <HeroSection />
      <BrandScroll />
      <ProductGrid />
      <FeaturedCarousel />
      <RecentlyViewed />
    </div>
  );
}
