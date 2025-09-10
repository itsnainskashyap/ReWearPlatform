import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Heart, ShoppingBag, Sparkles, Star, Ruler, Package, Shield, Camera, Share2, Truck, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { apiRequest } from "@/lib/queryClient";
import { useCartStore } from "@/store/cart-store";
import VirtualTryOn from "@/components/ai/virtual-tryon";
import AIRecommendations from "@/components/ai/recommendations";
import type { Product } from "@shared/schema";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const queryClient = useQueryClient();
  const { openCart } = useCartStore();
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showTryOn, setShowTryOn] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Ensure we have a valid product ID
  const productId = params?.id as string;

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId && typeof productId === 'string',
  });


  const { data: reviews } = useQuery({
    queryKey: [`/api/products/${productId}/reviews`],
    enabled: false, // Temporarily disabled until backend endpoint exists
  });

  const { data: related } = useQuery({
    queryKey: [`/api/products/${productId}/related`],
    enabled: false, // Temporarily disabled until backend endpoint exists
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cart/items", { 
        productId: productId, 
        quantity,
        size: selectedSize 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to Cart",
        description: `${quantity} item${quantity > 1 ? 's' : ''} added to your cart`,
      });
    },
  });

  const addToWishlistMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/wishlist", { productId: productId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Added to Wishlist",
        description: "Item saved to your wishlist",
      });
    },
  });

  const handleAddToWishlist = () => {
    if (!isAuthenticated) {
      openLogin("/wishlist"); // Redirect to wishlist after login
      return;
    }
    addToWishlistMutation.mutate();
  };

  const buyNowHandler = () => {
    if (!isAuthenticated) {
      openLogin("/checkout"); // Redirect to checkout after login
      return;
    }
    addToCartMutation.mutate();
    setTimeout(() => {
      navigate("/checkout");
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="sticky top-0 z-40 glassmorphism border-b border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 skeleton rounded-2xl"></div>
            <div className="h-6 w-32 skeleton rounded-full"></div>
            <div className="flex space-x-2">
              <div className="w-10 h-10 skeleton rounded-2xl"></div>
              <div className="w-10 h-10 skeleton rounded-2xl"></div>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="w-full aspect-square skeleton rounded-3xl"></div>
          <div className="space-y-3">
            <div className="h-8 skeleton rounded-full w-3/4"></div>
            <div className="h-6 skeleton rounded-full w-1/2"></div>
            <div className="h-10 skeleton rounded-full w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state for failed queries
  if (error) {
    console.error('Product query error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error loading product</h2>
          <p className="text-muted-foreground mb-4">Failed to load product details</p>
          <Button onClick={() => navigate("/")} className="button-glow">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shop
          </Button>
        </div>
      </div>
    );
  }

  // Show not found only after loading is complete and no product is found
  if (!isLoading && !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product not found</h2>
          <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist</p>
          <Button onClick={() => navigate("/")} className="button-glow">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shop
          </Button>
        </div>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : ['/api/placeholder/400/400'];
  const averageRating = reviews?.average || 4.5;
  const reviewCount = reviews?.count || 0;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-32 transition-all duration-500 ${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
      {/* Header */}
      <div className="sticky top-0 z-40 glassmorphism border-b border-white/20 p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="hover-lift rounded-2xl"
            data-testid="button-back"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          
          <h1 className="font-bold text-lg gradient-text truncate max-w-[200px]">
            {product.name}
          </h1>
          
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="hover-lift rounded-2xl"
              onClick={handleAddToWishlist}
              data-testid="button-wishlist"
            >
              <Heart className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover-lift rounded-2xl"
              data-testid="button-share"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Image Carousel */}
      <div className="relative">
        <div className="overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${selectedImage * 100}%)` }}
          >
            {images.map((image: string, index: number) => (
              <div key={index} className="w-full flex-shrink-0">
                <img
                  src={image}
                  alt={`${product.name} ${index + 1}`}
                  className="w-full aspect-square object-cover"
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Image Dots */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
          {images.map((_: string, index: number) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                selectedImage === index 
                  ? 'w-8 bg-primary' 
                  : 'bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Try On Button */}
        <div className="absolute top-4 right-4">
          <VirtualTryOn 
            productId={params?.id || ''} 
            productName={product?.name || ''} 
            productImage={product?.images?.[0] || ''} 
          />
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-6">
        {/* Title and Brand */}
        <div className="space-y-2 animate-slideInLeft">
          <div className="flex items-center space-x-2">
            <Badge className="bg-primary/10 text-primary border-primary/20">
              {product.condition || 'Good'}
            </Badge>
            {product.isOriginal && (
              <Badge className="bg-accent/10 text-accent-foreground border-accent/20">
                <Sparkles className="w-3 h-3 mr-1" />
                ReWeara Original
              </Badge>
            )}
          </div>
          
          <h1 className="text-2xl font-bold">{product.name}</h1>
          
          {product.brandId && (
            <p className="text-muted-foreground">by {product.brandName || 'Brand'}</p>
          )}
          
          {/* Rating */}
          <div className="flex items-center space-x-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(averageRating) 
                      ? 'text-yellow-500 fill-yellow-500' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {averageRating} ({reviewCount} reviews)
            </span>
          </div>
        </div>

        {/* Price and Stock */}
        <div className="space-y-1 animate-scaleIn" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-baseline space-x-3">
            <span className="text-3xl font-bold text-primary">₹{product.price}</span>
            {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
              <>
                <span className="text-xl text-muted-foreground line-through">
                  ₹{product.originalPrice}
                </span>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  {Math.round(((parseFloat(product.originalPrice) - parseFloat(product.price)) / parseFloat(product.originalPrice)) * 100)}% OFF
                </Badge>
              </>
            )}
          </div>
          {/* Stock Information */}
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {product.stock > 0 ? `${product.stock} pieces left` : 'Out of stock'}
            </Badge>
            {product.condition && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                Condition: {product.condition}
              </Badge>
            )}
          </div>
        </div>

        {/* Size Selection */}
        {product.sizes && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold">Select Size</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSizeGuide(true)}
                className="text-primary"
              >
                <Ruler className="w-4 h-4 mr-1" />
                Size Guide
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(product.sizes || []).map(size => (
                <Button
                  key={size}
                  variant={selectedSize === size ? "default" : "outline"}
                  onClick={() => setSelectedSize(size)}
                  className={`w-12 h-12 rounded-xl hover-lift transition-all duration-200 ${
                    selectedSize === size 
                      ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100 shadow-lg" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  data-testid={`size-${size}`}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity Selector */}
        <div className="space-y-3">
          <label className="font-semibold">Quantity</label>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="rounded-xl"
            >
              -
            </Button>
            <span className="font-bold text-lg w-12 text-center">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity(quantity + 1)}
              className="rounded-xl"
            >
              +
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <div className="flex space-x-3">
            <Button
              onClick={() => addToCartMutation.mutate()}
              disabled={!product.stock || product.stock <= 0}
              className="flex-1 h-14 rounded-2xl glassmorphism border border-primary text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-add-to-cart"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              {!product.stock || product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            <Button
              onClick={buyNowHandler}
              disabled={!product.stock || product.stock <= 0}
              className="flex-1 h-14 bg-gradient-to-r from-accent to-accent/90 text-accent-foreground rounded-2xl button-glow hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-buy-now"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {!product.stock || product.stock <= 0 ? 'Out of Stock' : 'Buy Now'}
            </Button>
          </div>
          {/* Virtual Try-On */}
          <VirtualTryOn 
            productId={params?.id || ''} 
            productName={product?.name || ''} 
            productImage={product?.images?.[0] || ''} 
          />
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 pt-4">
          <Card className="card-premium text-center p-4 rounded-2xl">
            <Truck className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-xs">Free Delivery</p>
          </Card>
          <Card className="card-premium text-center p-4 rounded-2xl">
            <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-xs">Secure Payment</p>
          </Card>
          <Card className="card-premium text-center p-4 rounded-2xl">
            <Package className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-xs">Easy Returns</p>
          </Card>
        </div>

        {/* Product Details Tabs */}
        <Tabs defaultValue="description" className="pt-4">
          <TabsList className="grid w-full grid-cols-3 glassmorphism rounded-2xl p-1">
            <TabsTrigger value="description" className="rounded-xl">Description</TabsTrigger>
            <TabsTrigger value="details" className="rounded-xl">Details</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-xl">Reviews</TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="mt-4 space-y-3">
            <Card className="card-premium rounded-2xl">
              <CardContent className="p-4">
                <p className="text-muted-foreground leading-relaxed">
                  {product.description || 'High-quality sustainable fashion piece perfect for eco-conscious shoppers. This item combines style with environmental responsibility.'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="details" className="mt-4 space-y-3">
            <Card className="card-premium rounded-2xl">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Material</span>
                  <span className="font-medium">100% Organic Cotton</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Care</span>
                  <span className="font-medium">Machine wash cold</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">SKU</span>
                  <span className="font-medium">{product?.id ? product.id.slice(0, 8).toUpperCase() : 'N/A'}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-4 space-y-3">
            <Card className="card-premium rounded-2xl">
              <CardContent className="p-4">
                {reviewCount > 0 ? (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <p className="text-3xl font-bold">{averageRating}</p>
                      <div className="flex justify-center my-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 ${
                              i < Math.floor(averageRating) 
                                ? 'text-yellow-500 fill-yellow-500' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">Based on {reviewCount} reviews</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No reviews yet</p>
                    <Button variant="outline" className="mt-4">
                      Be the first to review
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* AI Recommendations */}
        <div className="pt-6">
          <AIRecommendations 
            productId={params?.id} 
            title="AI Recommended Similar Items" 
            maxItems={6}
          />
        </div>

        {/* Related Products */}
        {related && related.length > 0 && (
          <div className="pt-6">
            <h3 className="text-xl font-bold mb-4">You May Also Like</h3>
            <div className="flex space-x-4 overflow-x-auto scroll-container">
              {related.map((item: any) => (
                <Card
                  key={item.id}
                  onClick={() => navigate(`/product/${item.id}`)}
                  className="flex-shrink-0 w-40 card-premium rounded-2xl hover-lift cursor-pointer"
                >
                  <img
                    src={item.images?.[0] || '/api/placeholder/160/160'}
                    alt={item.name}
                    className="w-full h-40 object-cover rounded-t-2xl"
                  />
                  <CardContent className="p-3">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="font-bold text-primary">₹{item.price}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}