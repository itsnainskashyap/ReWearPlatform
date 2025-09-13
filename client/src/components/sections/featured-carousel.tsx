import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ShoppingCart, Eye, Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  isFeatured: boolean;
  isActive: boolean;
  brandName?: string;
  categoryName?: string;
  discount?: number;
  slug: string;
}

interface FeaturedProductsResponse {
  products: Product[];
  settings: {
    autoScrollMs: number;
    maxItems: number;
  };
}

export default function FeaturedCarousel() {
  const [isHovered, setIsHovered] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  const { data: featuredData, isLoading } = useQuery<FeaturedProductsResponse>({
    queryKey: ["/api/featured-products"],
    retry: 1,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Extract products and settings from the response
  const featuredProducts = featuredData?.products || [];
  const autoScrollMs = featuredData?.settings?.autoScrollMs || 3000; // Fallback to 3000ms
  const maxItems = featuredData?.settings?.maxItems || 8; // Fallback to 8 items

  // Note: autoScrollMs and maxItems are now extracted from API response above

  // Auto-scroll functionality
  useEffect(() => {
    if (!featuredProducts || featuredProducts.length <= 1 || isHovered) return;

    autoScrollRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % featuredProducts.length;
        return nextIndex;
      });
    }, autoScrollMs);

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [featuredProducts, isHovered, autoScrollMs]);

  // Smooth scrolling effect
  useEffect(() => {
    if (!carouselRef.current || !featuredProducts || featuredProducts.length === 0) return;
    
    const container = carouselRef.current;
    const itemHeight = 320; // Height of each product card
    const scrollPosition = currentIndex * itemHeight;
    
    container.scrollTo({
      top: scrollPosition,
      behavior: 'smooth'
    });
  }, [currentIndex, featuredProducts]);

  // Handle mouse events for pause on hover
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="px-4 mb-4">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full"></div>
        </div>
        <div className="px-4">
          <div className="h-96 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-2xl"></div>
        </div>
      </section>
    );
  }

  if (!featuredProducts || featuredProducts.length === 0) {
    return null; // Don't show section if no featured products
  }

  // Apply maxItems limit and duplicate for seamless looping if needed
  const limitedProducts = featuredProducts.slice(0, maxItems);
  const displayProducts = limitedProducts.length < 3 
    ? [...limitedProducts, ...limitedProducts, ...limitedProducts].slice(0, Math.min(6, maxItems))
    : limitedProducts;

  return (
    <section className="mb-8" data-testid="featured-carousel-section">
      <div className="px-4 mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-featured-products-title">
          Featured Products
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Hand-picked items just for you
        </p>
      </div>
      
      <div className="px-4">
        <div 
          className="relative h-96 overflow-hidden"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          data-testid="featured-carousel-container"
        >
          {/* Auto-scroll indicator */}
          {!isHovered && displayProducts.length > 1 && (
            <div className="absolute top-4 right-4 z-10">
              <Badge variant="secondary" className="text-xs bg-black/20 text-white border-none">
                Auto-scrolling
              </Badge>
            </div>
          )}

          {/* Vertical scrolling container */}
          <div
            ref={carouselRef}
            className="h-full overflow-y-auto scrollbar-hide scroll-smooth"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
            data-testid="featured-carousel-scroll-container"
          >
            <div className="space-y-4 pb-4">
              {displayProducts.map((product, index) => (
                <Card 
                  key={`${product.id}-${index}`}
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-0 bg-white dark:bg-gray-800 hover:scale-[1.02]"
                  data-testid={`featured-product-card-${product.id}`}
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      {/* Product Image */}
                      <div className="aspect-video relative overflow-hidden rounded-t-lg bg-gray-100 dark:bg-gray-700">
                        {product.images?.[0] ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            data-testid={`img-featured-product-${product.id}`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Discount Badge */}
                        {product.discount && product.discount > 0 && (
                          <Badge 
                            className="absolute top-2 left-2 bg-red-500 text-white border-none"
                            data-testid={`badge-discount-${product.id}`}
                          >
                            -{product.discount}%
                          </Badge>
                        )}

                        {/* Hover Actions */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                          <Button 
                            size="sm" 
                            variant="secondary"
                            className="bg-white/90 text-black hover:bg-white"
                            data-testid={`button-quick-view-${product.id}`}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm"
                            className="bg-black/90 text-white hover:bg-black"
                            data-testid={`button-add-cart-${product.id}`}
                          >
                            <ShoppingCart className="w-4 h-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm" data-testid={`text-featured-product-name-${product.id}`}>
                              {product.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              {product.brandName && (
                                <Badge variant="outline" className="text-xs">
                                  {product.brandName}
                                </Badge>
                              )}
                              {product.categoryName && (
                                <Badge variant="secondary" className="text-xs">
                                  {product.categoryName}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-1 h-auto hover:text-red-500"
                            data-testid={`button-wishlist-${product.id}`}
                          >
                            <Heart className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-green-600 text-lg" data-testid={`text-featured-product-price-${product.id}`}>
                            ₹{product.price.toLocaleString()}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-sm text-gray-500 line-through" data-testid={`text-featured-product-original-price-${product.id}`}>
                              ₹{product.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Scroll Indicators */}
          {displayProducts.length > 1 && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col gap-1">
              {displayProducts.slice(0, Math.min(5, displayProducts.length)).map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex % displayProducts.length
                      ? 'bg-primary w-3' 
                      : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                  data-testid={`button-carousel-indicator-${index}`}
                />
              ))}
            </div>
          )}

          {/* Hover Pause Indicator */}
          {isHovered && displayProducts.length > 1 && (
            <div className="absolute bottom-4 left-4">
              <Badge variant="secondary" className="text-xs bg-black/70 text-white border-none">
                Paused
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Custom CSS for hiding scrollbar */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}