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
import { Plus, X, Upload, Video, Play } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const editProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be positive"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().min(1, "Brand is required"),
  condition: z.enum(["new", "like-new", "good", "fair"]),
  images: z.array(z.string()).min(1, "At least one image is required"),
  videos: z.array(z.string()).optional(),
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
  const [videos, setVideos] = useState<string[]>([]);
  const [uploading, setUploading] = useState<{ [key: number]: boolean }>({});
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
      videos: [],
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
      const productVideos = product.videos || [];
      const productSizes = product.sizes || [""];
      
      setImageUrls(productImages.length > 0 ? productImages : [""]);
      setVideos(productVideos);
      setSizes(productSizes.length > 0 ? productSizes : [""]);
      
      setValue("images", productImages);
      setValue("videos", productVideos);
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
    const validVideos = videos.filter(url => url.trim() !== "");
    const validSizes = sizes.filter(size => size.trim() !== "");
    
    updateProductMutation.mutate({
      ...data,
      images: validImageUrls,
      videos: validVideos,
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

  // Video handling functions
  const addVideoSlot = () => {
    if (videos.length >= 3) {
      toast({
        title: "Maximum videos reached",
        description: "You can upload up to 3 videos per product.",
        variant: "destructive",
      });
      return;
    }
    setVideos([...videos, ""]);
  };

  const removeVideo = async (index: number) => {
    const videoToRemove = videos[index];
    const newVideos = videos.filter((_, i) => i !== index);
    setVideos(newVideos);
    setValue("videos", newVideos);

    // If it's an existing video (not empty string), remove from server
    if (videoToRemove && videoToRemove.trim() && product?.id) {
      try {
        await apiRequest("PATCH", `/api/products/${product.id}/videos`, {
          action: "remove",
          videoUrl: videoToRemove
        });
        toast({
          title: "Video removed",
          description: "Video has been successfully removed from the product.",
        });
      } catch (error) {
        toast({
          title: "Error removing video",
          description: "Failed to remove video from server. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleVideoUpload = async (index: number, file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file (MP4 or WebM).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video files must be under 50MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(prev => ({ ...prev, [index]: true }));

    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Update videos array
      const newVideos = [...videos];
      newVideos[index] = data.url;
      setVideos(newVideos);
      setValue("videos", newVideos.filter(url => url.trim() !== ""));

      // If editing existing product, add video to server
      if (product?.id) {
        await apiRequest("PATCH", `/api/products/${product.id}/videos`, {
          action: "add",
          videoUrl: data.url
        });
      }

      toast({
        title: "Video uploaded",
        description: "Video has been successfully uploaded.",
      });
    } catch (error) {
      console.error('Video upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(prev => ({ ...prev, [index]: false }));
    }
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

          {/* Product Videos Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Product Videos (Optional)</Label>
              <span className="text-sm text-muted-foreground">
                {videos.length}/3 videos
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload up to 3 videos (MP4/WebM, max 50MB each) to showcase your product in action
            </p>
            
            <div className="space-y-3">
              {videos.map((video, index) => (
                <div key={index} className="border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Video {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVideo(index)}
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-edit-remove-video-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {video ? (
                    <div className="space-y-2">
                      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                        <video
                          src={video}
                          controls
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                          data-testid={`video-edit-preview-${index}`}
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{video}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                        <Video className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">Upload a video</p>
                        <Input
                          type="file"
                          accept="video/mp4,video/webm"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleVideoUpload(index, file);
                              e.target.value = '';
                            }
                          }}
                          className="hidden"
                          id={`edit-video-upload-${index}`}
                          data-testid={`input-edit-video-upload-${index}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById(`edit-video-upload-${index}`)?.click()}
                          disabled={uploading[index]}
                          data-testid={`button-edit-upload-video-${index}`}
                        >
                          {uploading[index] ? (
                            "Uploading..."
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Choose Video
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {videos.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addVideoSlot}
                  className="w-full rounded-xl border-dashed"
                  data-testid="button-edit-add-video"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Video
                </Button>
              )}
            </div>
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