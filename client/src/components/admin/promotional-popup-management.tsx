import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Eye, Calendar, Target } from "lucide-react";
import type { PromotionalPopup, InsertPromotionalPopup } from "@shared/schema";

interface PopupFormData {
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  buttonUrl: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  position: string;
  size: string;
  trigger: string;
  triggerValue: number;
  showFrequency: string;
  targetPages: string[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  priority: number;
}

const defaultFormData: PopupFormData = {
  title: "",
  description: "",
  imageUrl: "",
  buttonText: "",
  buttonUrl: "",
  backgroundColor: "#ffffff",
  textColor: "#000000",
  buttonColor: "#10b981",
  position: "center",
  size: "medium",
  trigger: "page_load",
  triggerValue: 0,
  showFrequency: "once",
  targetPages: [],
  startDate: "",
  endDate: "",
  isActive: true,
  priority: 0,
};

export function PromotionalPopupManagement() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState<PromotionalPopup | null>(null);
  const [formData, setFormData] = useState<PopupFormData>(defaultFormData);
  const [targetPagesInput, setTargetPagesInput] = useState("");

  const { data: popups = [], isLoading } = useQuery<PromotionalPopup[]>({
    queryKey: ["/api/promotional-popups"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertPromotionalPopup) => {
      return await apiRequest("POST", "/api/promotional-popups", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotional-popups"] });
      setIsOpen(false);
      setFormData(defaultFormData);
      setTargetPagesInput("");
      toast({
        title: "Success",
        description: "Promotional popup created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create promotional popup.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertPromotionalPopup> }) => {
      return await apiRequest("PUT", `/api/promotional-popups/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotional-popups"] });
      setIsOpen(false);
      setEditingPopup(null);
      setFormData(defaultFormData);
      setTargetPagesInput("");
      toast({
        title: "Success",
        description: "Promotional popup updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update promotional popup.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/promotional-popups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotional-popups"] });
      toast({
        title: "Success",
        description: "Promotional popup deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete promotional popup.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const targetPages = targetPagesInput
      .split(",")
      .map(page => page.trim())
      .filter(page => page.length > 0);

    const submitData = {
      ...formData,
      targetPages,
      startDate: formData.startDate ? new Date(formData.startDate) : null,
      endDate: formData.endDate ? new Date(formData.endDate) : null,
    };

    if (editingPopup) {
      updateMutation.mutate({ id: editingPopup.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (popup: PromotionalPopup) => {
    setEditingPopup(popup);
    setFormData({
      title: popup.title,
      description: popup.description || "",
      imageUrl: popup.imageUrl || "",
      buttonText: popup.buttonText || "",
      buttonUrl: popup.buttonUrl || "",
      backgroundColor: popup.backgroundColor || "#ffffff",
      textColor: popup.textColor || "#000000",
      buttonColor: popup.buttonColor || "#10b981",
      position: popup.position || "center",
      size: popup.size || "medium",
      trigger: popup.trigger || "page_load",
      triggerValue: popup.triggerValue || 0,
      showFrequency: popup.showFrequency || "once",
      targetPages: popup.targetPages || [],
      startDate: popup.startDate ? new Date(popup.startDate).toISOString().split('T')[0] : "",
      endDate: popup.endDate ? new Date(popup.endDate).toISOString().split('T')[0] : "",
      isActive: popup.isActive ?? true,
      priority: popup.priority || 0,
    });
    setTargetPagesInput((popup.targetPages || []).join(", "));
    setIsOpen(true);
  };

  const handleNewPopup = () => {
    setEditingPopup(null);
    setFormData(defaultFormData);
    setTargetPagesInput("");
    setIsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Promotional Popups</h2>
        <Button onClick={handleNewPopup} data-testid="button-add-popup">
          <Plus className="w-4 h-4 mr-2" />
          Add Popup
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
          popups.map((popup) => (
            <Card key={popup.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg truncate">{popup.title}</CardTitle>
                  <Badge variant={popup.isActive ? "default" : "secondary"}>
                    {popup.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {popup.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <Target className="w-3 h-3 mr-1" />
                    {popup.trigger === "page_load" ? "Page Load" : 
                     popup.trigger === "time_delay" ? `${popup.triggerValue}s Delay` : 
                     "Exit Intent"}
                  </span>
                  <span>Priority: {popup.priority}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{popup.showFrequency}</span>
                  <span>{popup.position} / {popup.size}</span>
                </div>

                {(popup.startDate || popup.endDate) && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3 mr-1" />
                    {popup.startDate && new Date(popup.startDate).toLocaleDateString()} - 
                    {popup.endDate && new Date(popup.endDate).toLocaleDateString()}
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(popup)}
                    data-testid={`button-edit-popup-${popup.id}`}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMutation.mutate(popup.id)}
                    className="text-destructive hover:text-destructive"
                    data-testid={`button-delete-popup-${popup.id}`}
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
              {editingPopup ? "Edit Promotional Popup" : "Create Promotional Popup"}
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
                  data-testid="input-popup-title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  data-testid="input-popup-priority"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="input-popup-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buttonText">Button Text</Label>
                <Input
                  id="buttonText"
                  value={formData.buttonText}
                  onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                  data-testid="input-popup-button-text"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="buttonUrl">Button URL</Label>
                <Input
                  id="buttonUrl"
                  value={formData.buttonUrl}
                  onChange={(e) => setFormData({ ...formData, buttonUrl: e.target.value })}
                  data-testid="input-popup-button-url"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Select value={formData.position} onValueChange={(value) => setFormData({ ...formData, position: value })}>
                  <SelectTrigger data-testid="select-popup-position">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Select value={formData.size} onValueChange={(value) => setFormData({ ...formData, size: value })}>
                  <SelectTrigger data-testid="select-popup-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trigger">Trigger</Label>
                <Select value={formData.trigger} onValueChange={(value) => setFormData({ ...formData, trigger: value })}>
                  <SelectTrigger data-testid="select-popup-trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="page_load">Page Load</SelectItem>
                    <SelectItem value="time_delay">Time Delay</SelectItem>
                    <SelectItem value="exit_intent">Exit Intent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.trigger === "time_delay" && (
              <div className="space-y-2">
                <Label htmlFor="triggerValue">Delay (seconds)</Label>
                <Input
                  id="triggerValue"
                  type="number"
                  value={formData.triggerValue}
                  onChange={(e) => setFormData({ ...formData, triggerValue: parseInt(e.target.value) || 0 })}
                  data-testid="input-popup-delay"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="showFrequency">Show Frequency</Label>
              <Select value={formData.showFrequency} onValueChange={(value) => setFormData({ ...formData, showFrequency: value })}>
                <SelectTrigger data-testid="select-popup-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Once</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="always">Always</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetPages">Target Pages (comma-separated, * for all)</Label>
              <Input
                id="targetPages"
                value={targetPagesInput}
                onChange={(e) => setTargetPagesInput(e.target.value)}
                placeholder="/, /shop, /about or * for all pages"
                data-testid="input-popup-target-pages"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  data-testid="input-popup-start-date"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  data-testid="input-popup-end-date"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-popup-active"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingPopup ? "Update" : "Create"} Popup
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}