import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, Filter, Grid2x2, Grid3x3, ChevronDown, X, Sparkles, ArrowLeft } from "lucide-react";
import ProductCard from "@/components/products/product-card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Product } from "@shared/schema";

export default function Originals() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedCondition, setSelectedCondition] = useState<string>("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  // Handle URL query parameters for brand filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const brandFromUrl = urlParams.get('brand');
    if (brandFromUrl && brandFromUrl !== selectedBrand) {
      setSelectedBrand(brandFromUrl);
    }
  }, []);

  const { data: categories } = useQuery<{id: string, name: string, slug: string}[]>({
    queryKey: ["/api/categories"],
  });

  const { data: brands } = useQuery<{id: string, name: string, slug: string, logoUrl?: string}[]>({
    queryKey: ["/api/brands/originals", selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'all') {
        params.append('categoryId', selectedCategory);
      }
      const response = await fetch(`/api/brands?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch brands');
      return response.json();
    }
  });

  const { data: products, isLoading, isFetching } = useQuery({
    queryKey: ["/api/products/originals", selectedCategory, selectedBrand, searchQuery, priceRange, selectedCondition],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedBrand && selectedBrand !== 'all') params.append('brand', selectedBrand);
      if (searchQuery) params.append('search', searchQuery);
      
      // Add price range parameters
      if (priceRange[0] > 0) params.append('priceMin', priceRange[0].toString());
      if (priceRange[1] < 10000) params.append('priceMax', priceRange[1].toString());
      
      // Add condition parameter
      if (selectedCondition && selectedCondition !== 'all') params.append('condition', selectedCondition);
      
      params.append('limit', '1000'); // Show all products for limitless scroll
      params.append('offset', '0'); // Always start from beginning for simplicity
      params.append('isOriginal', 'true'); // Hardcoded for originals page
      
      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    }
  });

  // Handle products data when it changes
  useEffect(() => {
    if (products) {
      if (page === 0) {
        // First page, replace all products
        setAllProducts(products);
      } else {
        // Subsequent pages, append to existing products
        setAllProducts(prev => [...prev, ...products]);
      }
      // For limitless scroll, load all at once
      setHasMore(false);
    }
  }, [products, page]);

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
    setSelectedCategory("all");
    setSelectedBrand("all");
    setPriceRange([0, 10000]);
    setSelectedCondition("all");
    setSearchQuery("");
    setSortBy("newest");
    setPage(0);
    setAllProducts([]);
    setHasMore(false);
  };

  // Reset pagination when filters change
  useEffect(() => {
    setPage(0);
    setAllProducts([]);
    setHasMore(false);
  }, [selectedCategory, selectedBrand, searchQuery, priceRange, selectedCondition]);

  // Server-side filtering is now handled in the API query
  // Only client-side sorting remains for better UX
  const displayProducts = Array.isArray(allProducts) ? allProducts : [];

  const sortedProducts = [...displayProducts].sort((a: Product, b: Product) => {
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
    <div className="min-h-screen pb-20 animate-fadeInUp" data-testid="page-originals">
      {/* Header */}
      <div className="bg-white dark:bg-card border-b border-border shadow-sm">
        {/* Page Title with Back Link */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/shop")}
                className="rounded-xl"
                data-testid="button-back-to-shop"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Shop
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h1 className="text-2xl font-bold gradient-text" data-testid="text-page-title">ReWeara Originals</h1>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2" data-testid="text-page-description">
            Discover our exclusive collection of sustainable, eco-friendly original designs
          </p>
        </div>

        {/* Search and Filters Bar */}
        <div className="p-4 space-y-3">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="search"
                placeholder="Search ReWeara Originals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-2xl glassmorphism border-white/20"
                data-testid="input-search-originals"
              />
            </div>
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button size="icon" className="h-12 w-12 rounded-2xl hover-lift" data-testid="button-filters">
                  <Filter className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="glassmorphism">
                <SheetHeader>
                  <SheetTitle className="gradient-text">Filters</SheetTitle>
                </SheetHeader>
                
                <div className="space-y-6 mt-6">
                  {/* Active Filters */}
                  {(selectedCategory !== "all" || selectedBrand !== "all" || selectedCondition !== "all" || priceRange[0] !== 0 || priceRange[1] !== 10000) && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold">Active Filters</label>
                        <Button 
                          onClick={clearFilters}
                          variant="ghost" 
                          size="sm"
                          className="text-xs h-6 px-2"
                          data-testid="button-clear-all-filters"
                        >
                          Clear All
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedCategory !== "all" && (
                          <Badge variant="secondary" className="flex items-center gap-1" data-testid="badge-filter-category">
                            Category: {categories?.find((c: any) => c.id === selectedCategory)?.name || selectedCategory}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory("all")} />
                          </Badge>
                        )}
                        {selectedBrand !== "all" && (
                          <Badge variant="secondary" className="flex items-center gap-1" data-testid="badge-filter-brand">
                            Brand: {brands?.find((b: any) => b.id === selectedBrand)?.name || selectedBrand}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedBrand("all")} />
                          </Badge>
                        )}
                        {selectedCondition !== "all" && (
                          <Badge variant="secondary" className="flex items-center gap-1" data-testid="badge-filter-condition">
                            Condition: {selectedCondition}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCondition("all")} />
                          </Badge>
                        )}
                        {(priceRange[0] !== 0 || priceRange[1] !== 10000) && (
                          <Badge variant="secondary" className="flex items-center gap-1" data-testid="badge-filter-price">
                            Price: ₹{priceRange[0]} - ₹{priceRange[1]}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => setPriceRange([0, 10000])} />
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Category Filter */}
                  <div className="space-y-3">
                    <label className="font-semibold">Category</label>
                    <Select 
                      value={selectedCategory} 
                      onValueChange={setSelectedCategory}
                      data-testid="select-category-filter"
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" data-testid="option-category-all">All Categories</SelectItem>
                        {Array.isArray(categories) && categories.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.id} data-testid={`option-category-${cat.id}`}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Brand Filter */}
                  <div className="space-y-3">
                    <label className="font-semibold">Brand</label>
                    <Select 
                      value={selectedBrand} 
                      onValueChange={setSelectedBrand}
                      data-testid="select-brand-filter"
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="All Brands" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" data-testid="option-brand-all">All Brands</SelectItem>
                        {Array.isArray(brands) && brands.map((brand: any) => (
                          <SelectItem key={brand.id} value={brand.id} data-testid={`option-brand-${brand.id}`}>
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
                        data-testid="slider-price-range"
                      />
                      <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                        <span data-testid="text-price-min">₹{priceRange[0]}</span>
                        <span data-testid="text-price-max">₹{priceRange[1]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Condition Filter */}
                  <div className="space-y-3">
                    <label className="font-semibold">Condition</label>
                    <Select 
                      value={selectedCondition} 
                      onValueChange={setSelectedCondition}
                      data-testid="select-condition-filter"
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="All Conditions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" data-testid="option-condition-all">All Conditions</SelectItem>
                        <SelectItem value="New" data-testid="option-condition-new">New</SelectItem>
                        <SelectItem value="Very Good" data-testid="option-condition-very-good">Very Good</SelectItem>
                        <SelectItem value="Good" data-testid="option-condition-good">Good</SelectItem>
                        <SelectItem value="Fair" data-testid="option-condition-fair">Fair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort By */}
                  <div className="space-y-3">
                    <label className="font-semibold">Sort By</label>
                    <Select value={sortBy} onValueChange={setSortBy} data-testid="select-sort-by">
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest" data-testid="option-sort-newest">Newest First</SelectItem>
                        <SelectItem value="price-low" data-testid="option-sort-price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high" data-testid="option-sort-price-high">Price: High to Low</SelectItem>
                        <SelectItem value="trending" data-testid="option-sort-trending">Trending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4">
                    <Button 
                      onClick={clearFilters}
                      variant="outline" 
                      className="w-full rounded-xl"
                      data-testid="button-clear-filters"
                    >
                      Clear All Filters
                    </Button>
                    <Button 
                      onClick={() => setShowFilters(false)}
                      className="w-full rounded-xl"
                      data-testid="button-apply-filters"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Sort and View options */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground" data-testid="text-product-count">
                {isLoading ? "Loading..." : `${sortedProducts.length} originals`}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] h-8 rounded-xl" data-testid="select-sort-main">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex rounded-xl border overflow-hidden" data-testid="view-toggle">
                <Button
                  variant={view === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('grid')}
                  className="rounded-none h-8"
                  data-testid="button-view-grid"
                >
                  <Grid2x2 className="w-4 h-4" />
                </Button>
                <Button
                  variant={view === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setView('list')}
                  className="rounded-none h-8"
                  data-testid="button-view-list"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-4">
        {isLoading || isFetching ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-12" data-testid="no-products-message">
            <Sparkles className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No ReWeara Originals found matching your criteria.</p>
            <Button onClick={clearFilters} variant="outline" className="mt-4" data-testid="button-clear-no-products">
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className={`grid gap-4 ${view === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`} data-testid="products-grid">
            {sortedProducts.map((product: Product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={() => addToCartMutation.mutate(product.id)}
                onAddToWishlist={() => addToWishlistMutation.mutate(product.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}