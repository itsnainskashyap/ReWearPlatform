import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Upload, User, Sparkles, Camera, RefreshCw, Download, Share2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface VirtualTryOnProps {
  productId: string;
  productName: string;
  productImage?: string;
}

export default function VirtualTryOn({ productId, productName, productImage }: VirtualTryOnProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const tryOnMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest('POST', '/api/ai/tryon', formData);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setTryOnResult(data.description);
        setSessionCount(prev => prev + 1);
        toast({
          title: "Virtual Try-On Complete!",
          description: "Your AI visualization has been created.",
        });
      } else {
        throw new Error(data.error || 'Try-on failed');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Try-On Failed",
        description: error.message || "Please try with a clearer photo or different angle.",
        variant: "destructive",
      });
    },
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image under 5MB.",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.includes('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a JPEG or PNG image.",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTryOn = () => {
    if (!selectedImage) {
      toast({
        title: "No Image Selected",
        description: "Please upload your photo first.",
        variant: "destructive",
      });
      return;
    }

    if (sessionCount >= 3) {
      toast({
        title: "Session Limit Reached",
        description: "You've reached the limit of 3 try-ons per session. Please refresh the page to continue.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('userImage', selectedImage);
    formData.append('productId', productId);
    // The prompt will be used from the product's stored aiTryOnPrompt or auto-generated

    tryOnMutation.mutate(formData);
  };

  const resetTryOn = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setTryOnResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground rounded-2xl"
          data-testid="button-virtual-tryon"
        >
          <User className="w-4 h-4 mr-2" />
          Virtual Try-On
          <Sparkles className="w-4 h-4 ml-2" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-primary" />
            <span>AI Virtual Try-On</span>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Powered by AI
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Privacy Notice */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Privacy Protection</p>
                  <p className="text-xs mt-1">
                    Your photos are processed temporarily and automatically deleted after visualization. 
                    We don't store any personal images.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Limit */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Try-ons this session: {sessionCount}/3</span>
            <Badge variant={sessionCount >= 3 ? "destructive" : "secondary"}>
              {3 - sessionCount} remaining
            </Badge>
          </div>

          {/* Upload Section */}
          {!imagePreview ? (
            <Card className="border-dashed border-2 border-primary/30">
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Camera className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Upload Your Photo</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload a clear, full-body photo for the best AI try-on results
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="rounded-xl"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Photo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Preview and Result Section */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original Photo */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Your Photo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square rounded-xl overflow-hidden">
                    <img 
                      src={imagePreview} 
                      alt="User upload" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Try-On Result */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <span>AI Visualization</span>
                    {tryOnMutation.isPending && (
                      <RefreshCw className="w-4 h-4 ml-2 animate-spin text-primary" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tryOnMutation.isPending ? (
                    <div className="aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <Sparkles className="w-8 h-8 text-primary animate-pulse mx-auto" />
                        <p className="text-sm text-primary font-medium">
                          AI is creating your try-on...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          This may take 10-15 seconds
                        </p>
                      </div>
                    </div>
                  ) : tryOnResult ? (
                    <div className="aspect-square rounded-xl bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
                      <div className="text-center space-y-2">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                          <Sparkles className="w-6 h-6 text-green-600" />
                        </div>
                        <h4 className="font-semibold text-green-800">Try-On Complete!</h4>
                        <p className="text-sm text-green-700">
                          {tryOnResult}
                        </p>
                        <div className="flex space-x-2 pt-2">
                          <Button size="sm" variant="outline" className="rounded-xl">
                            <Download className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-xl">
                            <Share2 className="w-3 h-3 mr-1" />
                            Share
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                      <p className="text-sm text-muted-foreground text-center">
                        AI visualization will appear here
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {imagePreview && (
              <>
                <Button 
                  onClick={handleTryOn}
                  disabled={tryOnMutation.isPending || sessionCount >= 3}
                  className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 rounded-xl"
                >
                  {tryOnMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Creating AI Try-On...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Try-On
                    </>
                  )}
                </Button>
                <Button 
                  onClick={resetTryOn}
                  variant="outline"
                  className="rounded-xl"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </>
            )}
          </div>

          {/* Tips */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="font-medium text-blue-800 mb-2">Tips for Best Results:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Use a clear, well-lit photo</li>
                <li>• Stand straight with arms slightly away from body</li>
                <li>• Avoid busy backgrounds</li>
                <li>• Ensure your full body is visible</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}