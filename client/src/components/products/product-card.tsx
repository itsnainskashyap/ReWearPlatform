import { Heart, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductShare } from "@/components/ui/product-share";
import type { Product } from "@shared/schema";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCartStore } from "@/store/cart-store";

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
  const { addToCart } = useCartStore();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  const handleAddToCart = () => {
    // Add to local cart store for immediate UI feedback
    addToCart({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      imageUrl: product.images?.[0] || '',
      quantity: 1
    });
    
    // Also call the parent callback if provided
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
      <div className="p-4 space-y-3">
        {/* Header - Mobile optimized */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-1" data-testid={`text-name-${product.id}`}>
              {product.name}
            </h3>
            <Badge 
              className={`text-xs font-medium px-2 py-1 rounded-full border ${getConditionColor(product.condition || 'Good')}`}
              data-testid={`badge-condition-${product.id}`}
            >
              {product.condition || "Good"}
            </Badge>
          </div>
          {product.stock && product.stock <= 3 && (
            <Badge variant="destructive" className="text-xs px-2 py-1 rounded-full">
              Only {product.stock} left
            </Badge>
          )}
        </div>
        
        {/* Price & Mobile Actions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg text-primary" data-testid={`text-price-${product.id}`}>
              ₹{product.price}
            </span>
            {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
              <span className="text-sm text-muted-foreground line-through" data-testid={`text-original-price-${product.id}`}>
                ₹{product.originalPrice}
              </span>
            )}
          </div>
          
          {/* Mobile Action Buttons */}
          {product.stock === 0 ? (
            <Button 
              disabled
              className="w-full h-10 bg-gray-400 text-gray-600 cursor-not-allowed rounded-xl font-semibold"
              data-testid={`button-out-of-stock-${product.id}`}
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Out of Stock
            </Button>
          ) : (
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
              className="w-full h-10 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary rounded-xl font-semibold transition-all duration-300"
              data-testid={`button-add-to-cart-${product.id}`}
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}