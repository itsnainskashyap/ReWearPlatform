import { Heart, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductShare } from "@/components/ui/product-share";
import type { Product } from "@shared/schema";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  onAddToWishlist?: (productId: string) => void;
  index?: number;
}

export default function ProductCard({ product, onAddToCart, onAddToWishlist, index = 0 }: ProductCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  const handleAddToCart = () => {
    onAddToCart?.(product.id);
  };

  const handleAddToWishlist = () => {
    setIsLiked(!isLiked);
    onAddToWishlist?.(product.id);
  };

  const handleProductClick = () => {
    navigate(`/product/${product.id}`);
  };

  const getConditionColor = (condition: string) => {
    switch(condition?.toLowerCase()) {
      case 'new': return 'bg-green-100 text-green-800 border-green-200';
      case 'very good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'good': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div 
      className={`card-premium hover-lift hover-zoom rounded-3xl overflow-hidden group transition-all duration-500 cursor-pointer ${isVisible ? 'animate-fadeInUp opacity-100' : 'opacity-0'}`}
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={handleProductClick}
      data-testid={`card-product-${product.id}`}
    >
      {/* Image Container with Overlay */}
      <div className="relative overflow-hidden">
        {product.images?.[0] ? (
          <img 
            src={product.images[0]}
            alt={product.name}
            className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-110"
            data-testid={`img-product-${product.id}`}
          />
        ) : (
          <div className="w-full h-48 skeleton"></div>
        )}
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-2">
          {/* Share Button */}
          <div onClick={(e) => e.stopPropagation()}>
            <ProductShare 
              product={{
                id: product.id,
                name: product.name,
                description: product.shortDescription || product.description || '',
                price: parseFloat(product.price),
                images: product.images || []
              }}
              variant="icon"
              className="h-10 w-10 glassmorphism bg-white/80 backdrop-blur-md hover:bg-white/90"
            />
          </div>
          
          {/* Wishlist Button */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleAddToWishlist();
            }}
            className={`h-10 w-10 rounded-full glassmorphism transition-all duration-300 ${isLiked ? 'scale-110' : ''}`}
            data-testid={`button-wishlist-${product.id}`}
          >
            <Heart className={`w-5 h-5 transition-colors duration-200 ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
          </Button>
        </div>

        {/* Featured Badge */}
        {product.isFeatured && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-accent/90 text-accent-foreground border-0 rounded-full px-3 py-1 text-xs font-semibold">
              <Sparkles className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Badge 
            className={`text-xs font-medium px-3 py-1 rounded-full border ${getConditionColor(product.condition || 'Good')}`}
            data-testid={`badge-condition-${product.id}`}
          >
            {product.condition || "Good"}
          </Badge>
          {product.stock && product.stock <= 3 && (
            <Badge variant="destructive" className="text-xs px-2 py-1 rounded-full">
              Only {product.stock} left
            </Badge>
          )}
        </div>
        
        {/* Title */}
        <div>
          <h3 className="font-bold text-base text-foreground mb-1 line-clamp-1" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </h3>
          {product.shortDescription && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {product.shortDescription}
            </p>
          )}
        </div>
        
        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-primary" data-testid={`text-price-${product.id}`}>
                ₹{product.price}
              </span>
              {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
                <span className="text-sm text-muted-foreground line-through" data-testid={`text-original-price-${product.id}`}>
                  ₹{product.originalPrice}
                </span>
              )}
            </div>
            {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
              <div className="text-xs text-green-600 font-medium">
                Save ₹{(parseFloat(product.originalPrice) - parseFloat(product.price)).toFixed(0)}
              </div>
            )}
          </div>
          
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart();
            }}
            className="h-11 px-4 bg-gradient-to-r from-accent to-accent/90 text-accent-foreground hover:from-accent/90 hover:to-accent rounded-2xl button-glow font-semibold transition-all duration-300 hover:scale-105"
            data-testid={`button-add-to-cart-${product.id}`}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}