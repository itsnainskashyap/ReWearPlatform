import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Share2, 
  Copy, 
  Check, 
  Facebook, 
  Twitter, 
  Mail,
  MessageCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface ProductShareProps {
  product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    images?: string[];
  };
  className?: string;
  variant?: "icon" | "button";
}

export function ProductShare({ product, className = "", variant = "icon" }: ProductShareProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const productUrl = `${window.location.origin}/product/${product.id}`;
  const shareTitle = `Check out ${product.name} on ReWeara`;
  const shareText = `${product.name} - ₹${product.price} | ${product.description || "Sustainable fashion at ReWeara"}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Product link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (platform: string) => {
    let shareUrl = "";
    
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(productUrl)}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText + " " + productUrl)}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText + "\n\n" + productUrl)}`;
        break;
      case "native":
        if (navigator.share) {
          try {
            await navigator.share({
              title: shareTitle,
              text: shareText,
              url: productUrl,
            });
            toast({
              title: "Shared successfully!",
              description: "Product has been shared",
            });
          } catch (error) {
            // User cancelled share or error occurred
            console.log("Share cancelled or failed");
          }
          return;
        } else {
          toast({
            title: "Share not supported",
            description: "Your browser doesn't support native sharing",
            variant: "destructive",
          });
          return;
        }
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
      toast({
        title: "Opening share dialog...",
        description: `Sharing on ${platform}`,
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "icon" ? (
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full hover:bg-primary/10 ${className}`}
            data-testid="button-share-product"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            className={`gap-2 ${className}`}
            data-testid="button-share-product"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 backdrop-blur-md bg-background/95">
        <DropdownMenuLabel>Share this product</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Native Share (if supported) */}
        {typeof navigator !== 'undefined' && navigator.share && (
          <>
            <DropdownMenuItem onClick={() => handleShare("native")}>
              <Share2 className="w-4 h-4 mr-2" />
              Share via...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Copy Link */}
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-600" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy link
            </>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Social Media Shares */}
        <DropdownMenuItem onClick={() => handleShare("facebook")}>
          <Facebook className="w-4 h-4 mr-2" />
          Share on Facebook
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleShare("twitter")}>
          <Twitter className="w-4 h-4 mr-2" />
          Share on Twitter
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleShare("whatsapp")}>
          <MessageCircle className="w-4 h-4 mr-2" />
          Share on WhatsApp
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleShare("email")}>
          <Mail className="w-4 h-4 mr-2" />
          Share via Email
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}