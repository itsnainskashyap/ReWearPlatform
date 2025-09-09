import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Calendar, User, ArrowRight, BookOpen } from "lucide-react";
import { useLocation } from "wouter";

export default function Blog() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const blogPosts = [
    {
      id: 1,
      title: "The Rise of Sustainable Fashion: Why Thrift Shopping is the Future",
      excerpt: "Discover how thrift shopping is revolutionizing the fashion industry and helping reduce textile waste...",
      author: "Nains",
      date: "2024-01-15",
      category: "Sustainability",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=60",
      featured: true
    },
    {
      id: 2,
      title: "How to Style Vintage Pieces for Modern Looks",
      excerpt: "Learn the art of mixing vintage finds with contemporary fashion to create unique, stylish outfits...",
      author: "ReWeara Team",
      date: "2024-01-10",
      category: "Style Tips",
      readTime: "7 min read",
      image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&auto=format&fit=crop&q=60"
    },
    {
      id: 3,
      title: "The Environmental Impact of Fast Fashion",
      excerpt: "Understanding the true cost of fast fashion on our planet and how we can make better choices...",
      author: "Nains",
      date: "2024-01-05",
      category: "Environment",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=60"
    },
    {
      id: 4,
      title: "Building a Capsule Wardrobe with Thrift Finds",
      excerpt: "Create a timeless, versatile wardrobe using carefully selected thrift pieces that work together...",
      author: "ReWeara Team",
      date: "2024-01-01",
      category: "Wardrobe",
      readTime: "8 min read",
      image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&auto=format&fit=crop&q=60"
    }
  ];

  const categories = ["All", "Sustainability", "Style Tips", "Environment", "Wardrobe"];

  const filteredPosts = searchQuery
    ? blogPosts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : blogPosts;

  const featuredPost = blogPosts.find(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 glassmorphism border-b border-white/20 p-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="hover-lift rounded-2xl"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold gradient-text">ReWeara Journal</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 animate-fadeInUp">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-3">Stories & Insights</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Discover the latest trends, sustainability tips, and fashion insights from the ReWeara community
            </p>
          </div>
        </div>

        {/* Search & Categories */}
        <div className="space-y-4">
          <div className="relative animate-slideInLeft">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="search"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-2xl glassmorphism border-white/20"
            />
          </div>

          <div className="flex flex-wrap gap-2 animate-slideInRight">
            {categories.map((category, index) => (
              <Badge
                key={index}
                variant="outline"
                className="rounded-full px-4 py-2 cursor-pointer hover:bg-primary/10 transition-colors"
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Featured Article */}
        {featuredPost && !searchQuery && (
          <Card className="card-premium rounded-3xl overflow-hidden animate-scaleIn">
            <div className="relative">
              <img
                src={featuredPost.image}
                alt={featuredPost.title}
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <Badge className="absolute top-4 left-4 bg-accent/90 text-accent-foreground">
                Featured
              </Badge>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <Badge className="mb-2 bg-white/20 text-white border-0">
                  {featuredPost.category}
                </Badge>
                <h3 className="text-xl font-bold mb-2">{featuredPost.title}</h3>
                <p className="text-sm opacity-90 mb-3">{featuredPost.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs">
                    <User className="w-4 h-4" />
                    <span>{featuredPost.author}</span>
                    <span>•</span>
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(featuredPost.date).toLocaleDateString()}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    Read More
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Blog Posts Grid */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold">
            {searchQuery ? `Search Results (${filteredPosts.length})` : "Latest Articles"}
          </h3>
          
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(searchQuery ? filteredPosts : regularPosts).map((post, index) => (
                <Card
                  key={post.id}
                  className="card-premium rounded-2xl overflow-hidden hover-lift animate-slideInUp"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-48 object-cover"
                    />
                    <Badge className="absolute top-3 left-3 bg-primary/10 text-primary border-primary/20">
                      {post.category}
                    </Badge>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h4 className="font-bold text-lg mb-2 line-clamp-2">{post.title}</h4>
                      <p className="text-muted-foreground text-sm line-clamp-3">{post.excerpt}</p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(post.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{post.readTime}</span>
                    </div>
                    
                    <Button variant="ghost" className="w-full justify-between rounded-xl">
                      Read Article
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 animate-fadeInUp">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No articles found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or explore our categories
              </p>
              <Button
                onClick={() => setSearchQuery("")}
                variant="outline"
                className="rounded-2xl"
              >
                Clear Search
              </Button>
            </div>
          )}
        </div>

        {/* Newsletter Signup */}
        <Card className="card-premium rounded-3xl bg-gradient-to-r from-primary/5 to-accent/5 animate-scaleIn">
          <CardContent className="p-6 text-center space-y-4">
            <h3 className="text-xl font-bold">Stay Updated</h3>
            <p className="text-muted-foreground">
              Get the latest articles and sustainable fashion tips delivered to your inbox
            </p>
            <div className="flex max-w-sm mx-auto space-x-2">
              <Input
                placeholder="Enter your email"
                className="rounded-xl"
              />
              <Button className="bg-gradient-to-r from-accent to-accent/90 text-accent-foreground rounded-xl px-6">
                Subscribe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}