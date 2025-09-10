import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Settings,
  Filter,
  Tag,
  TrendingUp,
  Globe,
  Search,
  Package,
  Palette,
  Store,
  Plus,
  X,
  Save,
  Upload,
  Eye,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Sparkles,
  BarChart3,
  Users,
  DollarSign,
  ShoppingCart
} from "lucide-react";

export default function ShopSettings() {
  const { toast } = useToast();
  
  // State for various settings
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [filters, setFilters] = useState<any[]>([]);
  const [sortOptions, setSortOptions] = useState<any[]>([
    { value: "newest", label: "Newest First" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "trending", label: "Trending" },
    { value: "bestselling", label: "Best Selling" },
  ]);
  const [searchSettings, setSearchSettings] = useState({
    fuzzyThreshold: 0.7,
    autocompleteEnabled: true,
    searchHistory: true,
    suggestionsLimit: 5,
  });
  const [infiniteScrollSettings, setInfiniteScrollSettings] = useState({
    enabled: true,
    loadLimit: 12,
    threshold: 200,
  });
  const [trendingSettings, setTrendingSettings] = useState({
    autoDetect: true,
    manualPinning: false,
    salesThreshold: 10,
    viewsThreshold: 100,
  });
  const [bulkActions, setBulkActions] = useState({
    selectedProducts: [],
    action: "",
    value: "",
  });

  // Fetch existing settings
  const { data: shopConfig } = useQuery({
    queryKey: ["/api/admin/shop-config"],
  });

  const { data: analytics } = useQuery({
    queryKey: ["/api/admin/analytics"],
  });

  // Mutations
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      return await apiRequest("POST", "/api/admin/shop-config", settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop-config"] });
      toast({
        title: "Settings Saved",
        description: "Shop settings have been updated successfully.",
      });
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (category: any) => {
      return await apiRequest("POST", "/api/admin/categories", category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Category Added",
        description: "New category has been added successfully.",
      });
    },
  });

  const addBrandMutation = useMutation({
    mutationFn: async (brand: any) => {
      return await apiRequest("POST", "/api/admin/brands", brand);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands"] });
      toast({
        title: "Brand Added",
        description: "New brand has been added successfully.",
      });
    },
  });

  const bulkActionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/admin/products/bulk", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Bulk Action Completed",
        description: "Selected products have been updated.",
      });
      setBulkActions({ selectedProducts: [], action: "", value: "" });
    },
  });

  const [newCategory, setNewCategory] = useState({ name: "", description: "", imageUrl: "" });
  const [newBrand, setNewBrand] = useState({ name: "", description: "", logoUrl: "" });
  const [newFilter, setNewFilter] = useState({ name: "", type: "select", options: [""] });

  const handleAddCategory = () => {
    if (newCategory.name) {
      addCategoryMutation.mutate(newCategory);
      setNewCategory({ name: "", description: "", imageUrl: "" });
    }
  };

  const handleAddBrand = () => {
    if (newBrand.name) {
      addBrandMutation.mutate(newBrand);
      setNewBrand({ name: "", description: "", logoUrl: "" });
    }
  };

  const handleAddFilter = () => {
    if (newFilter.name) {
      setFilters([...filters, { ...newFilter, id: Date.now().toString() }]);
      setNewFilter({ name: "", type: "select", options: [""] });
    }
  };

  const handleBulkAction = () => {
    if (bulkActions.selectedProducts.length > 0 && bulkActions.action) {
      bulkActionMutation.mutate(bulkActions);
    }
  };

  const saveAllSettings = () => {
    const settings = {
      categories,
      brands,
      filters,
      sortOptions,
      searchSettings,
      infiniteScrollSettings,
      trendingSettings,
    };
    saveSettingsMutation.mutate(settings);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Shop Settings & Controls
          </CardTitle>
          <CardDescription>
            Comprehensive shop management controls for filters, categories, brands, and more
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="categories" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="brands">Brands</TabsTrigger>
              <TabsTrigger value="filters">Filters</TabsTrigger>
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Category Management</h3>
                
                {/* Add New Category */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Add New Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="categoryName">Category Name</Label>
                        <Input
                          id="categoryName"
                          value={newCategory.name}
                          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                          placeholder="e.g., Accessories"
                        />
                      </div>
                      <div>
                        <Label htmlFor="categoryDesc">Description</Label>
                        <Input
                          id="categoryDesc"
                          value={newCategory.description}
                          onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                          placeholder="Category description"
                        />
                      </div>
                      <div>
                        <Label htmlFor="categoryImage">Image URL</Label>
                        <Input
                          id="categoryImage"
                          value={newCategory.imageUrl}
                          onChange={(e) => setNewCategory({ ...newCategory, imageUrl: e.target.value })}
                          placeholder="Category image URL"
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddCategory} className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                  </CardContent>
                </Card>

                {/* Category List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Existing Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-3">
                            <Badge>{category.name}</Badge>
                            <span className="text-sm text-muted-foreground">{category.description}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="icon">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <ArrowDown className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="brands" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Brand Management</h3>
                
                {/* Add New Brand */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Add New Brand</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="brandName">Brand Name</Label>
                        <Input
                          id="brandName"
                          value={newBrand.name}
                          onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                          placeholder="e.g., Nike"
                        />
                      </div>
                      <div>
                        <Label htmlFor="brandDesc">Description</Label>
                        <Input
                          id="brandDesc"
                          value={newBrand.description}
                          onChange={(e) => setNewBrand({ ...newBrand, description: e.target.value })}
                          placeholder="Brand description"
                        />
                      </div>
                      <div>
                        <Label htmlFor="brandLogo">Logo URL</Label>
                        <Input
                          id="brandLogo"
                          value={newBrand.logoUrl}
                          onChange={(e) => setNewBrand({ ...newBrand, logoUrl: e.target.value })}
                          placeholder="Brand logo URL"
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddBrand} className="mt-4">
                      <Upload className="w-4 h-4 mr-2" />
                      Add Brand
                    </Button>
                  </CardContent>
                </Card>

                {/* Brand List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Existing Brands</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {brands.map((brand) => (
                        <div key={brand.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-3">
                            {brand.logoUrl && (
                              <img src={brand.logoUrl} alt={brand.name} className="w-8 h-8 rounded" />
                            )}
                            <Badge>{brand.name}</Badge>
                            <span className="text-sm text-muted-foreground">{brand.description}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch />
                            <span className="text-sm">Visible</span>
                            <Button variant="ghost" size="icon">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="filters" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Filter & Sorting Management</h3>
                
                {/* Add New Filter */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Add New Filter</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="filterName">Filter Name</Label>
                        <Input
                          id="filterName"
                          value={newFilter.name}
                          onChange={(e) => setNewFilter({ ...newFilter, name: e.target.value })}
                          placeholder="e.g., Size"
                        />
                      </div>
                      <div>
                        <Label htmlFor="filterType">Filter Type</Label>
                        <Select
                          value={newFilter.type}
                          onValueChange={(value) => setNewFilter({ ...newFilter, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="select">Select</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                            <SelectItem value="range">Range</SelectItem>
                            <SelectItem value="color">Color Picker</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Filter Options</Label>
                        <div className="space-y-1">
                          {newFilter.options.map((option, index) => (
                            <Input
                              key={index}
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...newFilter.options];
                                newOptions[index] = e.target.value;
                                setNewFilter({ ...newFilter, options: newOptions });
                              }}
                              placeholder="Option value"
                            />
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNewFilter({ ...newFilter, options: [...newFilter.options, ""] })}
                          >
                            Add Option
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Button onClick={handleAddFilter} className="mt-4">
                      <Filter className="w-4 h-4 mr-2" />
                      Add Filter
                    </Button>
                  </CardContent>
                </Card>

                {/* Sort Options */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Sort Options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {sortOptions.map((option, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline">{option.value}</Badge>
                            <span className="text-sm">{option.label}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch defaultChecked />
                            <Button variant="ghost" size="icon">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="search" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Search Configuration</h3>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Search Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="fuzzyThreshold">Fuzzy Search Threshold</Label>
                      <div className="flex items-center space-x-4">
                        <Slider
                          id="fuzzyThreshold"
                          min={0}
                          max={1}
                          step={0.1}
                          value={[searchSettings.fuzzyThreshold]}
                          onValueChange={(value) => 
                            setSearchSettings({ ...searchSettings, fuzzyThreshold: value[0] })
                          }
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-12">
                          {searchSettings.fuzzyThreshold}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Lower values = stricter matching, Higher values = more flexible matching
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="autocomplete">Autocomplete</Label>
                        <p className="text-xs text-muted-foreground">
                          Show search suggestions as user types
                        </p>
                      </div>
                      <Switch
                        id="autocomplete"
                        checked={searchSettings.autocompleteEnabled}
                        onCheckedChange={(checked) => 
                          setSearchSettings({ ...searchSettings, autocompleteEnabled: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="searchHistory">Search History</Label>
                        <p className="text-xs text-muted-foreground">
                          Save and show recent searches
                        </p>
                      </div>
                      <Switch
                        id="searchHistory"
                        checked={searchSettings.searchHistory}
                        onCheckedChange={(checked) => 
                          setSearchSettings({ ...searchSettings, searchHistory: checked })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="suggestionsLimit">Suggestions Limit</Label>
                      <Input
                        id="suggestionsLimit"
                        type="number"
                        min={1}
                        max={20}
                        value={searchSettings.suggestionsLimit}
                        onChange={(e) => 
                          setSearchSettings({ ...searchSettings, suggestionsLimit: parseInt(e.target.value) })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Infinite Scroll Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="infiniteScroll">Enable Infinite Scroll</Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically load more products as user scrolls
                        </p>
                      </div>
                      <Switch
                        id="infiniteScroll"
                        checked={infiniteScrollSettings.enabled}
                        onCheckedChange={(checked) => 
                          setInfiniteScrollSettings({ ...infiniteScrollSettings, enabled: checked })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="loadLimit">Products per Load</Label>
                      <Input
                        id="loadLimit"
                        type="number"
                        min={6}
                        max={50}
                        value={infiniteScrollSettings.loadLimit}
                        onChange={(e) => 
                          setInfiniteScrollSettings({ ...infiniteScrollSettings, loadLimit: parseInt(e.target.value) })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="scrollThreshold">Scroll Threshold (px)</Label>
                      <Input
                        id="scrollThreshold"
                        type="number"
                        min={50}
                        max={500}
                        value={infiniteScrollSettings.threshold}
                        onChange={(e) => 
                          setInfiniteScrollSettings({ ...infiniteScrollSettings, threshold: parseInt(e.target.value) })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Distance from bottom to trigger load
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trending" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Trending & Hot Sections</h3>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Trending Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="autoDetect">Auto-detect Trending</Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically mark products as trending based on sales/views
                        </p>
                      </div>
                      <Switch
                        id="autoDetect"
                        checked={trendingSettings.autoDetect}
                        onCheckedChange={(checked) => 
                          setTrendingSettings({ ...trendingSettings, autoDetect: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="manualPinning">Manual Pinning</Label>
                        <p className="text-xs text-muted-foreground">
                          Allow manual selection of trending products
                        </p>
                      </div>
                      <Switch
                        id="manualPinning"
                        checked={trendingSettings.manualPinning}
                        onCheckedChange={(checked) => 
                          setTrendingSettings({ ...trendingSettings, manualPinning: checked })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="salesThreshold">Sales Threshold</Label>
                      <Input
                        id="salesThreshold"
                        type="number"
                        min={1}
                        value={trendingSettings.salesThreshold}
                        onChange={(e) => 
                          setTrendingSettings({ ...trendingSettings, salesThreshold: parseInt(e.target.value) })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimum sales to be marked as trending
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="viewsThreshold">Views Threshold</Label>
                      <Input
                        id="viewsThreshold"
                        type="number"
                        min={1}
                        value={trendingSettings.viewsThreshold}
                        onChange={(e) => 
                          setTrendingSettings({ ...trendingSettings, viewsThreshold: parseInt(e.target.value) })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimum views to be marked as trending
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Shop Analytics</h3>
                
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analytics?.totalViews || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        +{analytics?.viewsChange || 0}% from last month
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analytics?.conversionRate || 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        +{analytics?.conversionChange || 0}% from last month
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ₹{analytics?.avgOrderValue || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        +{analytics?.aovChange || 0}% from last month
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Cart Abandonment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analytics?.cartAbandonment || 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {analytics?.abandonmentChange || 0}% from last month
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Top Products by Views</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analytics?.topProducts?.map((product: any) => (
                        <div key={product.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline">{product.name}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {product.category}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm">
                              <Eye className="w-4 h-4 inline mr-1" />
                              {product.views}
                            </span>
                            <span className="text-sm">
                              <ShoppingCart className="w-4 h-4 inline mr-1" />
                              {product.sales}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Bulk Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Select Action</Label>
                      <Select
                        value={bulkActions.action}
                        onValueChange={(value) => setBulkActions({ ...bulkActions, action: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose bulk action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discount">Apply Discount</SelectItem>
                          <SelectItem value="category">Change Category</SelectItem>
                          <SelectItem value="featured">Mark as Featured</SelectItem>
                          <SelectItem value="deactivate">Deactivate</SelectItem>
                          <SelectItem value="delete">Delete</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {bulkActions.action === "discount" && (
                      <div>
                        <Label>Discount Percentage</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={bulkActions.value}
                          onChange={(e) => setBulkActions({ ...bulkActions, value: e.target.value })}
                          placeholder="Enter discount %"
                        />
                      </div>
                    )}

                    {bulkActions.action === "category" && (
                      <div>
                        <Label>New Category</Label>
                        <Select
                          value={bulkActions.value}
                          onValueChange={(value) => setBulkActions({ ...bulkActions, value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Button onClick={handleBulkAction} disabled={!bulkActions.action}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Apply Bulk Action
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-6">
            <Button onClick={saveAllSettings} size="lg">
              <Save className="w-4 h-4 mr-2" />
              Save All Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}