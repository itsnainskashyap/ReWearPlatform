import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Plus, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const editProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be positive"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().min(1, "Brand is required"),
  condition: z.enum(["new", "like-new", "good", "fair"]),
  images: z.array(z.string()).min(1, "At least one image is required"),
  sizes: z.array(z.string()).min(1, "At least one size is required"),
  isFeatured: z.boolean().default(false),
});

type EditProductForm = z.infer<typeof editProductSchema>;

interface EditProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any; // The product to edit
}

export function EditProductModal({ open, onOpenChange, product }: EditProductModalProps) {
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [sizes, setSizes] = useState<string[]>([""]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm<EditProductForm>({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      condition: "new",
      images: [],
      sizes: [],
      isFeatured: false
    }
  });

  // Populate form when product changes
  useEffect(() => {
    if (product && open) {
      setValue("name", product.name || "");
      setValue("description", product.description || "");
      setValue("price", product.price || 0);
      setValue("category", product.category || "");
      setValue("brand", product.brand || "");
      setValue("condition", product.condition || "new");
      setValue("isFeatured", product.isFeatured || false);
      
      const productImages = product.images || [""];
      const productSizes = product.sizes || [""];
      
      setImageUrls(productImages.length > 0 ? productImages : [""]);
      setSizes(productSizes.length > 0 ? productSizes : [""]);
      
      setValue("images", productImages);
      setValue("sizes", productSizes);
    }
  }, [product, open, setValue]);

  const updateProductMutation = useMutation({
    mutationFn: async (data: EditProductForm) => {
      return await apiRequest("PUT", `/api/admin/products/${product.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/featured-products"] });
      toast({
        title: "Product Updated",
        description: "Product has been successfully updated.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: EditProductForm) => {
    const validImageUrls = imageUrls.filter(url => url.trim() !== "");
    const validSizes = sizes.filter(size => size.trim() !== "");
    
    updateProductMutation.mutate({
      ...data,
      images: validImageUrls,
      sizes: validSizes
    });
  };

  const addImageUrl = () => {
    setImageUrls([...imageUrls, ""]);
  };

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

  const addSize = () => {
    setSizes([...sizes, ""]);
  };

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

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-edit-product">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update the product details and save your changes.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Product Name *</Label>
              <Input
                id="edit-name"
                {...register("name")}
                placeholder="Enter product name"
                className="rounded-xl"
                data-testid="input-edit-product-name"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-price">Price (₹) *</Label>
              <Input
                id="edit-price"
                type="number"
                {...register("price", { valueAsNumber: true })}
                placeholder="0"
                className="rounded-xl"
                data-testid="input-edit-product-price"
              />
              {errors.price && (
                <p className="text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description *</Label>
            <Textarea
              id="edit-description"
              {...register("description")}
              placeholder="Enter product description"
              className="rounded-xl min-h-[100px]"
              data-testid="input-edit-product-description"
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category *</Label>
              <Input
                id="edit-category"
                {...register("category")}
                placeholder="e.g., T-Shirts, Jeans"
                className="rounded-xl"
                data-testid="input-edit-product-category"
              />
              {errors.category && (
                <p className="text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-brand">Brand *</Label>
              <Input
                id="edit-brand"
                {...register("brand")}
                placeholder="e.g., Nike, Zara"
                className="rounded-xl"
                data-testid="input-edit-product-brand"
              />
              {errors.brand && (
                <p className="text-sm text-red-600">{errors.brand.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-condition">Condition *</Label>
              <Select onValueChange={(value) => setValue("condition", value as any)}>
                <SelectTrigger className="rounded-xl" data-testid="select-edit-product-condition">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="like-new">Like New</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                </SelectContent>
              </Select>
              {errors.condition && (
                <p className="text-sm text-red-600">{errors.condition.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Product Images *</Label>
            <div className="space-y-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={url}
                    onChange={(e) => updateImageUrl(index, e.target.value)}
                    placeholder="Enter image URL"
                    className="rounded-xl"
                    data-testid={`input-edit-image-url-${index}`}
                  />
                  {imageUrls.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeImageUrl(index)}
                      className="rounded-xl"
                      data-testid={`button-edit-remove-image-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addImageUrl}
                className="rounded-xl"
                data-testid="button-edit-add-image"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Image URL
              </Button>
            </div>
            {errors.images && (
              <p className="text-sm text-red-600">{errors.images.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Available Sizes *</Label>
            <div className="space-y-2">
              {sizes.map((size, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={size}
                    onChange={(e) => updateSize(index, e.target.value)}
                    placeholder="e.g., S, M, L, XL"
                    className="rounded-xl"
                    data-testid={`input-edit-size-${index}`}
                  />
                  {sizes.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeSize(index)}
                      className="rounded-xl"
                      data-testid={`button-edit-remove-size-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addSize}
                className="rounded-xl"
                data-testid="button-edit-add-size"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Size
              </Button>
            </div>
            {errors.sizes && (
              <p className="text-sm text-red-600">{errors.sizes.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-featured">Feature this product</Label>
              <Switch
                id="edit-featured"
                {...register("isFeatured")}
                onCheckedChange={(checked) => setValue("isFeatured", checked)}
                data-testid="switch-edit-featured"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Featured products will appear in the featured carousel on the homepage
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
              data-testid="button-cancel-edit-product"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateProductMutation.isPending}
              className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl"
              data-testid="button-submit-edit-product"
            >
              {updateProductMutation.isPending ? "Updating..." : "Update Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}