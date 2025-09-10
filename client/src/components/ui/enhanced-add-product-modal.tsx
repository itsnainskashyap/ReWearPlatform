import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { 
  Plus, 
  X, 
  Upload, 
  Image, 
  Leaf, 
  Tag, 
  Percent,
  Calendar,
  Package,
  AlertCircle,
  Link
} from "lucide-react";

const enhancedProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  originalPrice: z.number().optional(),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().optional(),
  condition: z.enum(["new", "like-new", "good", "fair"]),
  color: z.string().optional(),
  material: z.string().optional(),
  fabric: z.string().optional(),
  measurements: z.object({
    chest: z.string().optional(),
    waist: z.string().optional(),
    hips: z.string().optional(),
    length: z.string().optional(),
    shoulders: z.string().optional(),
    sleeve: z.string().optional(),
  }).optional(),
  washCare: z.string().optional(),
  images: z.array(z.string()).min(1, "At least one image is required"),
  sizes: z.array(z.string()).min(1, "At least one size is required"),
  ecoBadges: z.array(z.string()).optional(),
  discount: z.number().min(0).max(100).optional(),
  discountType: z.enum(["percentage", "fixed"]).optional(),
  discountExpiry: z.string().optional(),
  stock: z.number().min(0).default(1),
  stockAlert: z.number().min(0).default(5),
  relatedProducts: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isOriginal: z.boolean().default(false),
  isThrift: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isHotSelling: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type EnhancedProductForm = z.infer<typeof enhancedProductSchema>;

interface EnhancedAddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnhancedAddProductModal({ open, onOpenChange }: EnhancedAddProductModalProps) {
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [sizes, setSizes] = useState<string[]>([""]);
  const [tags, setTags] = useState<string[]>([]);
  const [ecoBadges, setEcoBadges] = useState<string[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");

  // Fetch categories and brands
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: brands } = useQuery({
    queryKey: ["/api/brands"],
  });

