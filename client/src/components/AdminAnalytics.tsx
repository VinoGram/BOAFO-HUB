import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Briefcase, DollarSign, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export function AdminAnalytics() {
  // Mock data for analytics - in production, this would come from trpc.admin.getStats
  const stats = {
    activeUsers: 1250,
    completedJobs: 847,
    totalRevenue: 125400,
    averageRating: 4.7,
    pendingVerifications: 23,
    openDisputes: 5,
    verifiedProviders: 342,
  };
  const isLoading = false;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const chartData = [
    { name: "Week 1", jobs: 45, revenue: 4500 },
    { name: "Week 2", jobs: 52, revenue: 5200 },
    { name: "Week 3", jobs: 48, revenue: 4800 },
    { name: "Week 4", jobs: 61, revenue: 6100 },
  ];

  const categoryData = [
    { name: "Plumbing", value: 28, color: "#0ea5e9" },
    { name: "Electrical", value: 22, color: "#f97316" },
    { name: "HVAC", value: 18, color: "#10b981" },
    { name: "Carpentry", value: 15, color: "#8b5cf6" },
    { name: "Other", value: 17, color: "#6b7280" },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Active Users</p>
              <p className="text-3xl font-bold">{(stats as any).activeUsers || 0}</p>
              <p className="text-xs text-green-500 mt-2">+12% from last month</p>
            </div>
            <Users className="w-12 h-12 text-accent opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Completed Jobs</p>
              <p className="text-3xl font-bold">{(stats as any).completedJobs || 0}</p>
              <p className="text-xs text-green-500 mt-2">+8% from last month</p>
            </div>
            <Briefcase className="w-12 h-12 text-accent opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
              <p className="text-3xl font-bold">${((stats as any).totalRevenue || 0).toLocaleString()}</p>
              <p className="text-xs text-green-500 mt-2">+15% from last month</p>
            </div>
            <DollarSign className="w-12 h-12 text-accent opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg. Rating</p>
              <p className="text-3xl font-bold">{((stats as any).averageRating || 0).toFixed(1)}</p>
              <p className="text-xs text-green-500 mt-2">Excellent</p>
            </div>
            <TrendingUp className="w-12 h-12 text-accent opacity-20" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs & Revenue Trend */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Jobs & Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }} />
              <Legend />
              <Line type="monotone" dataKey="jobs" stroke="#0ea5e9" strokeWidth={2} />
              <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Jobs by Category */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Jobs by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Pending Verifications</h3>
            <AlertCircle className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold mb-2">{(stats as any).pendingVerifications || 0}</p>
          <p className="text-sm text-muted-foreground">Awaiting review</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Open Disputes</h3>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold mb-2">{(stats as any).openDisputes || 0}</p>
          <p className="text-sm text-muted-foreground">Require resolution</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Verified Providers</h3>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold mb-2">{(stats as any).verifiedProviders || 0}</p>
          <p className="text-sm text-muted-foreground">Active on platform</p>
        </Card>
      </div>

      {/* Top Performers */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Top Providers This Month</h3>
        <div className="space-y-3">
          {[
            { name: "John Smith", category: "Plumbing", jobs: 12, rating: 4.9 },
            { name: "Sarah Johnson", category: "Electrical", jobs: 10, rating: 4.8 },
            { name: "Mike Davis", category: "HVAC", jobs: 9, rating: 4.7 },
            { name: "Lisa Brown", category: "Carpentry", jobs: 8, rating: 4.6 },
            { name: "Tom Wilson", category: "Plumbing", jobs: 7, rating: 4.5 },
          ].map((provider, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded">
              <div className="flex-1">
                <p className="font-semibold text-sm">{provider.name}</p>
                <p className="text-xs text-muted-foreground">{provider.category}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="outline">{provider.jobs} jobs</Badge>
                <Badge variant="outline">{provider.rating}★</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
