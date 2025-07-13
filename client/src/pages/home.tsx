import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Settings, Upload, FileText, User, ArrowRight, Shield, CheckCircle, BarChart3, Clock, TrendingUp, Building2, Globe, Scale } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-blue-600/5"></div>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            {/* IFSCA Branding */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium mb-6">
                <Scale className="h-4 w-4 mr-2" />
                International Financial Services Centres Authority
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                IFSCA Regulatory Reports
                <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent block">
                  Management Platform
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
                Comprehensive digital solution for GIFT City financial institutions to submit, validate, 
                and manage regulatory reports with 100% accuracy and real-time compliance monitoring.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-emerald-600" />
                  GIFT City Compliant
                </div>
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-2 text-blue-600" />
                  International Standards
                </div>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-purple-600" />
                  Enterprise Security
                </div>
              </div>
            </div>

            {/* Key Features Grid */}
            <div className="grid md:grid-cols-4 gap-6 mb-16">
              <div className="text-center p-6 bg-white/50 rounded-xl backdrop-blur-sm">
                <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">IFSCA Compliant</h3>
                <p className="text-gray-600 text-sm">Fully aligned with GIFT City regulatory requirements</p>
              </div>
              <div className="text-center p-6 bg-white/50 rounded-xl backdrop-blur-sm">
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Scale className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Regulatory Templates</h3>
                <p className="text-gray-600 text-sm">Pre-built templates for all IFSCA reporting formats</p>
              </div>
              <div className="text-center p-6 bg-white/50 rounded-xl backdrop-blur-sm">
                <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Automated Validation</h3>
                <p className="text-gray-600 text-sm">Real-time compliance checking and error detection</p>
              </div>
              <div className="text-center p-6 bg-white/50 rounded-xl backdrop-blur-sm">
                <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Audit Trail</h3>
                <p className="text-gray-600 text-sm">Complete submission history and compliance tracking</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-12">
        <div className="max-w-5xl mx-auto">
          {/* Main Access Cards */}
          <div className="grid lg:grid-cols-2 gap-6 mb-12">
            {/* Financial Institution Portal */}
            <Card className="group hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardHeader className="text-center pb-4 pt-6">
                <div className="mx-auto mb-4 h-16 w-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform duration-300">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                  Institution Portal
                </CardTitle>
                <p className="text-gray-500 text-sm">For GIFT City financial institutions</p>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <p className="text-gray-600 mb-6 text-center text-sm leading-relaxed">
                  Submit regulatory reports, track compliance status, and access real-time validation results.
                </p>
                <div className="grid grid-cols-1 gap-2 mb-6">
                  <div className="flex items-center p-2.5 bg-emerald-50 rounded-lg">
                    <FileText className="h-4 w-4 text-emerald-600 mr-2.5 flex-shrink-0" />
                    <span className="text-xs text-gray-700 font-medium">Report Submission</span>
                  </div>
                  <div className="flex items-center p-2.5 bg-emerald-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mr-2.5 flex-shrink-0" />
                    <span className="text-xs text-gray-700 font-medium">Real-time Validation</span>
                  </div>
                  <div className="flex items-center p-2.5 bg-emerald-50 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-emerald-600 mr-2.5 flex-shrink-0" />
                    <span className="text-xs text-gray-700 font-medium">Analytics Dashboard</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Link href="/user-login">
                    <Button className="w-full h-10 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium rounded-lg shadow-md shadow-emerald-500/25 transition-all duration-200 text-sm">
                      Access Portal
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/user-dashboard">
                    <Button variant="outline" className="w-full h-10 border border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-medium rounded-lg transition-all duration-200 text-sm">
                      View Demo
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* IFSCA User Console */}
            <Card className="group hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardHeader className="text-center pb-4 pt-6">
                <div className="mx-auto mb-4 h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  IFSCA User Console
                </CardTitle>
                <p className="text-gray-500 text-sm">For regulatory administrators</p>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <p className="text-gray-600 mb-6 text-center text-sm leading-relaxed">
                  Manage templates, configure validation rules, and monitor compliance submissions.
                </p>
                <div className="grid grid-cols-1 gap-2 mb-6">
                  <div className="flex items-center p-2.5 bg-blue-50 rounded-lg">
                    <Settings className="h-4 w-4 text-blue-600 mr-2.5 flex-shrink-0" />
                    <span className="text-xs text-gray-700 font-medium">Template Configuration</span>
                  </div>
                  <div className="flex items-center p-2.5 bg-blue-50 rounded-lg">
                    <BarChart3 className="h-4 w-4 text-blue-600 mr-2.5 flex-shrink-0" />
                    <span className="text-xs text-gray-700 font-medium">Compliance Monitoring</span>
                  </div>
                  <div className="flex items-center p-2.5 bg-blue-50 rounded-lg">
                    <Upload className="h-4 w-4 text-blue-600 mr-2.5 flex-shrink-0" />
                    <span className="text-xs text-gray-700 font-medium">Submission Oversight</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Link href="/admin-login">
                    <Button className="w-full h-10 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-md shadow-blue-500/25 transition-all duration-200 text-sm">
                      IFSCA Access
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/template-management">
                    <Button variant="outline" className="w-full h-10 border border-blue-300 text-blue-700 hover:bg-blue-50 font-medium rounded-lg transition-all duration-200 text-sm">
                      Manage Templates
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compact Info Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {/* Regulatory Compliance */}
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl p-6 border border-emerald-200/50">
              <div className="flex items-center mb-4">
                <Scale className="h-6 w-6 text-emerald-600 mr-3" />
                <h3 className="text-lg font-bold text-gray-900">IFSCA Compliance</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Building2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-700">GIFT City</p>
                </div>
                <div className="text-center">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Globe className="h-6 w-6 text-blue-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-700">Global Standards</p>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-6 w-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-bold text-gray-900">Platform Stats</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-emerald-600">99.9%</div>
                  <div className="text-xs text-gray-600">Uptime</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">100%</div>
                  <div className="text-xs text-gray-600">Accuracy</div>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Footer */}
          <div className="text-center">
            <p className="text-gray-500 mb-2">Ready to enhance your IFSCA regulatory reporting?</p>
            <div className="text-xs text-gray-400">
              Authorized by IFSCA | GIFT City, Gujarat, India
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}