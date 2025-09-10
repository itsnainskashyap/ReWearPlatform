import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function BrandScroll() {
  const { data: brands, isLoading } = useQuery({
    queryKey: ["/api/brands/featured"],
  });
  
  const [, navigate] = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  const handleBrandClick = (brandId: string) => {
    navigate(`/shop?brand=${brandId}`);
  };

  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="px-4 mb-6">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-accent animate-pulse" />
            <h2 className="text-2xl font-bold text-primary">Featured Brands</h2>
          </div>
        </div>
        <div className="flex space-x-4 px-4 overflow-x-auto scroll-container" data-testid="container-brand-scroll">
          {[...Array(5)].map((_, index) => (
            <div 
              key={index}
              className="flex-shrink-0 w-20 h-20 skeleton rounded-2xl"
              data-testid={`brand-skeleton-${index}`}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={`mb-8 transition-all duration-500 ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
      <div className="px-4 mb-6">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-6 h-6 text-accent animate-pulse" />
          <h2 className="text-2xl font-bold text-primary" data-testid="text-featured-brands-title">
            Featured Brands
          </h2>
        </div>
      </div>
      
      <div className="flex space-x-4 px-4 overflow-x-auto scroll-container" data-testid="container-brand-scroll">
        {Array.isArray(brands) && brands.length > 0 ? (
          brands.map((brand: any, index: number) => (
            <div 
              key={brand.id}
              className={`flex-shrink-0 w-20 h-20 card-premium rounded-2xl flex items-center justify-center hover-lift cursor-pointer group transition-all duration-500 ${isVisible ? 'animate-scaleIn' : 'opacity-0'}`}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => handleBrandClick(brand.id)}
              data-testid={`brand-${brand.id}`}
            >
              {brand.logoUrl ? (
                <img 
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="w-12 h-12 object-contain group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-xl font-bold text-primary-foreground">
                    {brand.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          ))
        ) : (
          // Show real brand data or hide section
          <div className="text-center py-8 text-muted-foreground">
            <p>No featured brands available</p>
          </div>
        )}
      </div>
    </section>
  );
}
