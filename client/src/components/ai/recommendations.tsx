import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cart-store";
import { useLocation } from "wouter";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  isFeatured: boolean;
  condition: string;
  categoryId: string;
}

interface AIRecommendationsProps {
  productId?: string;
  title?: string;
  maxItems?: number;
}

export default function AIRecommendations({ 
  productId, 
  title = "AI Recommended For You", 
  maxItems = 6 
}: AIRecommendationsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { addToCart } = useCartStore();
  const [, navigate] = useLocation();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const { data: recommendations, isLoading } = useQuery({
    queryKey: productId && typeof productId === 'string' 
      ? ["/api/ai/recommendations", productId]
      : ["/api/ai/recommendations"],
    enabled: true, // Always enable, but API will handle productId appropriately
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.images?.[0] || '',
      quantity: 1,
    });
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="px-4 mb-6">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            <h2 className="text-2xl font-bold text-primary">{title}</h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              AI Powered
            </Badge>
          </div>
        </div>
        <div className="flex space-x-4 px-4 overflow-x-auto scroll-container">
          {[...Array(maxItems)].map((_, index) => (
            <div 
              key={index}
              className="flex-shrink-0 w-48 h-64 skeleton rounded-3xl"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
    return (
      <section className="mb-8">
        <div className="px-4 mb-6">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-primary">{title}</h2>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              Updating AI...
            </Badge>
          </div>
        </div>
        <div className="px-4 text-center py-8 text-muted-foreground">
          <p>AI recommendations are being personalized for you!</p>
        </div>
      </section>
    );
  }

  return (
    <section className={`mb-8 transition-all duration-500 ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
      <div className="px-4 mb-6">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          <h2 className="text-2xl font-bold text-primary">{title}</h2>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            AI Powered
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Personalized recommendations based on sustainable fashion trends
        </p>
      </div>
      
      <div className="flex space-x-4 px-4 overflow-x-auto scroll-container">
        {Array.isArray(recommendations) && recommendations.slice(0, maxItems).map((product: Product, index: number) => (
          <Card 
            key={product.id}
            className={`flex-shrink-0 w-48 card-premium rounded-3xl hover-lift cursor-pointer group transition-all duration-500 ${isVisible ? 'animate-scaleIn' : 'opacity-0'}`}
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => handleProductClick(product.id)}
            data-testid={`ai-recommendation-${product.id}`}
          >
            <CardContent className="p-0">
              <div className="relative">
                <div className="aspect-square rounded-t-3xl overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <span className="text-4xl font-bold text-primary/60">
                        {product.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* AI Badge */}
                <Badge className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs">
                  AI Pick
                </Badge>
                
                {/* Condition Badge */}
                <Badge 
                  variant="secondary" 
                  className={`absolute top-2 right-2 text-xs ${
                    product.condition === 'new' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {product.condition === 'new' ? 'Original' : 'Thrift'}
                </Badge>
                
                {/* Quick Actions */}
                <div className="absolute bottom-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="w-8 h-8 rounded-full bg-white/90 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add to wishlist functionality here
                    }}
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="w-8 h-8 rounded-full bg-white/90 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">₹{product.price}</span>
                  <span className="text-xs text-muted-foreground">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    AI Match
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}