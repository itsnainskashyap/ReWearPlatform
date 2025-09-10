import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, Filter, Grid2X2, Grid3X3, ChevronDown, X, Sparkles, Recycle } from "lucide-react";
import ProductCard from "@/components/products/product-card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Product } from "@shared/schema";

export default function Shop() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [shopType, setShopType] = useState<'all' | 'thrift' | 'originals'>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Handle URL query parameters for brand filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const brandFromUrl = urlParams.get('brand');
    if (brandFromUrl && brandFromUrl !== selectedBrand) {
      setSelectedBrand(brandFromUrl);
    }
  }, []);

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: brands } = useQuery({
    queryKey: ["/api/brands"],
  });

  const { data: products, isLoading, isFetching } = useQuery({
    queryKey: ["/api/products", selectedCategory, selectedBrand, searchQuery, page, shopType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedBrand) params.append('brand', selectedBrand);
      if (searchQuery) params.append('search', searchQuery);
      params.append('limit', '12');
      params.append('offset', (page * 12).toString());
      if (shopType === 'thrift') params.append('isThrift', 'true');
      if (shopType === 'originals') params.append('isOriginal', 'true');
      
      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("POST", "/api/cart/items", { productId, quantity: 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to Cart",
        description: "Item has been added to your cart",
      });
    },
  });

  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("POST", "/api/wishlist", { productId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: "Added to Wishlist",
        description: "Item has been saved to your wishlist",
      });
    },
  });

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    setPriceRange([0, 10000]);
    setSearchQuery("");
    setSortBy("newest");
  };

  const filteredProducts = Array.isArray(products) ? products.filter((p: Product) => {
    const price = parseFloat(p.price);
    return price >= priceRange[0] && price <= priceRange[1];
  }) : [];

  const sortedProducts = [...filteredProducts].sort((a: Product, b: Product) => {
    switch (sortBy) {
      case 'price-low':
        return parseFloat(a.price) - parseFloat(b.price);
      case 'price-high':
        return parseFloat(b.price) - parseFloat(a.price);
      case 'trending':
        return (b.viewCount || 0) - (a.viewCount || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-card border-b border-border shadow-sm">
        {/* Shop Type Toggle */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold gradient-text">Shop</h1>
            <div className="flex space-x-2 bg-background/50 rounded-2xl p-1">
              <Button
                variant={shopType === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setShopType('all')}
                className="rounded-xl"
              >
                All
              </Button>
              <Button
                variant={shopType === 'thrift' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setShopType('thrift')}
                className="rounded-xl"
              >
                <Recycle className="w-4 h-4 mr-1" />
                Thrift
              </Button>
              <Button
                variant={shopType === 'originals' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setShopType('originals')}
                className="rounded-xl"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Originals
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="p-4 space-y-3">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-2xl glassmorphism border-white/20"
              />
            </div>
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button size="icon" className="h-12 w-12 rounded-2xl hover-lift">
                  <Filter className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="glassmorphism">
                <SheetHeader>
                  <SheetTitle className="gradient-text">Filters</SheetTitle>
                </SheetHeader>
                
                <div className="space-y-6 mt-6">
                  {/* Category Filter */}
                  <div className="space-y-3">
                    <label className="font-semibold">Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Categories</SelectItem>
                        {Array.isArray(categories) && categories.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Brand Filter */}
                  <div className="space-y-3">
                    <label className="font-semibold">Brand</label>
                    <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="All Brands" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Brands</SelectItem>
                        {Array.isArray(brands) && brands.map((brand: any) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range */}
                  <div className="space-y-3">
                    <label className="font-semibold">Price Range</label>
                    <div className="px-2">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={10000}
                        step={100}
                        className="w-full"
                      />
                      <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                        <span>₹{priceRange[0]}</span>
                        <span>₹{priceRange[1]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sort By */}
                  <div className="space-y-3">
                    <label className="font-semibold">Sort By</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="trending">Trending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4">
                    <Button 
                      onClick={clearFilters}
                      variant="outline" 
                      className="w-full rounded-xl"
                    >
                      Clear All Filters
                    </Button>
                    <Button 
                      onClick={() => setShowFilters(false)}
                      className="w-full bg-gradient-to-r from-accent to-accent/90 text-accent-foreground rounded-xl"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Active Filters */}
          {(selectedCategory || selectedBrand || searchQuery) && (
            <div className="flex flex-wrap gap-2">
              {selectedCategory && (
                <Badge className="rounded-full px-3 py-1">
                  {Array.isArray(categories) && categories.find((c: any) => c.id === selectedCategory)?.name}
                  <X 
                    className="w-3 h-3 ml-2 cursor-pointer" 
                    onClick={() => setSelectedCategory("")}
                  />
                </Badge>
              )}
              {selectedBrand && (
                <Badge className="rounded-full px-3 py-1">
                  {Array.isArray(brands) && brands.find((b: any) => b.id === selectedBrand)?.name}
                  <X 
                    className="w-3 h-3 ml-2 cursor-pointer" 
                    onClick={() => setSelectedBrand("")}
                  />
                </Badge>
              )}
              {searchQuery && (
                <Badge className="rounded-full px-3 py-1">
                  "{searchQuery}"
                  <X 
                    className="w-3 h-3 ml-2 cursor-pointer" 
                    onClick={() => setSearchQuery("")}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="card-premium rounded-3xl overflow-hidden">
                <div className="w-full h-48 skeleton rounded-t-3xl"></div>
                <div className="p-5 space-y-3">
                  <div className="h-4 skeleton rounded-full w-3/4"></div>
                  <div className="h-3 skeleton rounded-full w-1/2"></div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="h-6 skeleton rounded-full w-1/3"></div>
                    <div className="h-11 skeleton rounded-2xl w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-muted to-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-3">No products found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your filters or search query</p>
            <Button onClick={clearFilters} className="rounded-2xl">
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedProducts.map((product: Product, index: number) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product.id)}
                  className="cursor-pointer"
                >
                  <ProductCard
                    product={product}
                    onAddToCart={(id) => {
                      addToCartMutation.mutate(id);
                    }}
                    onAddToWishlist={(id) => {
                      addToWishlistMutation.mutate(id);
                    }}
                    index={index}
                  />
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-8">
                <Button
                  onClick={() => setPage(page + 1)}
                  disabled={isFetching}
                  className="rounded-2xl bg-gradient-to-r from-accent to-accent/90 text-accent-foreground button-glow hover-lift"
                >
                  {isFetching ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}