import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Briefcase, MapPin, Clock, Users, Heart, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

export default function Careers() {
  const [, navigate] = useLocation();

  const jobOpenings = [
    {
      id: 1,
      title: "Fashion Curator",
      department: "Product",
      location: "Remote",
      type: "Full-time",
      description: "Help us curate the best thrift finds and work with our design team on ReWeara Originals.",
      requirements: ["Fashion background or strong personal style", "Eye for quality and trends", "Experience in fashion retail or styling"]
    },
    {
      id: 2,
      title: "Sustainability Specialist",
      department: "Operations",
      location: "India",
      type: "Full-time",
      description: "Lead our sustainability initiatives and ensure our processes align with our environmental values.",
      requirements: ["Background in environmental science or sustainability", "Experience with supply chain management", "Passion for sustainable fashion"]
    },
    {
      id: 3,
      title: "Customer Experience Associate",
      department: "Support",
      location: "Remote",
      type: "Part-time",
      description: "Provide exceptional customer service and help our community with their fashion journey.",
      requirements: ["Excellent communication skills", "Customer service experience", "Knowledge of fashion and styling"]
    }
  ];

  const benefits = [
    {
      icon: Heart,
      title: "Health & Wellness",
      description: "Comprehensive health insurance and wellness programs"
    },
    {
      icon: Sparkles,
      title: "Learning Budget",
      description: "Annual budget for courses, conferences, and skill development"
    },
    {
      icon: Users,
      title: "Flexible Work",
      description: "Remote-first culture with flexible working hours"
    },
    {
      icon: Briefcase,
      title: "Fashion Allowance",
      description: "Monthly allowance to shop from our collections"
    }
  ];

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
          <h1 className="text-2xl font-bold gradient-text">Careers</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 animate-fadeInUp">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center mx-auto">
            <Briefcase className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-3">Join the ReWeara Team</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Help us build the future of sustainable fashion. Be part of a team that's making a real difference.
            </p>
          </div>
        </div>

        {/* Company Culture */}
        <Card className="card-premium rounded-3xl bg-gradient-to-r from-primary/5 to-accent/5 animate-slideInLeft">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-2xl font-bold text-center">Why ReWeara?</h3>
            <p className="text-muted-foreground text-center leading-relaxed">
              We're not just building a fashion platform - we're creating a movement towards conscious consumption. 
              Join a team that values creativity, sustainability, and making a positive impact on the planet.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Job Openings */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-center">Open Positions</h3>
          {jobOpenings.length > 0 ? (
            <div className="space-y-4">
              {jobOpenings.map((job, index) => (
                <Card
                  key={job.id}
                  className="card-premium rounded-2xl hover-lift animate-slideInRight"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Briefcase className="w-4 h-4 mr-1" />
                            {job.department}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {job.location}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {job.type}
                          </span>
                        </div>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        New
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{job.description}</p>
                    <div>
                      <h5 className="font-semibold mb-2">Requirements:</h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {job.requirements.map((req, reqIndex) => (
                          <li key={reqIndex}>{req}</li>
                        ))}
                      </ul>
                    </div>
                    <Button
                      onClick={() => navigate("/contact")}
                      className="w-full bg-gradient-to-r from-accent to-accent/90 text-accent-foreground rounded-2xl"
                    >
                      Apply Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="card-premium rounded-3xl animate-scaleIn">
              <CardContent className="p-12 text-center space-y-4">
                <Briefcase className="w-16 h-16 text-muted-foreground mx-auto" />
                <h3 className="text-xl font-bold">No Open Positions</h3>
                <p className="text-muted-foreground">
                  We don't have any open positions right now, but we're always looking for talented people. 
                  Send us your resume and we'll keep you in mind for future opportunities.
                </p>
                <Button
                  onClick={() => navigate("/contact")}
                  variant="outline"
                  className="rounded-2xl"
                >
                  Send Your Resume
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Application Process */}
        <Card className="card-premium rounded-3xl animate-fadeInUp">
          <CardHeader>
            <CardTitle>Application Process</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h4 className="font-semibold mb-2">Apply</h4>
                <p className="text-sm text-muted-foreground">Send us your resume and cover letter through our contact form</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h4 className="font-semibold mb-2">Interview</h4>
                <p className="text-sm text-muted-foreground">If selected, we'll schedule a video call to get to know you better</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h4 className="font-semibold mb-2">Welcome</h4>
                <p className="text-sm text-muted-foreground">Join our team and start making a difference in sustainable fashion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}