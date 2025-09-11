import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  ShoppingCart, 
  Clock,
  DollarSign,
  Activity,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { InventoryDashboard as DashboardType, StockAlert, StockMovement } from '../../types/inventory';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { inventoryAPI } from '../../services/api';

interface InventoryDashboardProps {
  className?: string;
}

export default function InventoryDashboard({ className = '' }: InventoryDashboardProps) {
  const [dashboard, setDashboard] = useState<DashboardType | null>(null);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [dashboardData, alertsData] = await Promise.all([
        inventoryAPI.getDashboard(),
        inventoryAPI.getAlerts({ status: 'ACTIVE' })
      ]);

      setDashboard(dashboardData);
      setAlerts(alertsData.alerts || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshDashboard = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'CRITICAL': return 'destructive';
      case 'LOW': return 'warning';
      case 'NORMAL': return 'secondary';
      default: return 'outline';
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'LOW_STOCK':
      case 'REORDER_POINT':
        return <AlertTriangle className="h-4 w-4" />;
      case 'OVERSTOCK':
        return <Package className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'OUT':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'RESERVATION':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'RELEASE':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      case 'ADJUSTMENT':
        return <RefreshCw className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load inventory dashboard. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const stats = dashboard.stats;
  const stockHealthPercentage = stats.total_materials > 0 
    ? Math.round(((stats.total_materials - stats.low_stock_items) / stats.total_materials) * 100)
    : 100;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory Dashboard</h2>
          <p className="text-muted-foreground">Monitor stock levels, alerts, and material flow</p>
        </div>
        <Button
          onClick={refreshDashboard}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_materials}</div>
            <p className="text-xs text-muted-foreground">
              Active inventory items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockHealthPercentage}%</div>
            <Progress value={stockHealthPercentage} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.low_stock_items} items need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_stock_value)}</div>
            <p className="text-xs text-muted-foreground">
              Total inventory worth
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.active_alerts}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {alerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="movements">Recent Activity</TabsTrigger>
          <TabsTrigger value="jobs">Job Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Stock Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stock Status Overview</CardTitle>
                <CardDescription>Material availability across categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Normal Stock</span>
                    </div>
                    <Badge variant="outline">
                      {stats.total_materials - stats.low_stock_items - stats.reorder_items}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Reorder Level</span>
                    </div>
                    <Badge variant="outline">{stats.reorder_items}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Low Stock</span>
                    </div>
                    <Badge variant="destructive">{stats.low_stock_items}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Common inventory operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Package className="h-4 w-4 mr-2" />
                  View Low Stock Items
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Create Purchase Request
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Receive Stock
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Activity className="h-4 w-4 mr-2" />
                  Stock Adjustment
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stock Alerts</CardTitle>
              <CardDescription>Items requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">No active alerts. All stock levels are healthy!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getAlertTypeIcon(alert.alert_type)}
                        <div>
                          <p className="font-medium">{alert.material_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Current: {alert.current_level} | Threshold: {alert.threshold_level}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          alert.alert_type === 'LOW_STOCK' ? 'destructive' : 'secondary'
                        }>
                          {alert.alert_type.replace('_', ' ')}
                        </Badge>
                        <Button size="sm" variant="outline">
                          Acknowledge
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Stock Movements</CardTitle>
              <CardDescription>Latest inventory transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboard.recent_movements.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-muted-foreground">No recent stock movements</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboard.recent_movements.map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getMovementIcon(movement.movement_type)}
                        <div>
                          <p className="font-medium">{movement.material_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {movement.movement_type} - {movement.quantity} {movement.reference_type && `(${movement.reference_type})`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatDate(movement.performed_at)}</p>
                        <p className="text-xs text-muted-foreground">{movement.performed_by_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Queue</CardTitle>
              <CardDescription>Jobs pending inventory approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-muted-foreground">Job queue will be loaded here</p>
                <Button variant="outline" className="mt-2">
                  View Pending Jobs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}