import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be positive"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().min(1, "Brand is required"),
  condition: z.enum(["new", "like-new", "good", "fair"]),
  images: z.array(z.string()).min(1, "At least one image is required"),
  sizes: z.array(z.string()).min(1, "At least one size is required"),
});

type ProductForm = z.infer<typeof productSchema>;

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProductModal({ open, onOpenChange }: AddProductModalProps) {
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [sizes, setSizes] = useState<string[]>([""]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      condition: "new",
      images: [],
      sizes: []
    }
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      return await apiRequest("POST", "/api/admin/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Product Added",
        description: "Product has been successfully added to your store.",
      });
      onOpenChange(false);
      reset();
      setImageUrls([""]);
      setSizes([""]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ProductForm) => {
    const validImageUrls = imageUrls.filter(url => url.trim() !== "");
    const validSizes = sizes.filter(size => size.trim() !== "");
    
    createProductMutation.mutate({
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-add-product">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter product name"
                className="rounded-xl"
                data-testid="input-product-name"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                {...register("price", { valueAsNumber: true })}
                placeholder="0"
                className="rounded-xl"
                data-testid="input-product-price"
              />
              {errors.price && (
                <p className="text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Enter product description"
              className="rounded-xl min-h-[100px]"
              data-testid="input-product-description"
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                {...register("category")}
                placeholder="e.g., T-Shirts, Jeans"
                className="rounded-xl"
                data-testid="input-product-category"
              />
              {errors.category && (
                <p className="text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand *</Label>
              <Input
                id="brand"
                {...register("brand")}
                placeholder="e.g., Nike, Zara"
                className="rounded-xl"
                data-testid="input-product-brand"
              />
              {errors.brand && (
                <p className="text-sm text-red-600">{errors.brand.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Condition *</Label>
              <Select onValueChange={(value) => setValue("condition", value as any)}>
                <SelectTrigger className="rounded-xl" data-testid="select-product-condition">
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
                    data-testid={`input-image-url-${index}`}
                  />
                  {imageUrls.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeImageUrl(index)}
                      className="rounded-xl"
                      data-testid={`button-remove-image-${index}`}
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
                data-testid="button-add-image"
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
                    data-testid={`input-size-${index}`}
                  />
                  {sizes.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeSize(index)}
                      className="rounded-xl"
                      data-testid={`button-remove-size-${index}`}
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
                data-testid="button-add-size"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Size
              </Button>
            </div>
            {errors.sizes && (
              <p className="text-sm text-red-600">{errors.sizes.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
              data-testid="button-cancel-add-product"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProductMutation.isPending}
              className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl"
              data-testid="button-submit-add-product"
            >
              {createProductMutation.isPending ? "Adding..." : "Add Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}