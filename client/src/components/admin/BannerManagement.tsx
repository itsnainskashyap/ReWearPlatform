import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Calendar, Image, Target } from "lucide-react";
import type { Banner, InsertBanner } from "@shared/schema";

interface BannerFormData {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  buttonText: string;
  position: string;
  sortOrder: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

const defaultFormData: BannerFormData = {
  title: "",
  subtitle: "",
  imageUrl: "",
  linkUrl: "",
  buttonText: "",
  position: "hero",
  sortOrder: 0,
  isActive: true,
  startDate: "",
  endDate: "",
};

export function BannerManagement() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<BannerFormData>(defaultFormData);

  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ["/api/admin/banners"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertBanner) => {
      return await apiRequest("POST", "/api/admin/banners", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      setIsOpen(false);
      setFormData(defaultFormData);
      toast({
        title: "Success",
        description: "Banner created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create banner.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertBanner> }) => {
      return await apiRequest("PUT", `/api/admin/banners/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      setIsOpen(false);
      setEditingBanner(null);
      setFormData(defaultFormData);
      toast({
        title: "Success",
        description: "Banner updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update banner.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/banners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      toast({
        title: "Success",
        description: "Banner deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete banner.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      startDate: formData.startDate ? new Date(formData.startDate) : null,
      endDate: formData.endDate ? new Date(formData.endDate) : null,
    };

    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      imageUrl: banner.imageUrl || "",
      linkUrl: banner.linkUrl || "",
      buttonText: banner.buttonText || "",
      position: banner.position || "hero",
      sortOrder: banner.sortOrder || 0,
      isActive: banner.isActive ?? true,
      startDate: banner.startDate ? new Date(banner.startDate).toISOString().split('T')[0] : "",
      endDate: banner.endDate ? new Date(banner.endDate).toISOString().split('T')[0] : "",
    });
    setIsOpen(true);
  };

  const handleNewBanner = () => {
    setEditingBanner(null);
    setFormData(defaultFormData);
    setIsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Banner Management</h2>
        <Button onClick={handleNewBanner} data-testid="button-add-banner">
          <Plus className="w-4 h-4 mr-2" />
          Add Banner
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(6)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          banners.map((banner) => (
            <Card key={banner.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg truncate">{banner.title}</CardTitle>
                  <Badge variant={banner.isActive ? "default" : "secondary"}>
                    {banner.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {banner.subtitle && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {banner.subtitle}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <Target className="w-3 h-3 mr-1" />
                    {banner.position}
                  </span>
                  <span>Order: {banner.sortOrder}</span>
                </div>

                {banner.imageUrl && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Image className="w-3 h-3 mr-1" />
                    Has Image
                  </div>
                )}

                {(banner.startDate || banner.endDate) && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3 mr-1" />
                    {banner.startDate && new Date(banner.startDate).toLocaleDateString()} - 
                    {banner.endDate && new Date(banner.endDate).toLocaleDateString()}
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(banner)}
                    data-testid={`button-edit-banner-${banner.id}`}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(banner.id)}
                    className="text-destructive hover:text-destructive"
                    data-testid={`button-delete-banner-${banner.id}`}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl backdrop-blur-md">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? "Edit Banner" : "Create Banner"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  data-testid="input-banner-title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  data-testid="input-banner-sort-order"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Textarea
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                data-testid="input-banner-subtitle"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                data-testid="input-banner-image-url"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkUrl">Link URL</Label>
                <Input
                  id="linkUrl"
                  type="url"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  data-testid="input-banner-link-url"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="buttonText">Button Text</Label>
                <Input
                  id="buttonText"
                  value={formData.buttonText}
                  onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                  data-testid="input-banner-button-text"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select
                value={formData.position}
                onValueChange={(value) => setFormData({ ...formData, position: value })}
              >
                <SelectTrigger data-testid="select-banner-position">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hero">Hero</SelectItem>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="sidebar">Sidebar</SelectItem>
                  <SelectItem value="footer">Footer</SelectItem>
                  <SelectItem value="popup">Popup</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  data-testid="input-banner-start-date"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  data-testid="input-banner-end-date"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-banner-active"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                data-testid="button-cancel-banner"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-banner"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingBanner
                  ? "Update Banner"
                  : "Create Banner"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}