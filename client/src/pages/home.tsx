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
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-6xl mx-auto">

          {/* Main Access Cards */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            {/* Financial Institution Portal */}
            <Card className="group hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6 pt-8">
                <div className="mx-auto mb-6 h-20 w-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                  Institution Portal
                </CardTitle>
                <p className="text-gray-500 mt-2">For GIFT City financial institutions</p>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <p className="text-gray-600 mb-8 text-center leading-relaxed">
                  Submit regulatory reports, track compliance status, and access real-time validation results 
                  for all IFSCA mandatory reporting requirements.
                </p>
                <div className="grid grid-cols-1 gap-4 mb-8">
                  <div className="flex items-center p-3 bg-emerald-50 rounded-lg">
                    <FileText className="h-5 w-5 text-emerald-600 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">Quarterly & Annual Report Submission</span>
                  </div>
                  <div className="flex items-center p-3 bg-emerald-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">Real-time Compliance Validation</span>
                  </div>
                  <div className="flex items-center p-3 bg-emerald-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-emerald-600 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">Submission History & Analytics</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Link href="/user-login">
                    <Button className="w-full h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold rounded-lg shadow-lg shadow-emerald-500/25 transition-all duration-200">
                      Access Institution Portal
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/user-dashboard">
                    <Button variant="outline" className="w-full h-12 border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold rounded-lg transition-all duration-200">
                      View Demo Dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* IFSCA Admin Console */}
            <Card className="group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6 pt-8">
                <div className="mx-auto mb-6 h-20 w-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  IFSCA Admin Console
                </CardTitle>
                <p className="text-gray-500 mt-2">For regulatory administrators</p>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <p className="text-gray-600 mb-8 text-center leading-relaxed">
                  Manage regulatory templates, configure validation rules, monitor compliance submissions, 
                  and oversee the entire GIFT City financial reporting ecosystem.
                </p>
                <div className="grid grid-cols-1 gap-4 mb-8">
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <Settings className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">Regulatory Template Configuration</span>
                  </div>
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">GIFT City Compliance Monitoring</span>
                  </div>
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <Upload className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">Institution Submission Oversight</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Link href="/admin-login">
                    <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/25 transition-all duration-200">
                      IFSCA Admin Access
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/template-management">
                    <Button variant="outline" className="w-full h-12 border-2 border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold rounded-lg transition-all duration-200">
                      Manage Templates
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* IFSCA Regulatory Information */}
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-8 border border-emerald-200/50 mb-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">GIFT City Regulatory Compliance</h3>
              <p className="text-gray-600">Supporting IFSCA's vision for world-class financial services</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="h-16 w-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Scale className="h-8 w-8 text-emerald-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">IFSCA Authorized</h4>
                <p className="text-sm text-gray-600">Fully compliant with International Financial Services Centres Authority regulations</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">GIFT City Integration</h4>
                <p className="text-sm text-gray-600">Seamless integration with Gujarat International Finance Tec-City infrastructure</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Global Standards</h4>
                <p className="text-sm text-gray-600">Aligned with international financial reporting and regulatory standards</p>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Platform Performance</h3>
              <p className="text-gray-600">Reliable infrastructure for critical regulatory reporting</p>
            </div>
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-emerald-600 mb-2">99.9%</div>
                <div className="text-sm text-gray-600">System Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
                <div className="text-sm text-gray-600">Validation Accuracy</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">24/7</div>
                <div className="text-sm text-gray-600">Support Coverage</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600 mb-2">{"<"}2s</div>
                <div className="text-sm text-gray-600">Report Processing</div>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="text-center mt-16">
            <p className="text-gray-500 text-lg">
              Ready to enhance your IFSCA regulatory reporting?
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Choose your portal above to access the comprehensive compliance platform
            </p>
            <div className="mt-6 text-xs text-gray-400">
              Authorized by International Financial Services Centres Authority (IFSCA) | GIFT City, Gujarat, India
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}