import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  alt?: string;
}

interface MediaCarouselProps {
  images: string[];
  videos?: string[];
  className?: string;
  aspectRatio?: 'square' | 'wide' | 'auto';
}

export function MediaCarousel({ 
  images = [], 
  videos = [], 
  className,
  aspectRatio = 'square' 
}: MediaCarouselProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState<{ [key: number]: boolean }>({});
  const [isMuted, setIsMuted] = useState<{ [key: number]: boolean }>({});

  // Combine images and videos into media items
  const mediaItems: MediaItem[] = [
    ...images.map(url => ({ type: 'image' as const, url })),
    ...videos.map(url => ({ type: 'video' as const, url }))
  ];

  const currentMedia = mediaItems[selectedIndex];

  // Reset selected index if media items change
  useEffect(() => {
    if (selectedIndex >= mediaItems.length && mediaItems.length > 0) {
      setSelectedIndex(0);
    }
  }, [mediaItems.length, selectedIndex]);

  const nextMedia = () => {
    setSelectedIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const prevMedia = () => {
    setSelectedIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const handleVideoPlay = (index: number) => {
    setIsPlaying(prev => ({ ...prev, [index]: true }));
  };

  const handleVideoPause = (index: number) => {
    setIsPlaying(prev => ({ ...prev, [index]: false }));
  };

  const toggleMute = (index: number) => {
    setIsMuted(prev => ({ ...prev, [index]: !prev[index] }));
  };

  if (mediaItems.length === 0) {
    return (
      <div className={cn(
        "w-full bg-muted rounded-lg flex items-center justify-center",
        aspectRatio === 'square' && "aspect-square",
        aspectRatio === 'wide' && "aspect-video",
        className
      )}>
        <div className="text-center text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-2 bg-muted-foreground/10 rounded-full flex items-center justify-center">
            <Play className="w-8 h-8" />
          </div>
          <p>No media available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full", className)}>
      {/* Main Media Display */}
      <div className={cn(
        "relative w-full overflow-hidden rounded-lg bg-black",
        aspectRatio === 'square' && "aspect-square",
        aspectRatio === 'wide' && "aspect-video"
      )}>
        {currentMedia?.type === 'image' ? (
          <img
            src={currentMedia.url}
            alt={currentMedia.alt || `Product image ${selectedIndex + 1}`}
            className="w-full h-full object-contain"
            data-testid={`image-main-${selectedIndex}`}
          />
        ) : currentMedia?.type === 'video' ? (
          <div className="relative w-full h-full">
            <video
              src={currentMedia.url}
              className="w-full h-full object-contain"
              controls
              playsInline
              muted={isMuted[selectedIndex] !== false} // Default muted
              onPlay={() => handleVideoPlay(selectedIndex)}
              onPause={() => handleVideoPause(selectedIndex)}
              data-testid={`video-main-${selectedIndex}`}
            >
              Your browser does not support the video tag.
            </video>
            
            {/* Video Controls Overlay */}
            <div className="absolute top-4 right-4 flex space-x-2">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => toggleMute(selectedIndex)}
                data-testid={`button-mute-${selectedIndex}`}
              >
                {isMuted[selectedIndex] !== false ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        ) : null}

        {/* Navigation Arrows */}
        {mediaItems.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
              onClick={prevMedia}
              data-testid="button-prev-media"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
              onClick={nextMedia}
              data-testid="button-next-media"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}

        {/* Media Type Indicator */}
        <div className="absolute top-4 left-4">
          <div className="bg-black/50 text-white text-xs px-2 py-1 rounded">
            {selectedIndex + 1} / {mediaItems.length}
            {currentMedia?.type === 'video' && (
              <span className="ml-1">📹</span>
            )}
          </div>
        </div>
      </div>

      {/* Thumbnail Navigation */}
      {mediaItems.length > 1 && (
        <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
          {mediaItems.map((media, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors",
                selectedIndex === index ? "border-primary" : "border-transparent"
              )}
              data-testid={`button-thumbnail-${index}`}
            >
              {media.type === 'image' ? (
                <img
                  src={media.url}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="relative w-full h-full bg-black">
                  <video
                    src={media.url}
                    className="w-full h-full object-cover"
                    muted
                    data-testid={`video-thumbnail-${index}`}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
              
              {/* Media type badge */}
              <div className="absolute top-1 right-1">
                {media.type === 'video' && (
                  <div className="w-3 h-3 rounded-full bg-red-500 flex items-center justify-center">
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Media Counter */}
      <div className="flex justify-center mt-2 space-x-4 text-sm text-muted-foreground">
        {images.length > 0 && (
          <span data-testid="text-image-count">
            📷 {images.length} photo{images.length > 1 ? 's' : ''}
          </span>
        )}
        {videos.length > 0 && (
          <span data-testid="text-video-count">
            🎥 {videos.length} video{videos.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}

export default MediaCarousel;