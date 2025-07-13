import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Settings, Upload, FileText, User, ArrowRight, Shield, CheckCircle, BarChart3, Clock, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
                <CheckCircle className="h-4 w-4 mr-2" />
                Enterprise-Grade Validation Platform
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Financial Template
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block">
                  Validation System
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Streamline your financial reporting with AI-powered validation, comprehensive analytics, 
                and enterprise-grade security for Excel and CSV templates.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="text-center p-6">
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">100% Accurate</h3>
                <p className="text-gray-600 text-sm">Rules-based validation ensures perfect accuracy every time</p>
              </div>
              <div className="text-center p-6">
                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Real-time Processing</h3>
                <p className="text-gray-600 text-sm">Instant validation results with progress tracking</p>
              </div>
              <div className="text-center p-6">
                <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
                <p className="text-gray-600 text-sm">Comprehensive insights and performance metrics</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-6xl mx-auto">

          {/* Main Navigation Cards */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* User Dashboard Card */}
            <Card className="group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6 pt-8">
                <div className="mx-auto mb-6 h-20 w-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                  <User className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  User Portal
                </CardTitle>
                <p className="text-gray-500 mt-2">For financial teams and analysts</p>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <p className="text-gray-600 mb-8 text-center leading-relaxed">
                  Submit templates for validation, track your submission history, and access comprehensive analytics with real-time performance insights.
                </p>
                <div className="grid grid-cols-1 gap-4 mb-8">
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">Performance Analytics Dashboard</span>
                  </div>
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">Submission History & Downloads</span>
                  </div>
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">Real-time Validation Results</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Link href="/user-login">
                    <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/25 transition-all duration-200">
                      Access User Portal
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/user-dashboard">
                    <Button variant="outline" className="w-full h-12 border-2 border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold rounded-lg transition-all duration-200">
                      Try Demo Mode
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Admin Dashboard Card */}
            <Card className="group hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6 pt-8">
                <div className="mx-auto mb-6 h-20 w-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/25 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                  Admin Console
                </CardTitle>
                <p className="text-gray-500 mt-2">For system administrators</p>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <p className="text-gray-600 mb-8 text-center leading-relaxed">
                  Manage templates, monitor system performance, and oversee all user submissions with enterprise-grade administrative tools.
                </p>
                <div className="grid grid-cols-1 gap-4 mb-8">
                  <div className="flex items-center p-3 bg-red-50 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">System-wide Analytics</span>
                  </div>
                  <div className="flex items-center p-3 bg-red-50 rounded-lg">
                    <Settings className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">Template Management</span>
                  </div>
                  <div className="flex items-center p-3 bg-red-50 rounded-lg">
                    <Upload className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">Submission Oversight</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Link href="/admin-login">
                    <Button className="w-full h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg shadow-lg shadow-red-500/25 transition-all duration-200">
                      Admin Access
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/template-management">
                    <Button variant="outline" className="w-full h-12 border-2 border-red-200 text-red-700 hover:bg-red-50 font-semibold rounded-lg transition-all duration-200">
                      Template Management
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trust Indicators */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Trusted by Finance Teams</h3>
              <p className="text-gray-600">Enterprise-grade security and reliability</p>
            </div>
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">99.9%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 mb-2">100%</div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">1M+</div>
                <div className="text-sm text-gray-600">Validations</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600 mb-2">{"<"}1s</div>
                <div className="text-sm text-gray-600">Response Time</div>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="text-center mt-16">
            <p className="text-gray-500 text-lg">
              Ready to streamline your financial validation process?
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Choose your access level above to get started
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}