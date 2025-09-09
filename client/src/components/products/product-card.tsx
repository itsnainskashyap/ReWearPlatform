import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  onAddToWishlist?: (productId: string) => void;
}

export default function ProductCard({ product, onAddToCart, onAddToWishlist }: ProductCardProps) {
  const handleAddToCart = () => {
    onAddToCart?.(product.id);
  };

  const handleAddToWishlist = () => {
    onAddToWishlist?.(product.id);
  };

  return (
    <div className="product-card bg-card rounded-2xl shadow-md overflow-hidden" data-testid={`card-product-${product.id}`}>
      <img 
        src={product.images?.[0] || "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=400"}
        alt={product.name}
        className="w-full h-48 object-cover"
        data-testid={`img-product-${product.id}`}
      />
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Badge 
            variant="secondary"
            className="text-xs bg-primary/10 text-primary"
            data-testid={`badge-condition-${product.id}`}
          >
            {product.condition || "Good"}
          </Badge>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleAddToWishlist}
            className="p-1 hover-elevate rounded-full h-8 w-8"
            data-testid={`button-wishlist-${product.id}`}
          >
            <Heart className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
        
        <h3 className="font-semibold text-sm mb-1" data-testid={`text-product-name-${product.id}`}>
          {product.name}
        </h3>
        
        {product.brandId && (
          <p className="text-xs text-muted-foreground mb-2" data-testid={`text-brand-${product.id}`}>
            Brand Name
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-primary" data-testid={`text-price-${product.id}`}>
              ₹{product.price}
            </span>
            {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
              <span className="text-xs text-muted-foreground line-through ml-1" data-testid={`text-original-price-${product.id}`}>
                ₹{product.originalPrice}
              </span>
            )}
          </div>
          <Button 
            size="icon"
            onClick={handleAddToCart}
            className="bg-accent text-accent-foreground p-2 rounded-lg hover:bg-accent/90 transition-colors h-9 w-9"
            data-testid={`button-add-to-cart-${product.id}`}
          >
            <ShoppingBag className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