  const { data: allProducts } = useQuery({
    queryKey: ["/api/products"],
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<EnhancedProductForm>({
    resolver: zodResolver(enhancedProductSchema),
    defaultValues: {
      condition: "new",
      images: [],
      sizes: [],
      stock: 1,
      stockAlert: 5,
      isActive: true,
      isOriginal: false,
      isThrift: false,
      isFeatured: false,
      isHotSelling: false,
      discountType: "percentage",
    }
  });

  // Watch categoryId to conditionally show brand selection
  const selectedCategory = watch("categoryId");

  const createProductMutation = useMutation({
    mutationFn: async (data: EnhancedProductForm) => {
      return await apiRequest("POST", "/api/admin/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Product Added",
        description: "Product has been successfully added to your store.",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    reset();
    setImageUrls([""]);
    setSizes([""]);
    setTags([]);
    setEcoBadges([]);
    setRelatedProducts([]);
    setCurrentTag("");
  };

  const onSubmit = (data: EnhancedProductForm) => {
    const validImageUrls = imageUrls.filter(url => url.trim() !== "");
    const validSizes = sizes.filter(size => size.trim() !== "");
    
    createProductMutation.mutate({
      ...data,
      images: validImageUrls,
      sizes: validSizes,
      tags,
      ecoBadges,
      relatedProducts,
    });
  };

  const addImageUrl = () => setImageUrls([...imageUrls, ""]);
  const removeImageUrl = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls);
    setValue("images", newUrls.filter(url => url.trim() !== ""));
  };
  const updateImageUrl = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
    setValue("images", newUrls.filter(url => url.trim() !== ""));
  };

  const addSize = () => setSizes([...sizes, ""]);
  const removeSize = (index: number) => {
    const newSizes = sizes.filter((_, i) => i !== index);
    setSizes(newSizes);
    setValue("sizes", newSizes.filter(size => size.trim() !== ""));
  };
  const updateSize = (index: number, value: string) => {
    const newSizes = [...sizes];
    newSizes[index] = value;
    setSizes(newSizes);
    setValue("sizes", newSizes.filter(size => size.trim() !== ""));
  };

  const addTag = () => {
    if (currentTag.trim()) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const toggleEcoBadge = (badge: string) => {
    if (ecoBadges.includes(badge)) {
      setEcoBadges(ecoBadges.filter(b => b !== badge));
    } else {
      setEcoBadges([...ecoBadges, badge]);
    }
  };

  const availableEcoBadges = [
    "100% Organic",
    "Recycled Materials",
    "Sustainable",
    "Eco-Friendly",
    "Carbon Neutral",
    "Fair Trade",
    "Vegan",
    "Biodegradable",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Add New Product (Enhanced)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="seo">SEO & Tags</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input 
                    id="name" 
                    {...register("name")} 
                    placeholder="e.g., Vintage Denim Jacket"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="categoryId">Category *</Label>
                  <Select onValueChange={(value) => setValue("categoryId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thrift">Thrift Store</SelectItem>
                      <SelectItem value="originals">ReWeara Originals</SelectItem>
                      {Array.isArray(categories) && categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && (
                    <p className="text-sm text-destructive mt-1">{errors.categoryId.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Only show brand selection if not ReWeara Originals */}
                {selectedCategory !== "originals" && (
                  <div>
                    <Label htmlFor="brandId">Brand/Logo</Label>
                    <Select onValueChange={(value) => setValue("brandId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(brands) && brands.map((brand: any) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className={selectedCategory === "originals" ? "col-span-2" : ""}>
                  <Label htmlFor="condition">Condition *</Label>
                  <Select 
                    defaultValue="new"
                    onValueChange={(value: any) => setValue("condition", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="like-new">Like New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Full Description *</Label>
                <Textarea 
                  id="description" 
                  {...register("description")} 
                  placeholder="Detailed product description..."
                  rows={4}
                />
                {errors.description && (
                  <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input 
                  id="shortDescription" 
                  {...register("shortDescription")} 
                  placeholder="Brief product summary for cards..."
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="isThrift"
                    onCheckedChange={(checked) => setValue("isThrift", checked)}
                  />
                  <Label htmlFor="isThrift">Thrift Item</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="isOriginal"
                    onCheckedChange={(checked) => setValue("isOriginal", checked)}
                  />
                  <Label htmlFor="isOriginal">ReWeara Original</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="isActive"
                    defaultChecked
                    onCheckedChange={(checked) => setValue("isActive", checked)}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input 
                    id="color" 
                    {...register("color")} 
                    placeholder="e.g., Blue"
                  />
                </div>
                <div>
                  <Label htmlFor="material">Material</Label>
                  <Input 
                    id="material" 
                    {...register("material")} 
                    placeholder="e.g., Cotton"
                  />
                </div>
                <div>
                  <Label htmlFor="fabric">Fabric Details</Label>
                  <Input 
                    id="fabric" 
                    {...register("fabric")} 
                    placeholder="e.g., 100% Organic Cotton"
                  />
                </div>
              </div>

              <div>
                <Label>Available Sizes *</Label>
                <div className="space-y-2">
                  {sizes.map((size, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={size}
                        onChange={(e) => updateSize(index, e.target.value)}
                        placeholder="e.g., S, M, L, XL"
                      />
                      {sizes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSize(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addSize}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Size
                  </Button>
                </div>
              </div>

              <Accordion type="single" collapsible>
                <AccordionItem value="measurements">
                  <AccordionTrigger>Measurements (Optional)</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="chest">Chest</Label>
                        <Input 
                          id="chest" 
                          {...register("measurements.chest")} 
                          placeholder="e.g., 40 inches"
                        />
                      </div>
                      <div>
                        <Label htmlFor="waist">Waist</Label>
                        <Input 
                          id="waist" 
                          {...register("measurements.waist")} 
                          placeholder="e.g., 32 inches"
                        />
                      </div>
                      <div>
                        <Label htmlFor="hips">Hips</Label>
                        <Input 
                          id="hips" 
                          {...register("measurements.hips")} 
                          placeholder="e.g., 38 inches"
                        />
                      </div>
                      <div>
                        <Label htmlFor="length">Length</Label>
                        <Input 
                          id="length" 
                          {...register("measurements.length")} 
                          placeholder="e.g., 28 inches"
                        />
                      </div>
                      <div>
                        <Label htmlFor="shoulders">Shoulders</Label>
                        <Input 
                          id="shoulders" 
                          {...register("measurements.shoulders")} 
                          placeholder="e.g., 18 inches"
                        />
                      </div>
                      <div>
                        <Label htmlFor="sleeve">Sleeve</Label>
                        <Input 
                          id="sleeve" 
                          {...register("measurements.sleeve")} 
                          placeholder="e.g., 24 inches"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div>
                <Label htmlFor="washCare">Wash Care Instructions</Label>
                <Textarea 
                  id="washCare" 
                  {...register("washCare")} 
                  placeholder="e.g., Machine wash cold, tumble dry low..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Eco-Friendly Badges</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableEcoBadges.map((badge) => (
                    <Badge
                      key={badge}
                      variant={ecoBadges.includes(badge) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleEcoBadge(badge)}
                    >
                      <Leaf className="w-3 h-3 mr-1" />
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
              <div>
                <Label>Product Images * (Multi-upload with preview)</Label>
                <div className="space-y-2">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={url}
                        onChange={(e) => updateImageUrl(index, e.target.value)}
                        placeholder="Image URL or upload path"
                      />
                      {url && (
                        <div className="w-10 h-10 rounded border overflow-hidden">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      {imageUrls.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeImageUrl(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addImageUrl}>
                    <Image className="w-4 h-4 mr-2" />
                    Add Image
                  </Button>
                </div>
                {errors.images && (
                  <p className="text-sm text-destructive mt-1">{errors.images.message}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Selling Price (₹) *</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    step="0.01"
                    {...register("price", { valueAsNumber: true })} 
                    placeholder="0.00"
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive mt-1">{errors.price.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="originalPrice">Original Price (₹)</Label>
                  <Input 
                    id="originalPrice" 
                    type="number" 
                    step="0.01"
                    {...register("originalPrice", { valueAsNumber: true })} 
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="discount">Discount</Label>
                  <Input 
                    id="discount" 
                    type="number" 
                    min="0"
                    max="100"
                    {...register("discount", { valueAsNumber: true })} 
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select 
                    defaultValue="percentage"
                    onValueChange={(value: any) => setValue("discountType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discountExpiry">Discount Expiry</Label>
                  <Input 
                    id="discountExpiry" 
                    type="datetime-local"
                    {...register("discountExpiry")} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input 
                    id="stock" 
                    type="number" 
                    min="0"
                    {...register("stock", { valueAsNumber: true })} 
                    defaultValue={1}
                  />
                </div>
                <div>
                  <Label htmlFor="stockAlert">Stock Alert Threshold</Label>
                  <Input 
                    id="stockAlert" 
                    type="number" 
                    min="0"
                    {...register("stockAlert", { valueAsNumber: true })} 
                    defaultValue={5}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="isFeatured"
                    onCheckedChange={(checked) => setValue("isFeatured", checked)}
                  />
                  <Label htmlFor="isFeatured">Featured Product</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="isHotSelling"
                    onCheckedChange={(checked) => setValue("isHotSelling", checked)}
                  />
                  <Label htmlFor="isHotSelling">Hot Selling</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <div>
                <Label>Tags (for search optimization)</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Tag className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="ml-2"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Related Products (Manual/AI Linking)</Label>
                <Select 
                  onValueChange={(value) => {
                    if (!relatedProducts.includes(value)) {
                      setRelatedProducts([...relatedProducts, value]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select related products" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(allProducts) && allProducts.map((product: any) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {relatedProducts.map((productId) => {
                    const product = Array.isArray(allProducts) ? 
                      allProducts.find((p: any) => p.id === productId) : null;
                    return product ? (
                      <Badge key={productId} variant="secondary">
                        {(product as any).name}
                        <button
                          type="button"
                          onClick={() => setRelatedProducts(relatedProducts.filter(id => id !== productId))}
                          className="ml-2"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProductMutation.isPending}>
              {createProductMutation.isPending ? "Adding..." : "Add Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}