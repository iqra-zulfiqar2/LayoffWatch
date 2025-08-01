import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingDown, Building, Users, AlertTriangle, Eye, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Import the existing enhanced homepage content
import EnhancedHomepage from "@/pages/enhanced-homepage";

export default function LayoffTracker() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Tools</span>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Layoff Tracker</h1>
                <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
                  Popular
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/pricing">
                <Button variant="outline">
                  Upgrade
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Tool Description Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-b bg-white/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Stay Ahead of Layoffs
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Monitor layoff activities at companies with real-time tracking, comprehensive analytics, 
            and personalized notifications to protect your career.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <Building className="w-8 h-8 mx-auto mb-3 text-blue-500" />
              <h3 className="font-semibold mb-2">80+ Companies</h3>
              <p className="text-sm text-gray-600">Fortune 500 database</p>
            </div>
            <div className="text-center">
              <TrendingDown className="w-8 h-8 mx-auto mb-3 text-red-500" />
              <h3 className="font-semibold mb-2">Real-time Data</h3>
              <p className="text-sm text-gray-600">Live layoff tracking</p>
            </div>
            <div className="text-center">
              <Eye className="w-8 h-8 mx-auto mb-3 text-purple-500" />
              <h3 className="font-semibold mb-2">Smart Alerts</h3>
              <p className="text-sm text-gray-600">Personalized notifications</p>
            </div>
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-3 text-green-500" />
              <h3 className="font-semibold mb-2">AI Insights</h3>
              <p className="text-sm text-gray-600">Risk analysis</p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Homepage Content */}
      <div className="relative">
        <EnhancedHomepage />
      </div>

      {/* Tool-specific Footer */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-red-500 to-orange-500">
        <div className="max-w-4xl mx-auto text-center text-white">
          <TrendingDown className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-6">
            Never Be Caught Off Guard
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of professionals who stay informed about industry layoffs and protect their careers
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100 text-lg px-8 py-6">
              Start Tracking Free
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-red-600 text-lg px-8 py-6">
              View All Tools
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}