import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Clock, Wifi, WifiOff, RefreshCw, Activity } from "lucide-react";

interface APIProvider {
  name: string;
  configured: boolean;
  status: 'active' | 'inactive' | 'error' | 'testing';
  description: string;
  lastTest?: string;
  responseTime?: number;
  errorCount?: number;
}

export default function APIHealthMonitor() {
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  // Fetch providers status
  const { data: providers = [], refetch, isLoading } = useQuery<APIProvider[]>({
    queryKey: ['/api/ai-providers'],
    refetchInterval: 30000, // Check every 30 seconds
  });

  const testProvider = async (providerName: string) => {
    setTestResults(prev => ({ ...prev, [providerName]: { testing: true } }));
    
    try {
      const response = await apiRequest('POST', '/api/test-ai-provider', {
        provider: providerName,
        message: "اختبار سريع",
        emotions: { happy: 70, neutral: 30 }
      });

      const result = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        [providerName]: {
          success: result.success,
          responseTime: result.responseTime || 0,
          provider: result.provider,
          error: result.error,
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [providerName]: {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }));
    }
  };

  const testAllProviders = async () => {
    setIsTestingAll(true);
    setTestResults({});
    
    for (const provider of providers) {
      if (provider.configured) {
        await testProvider(provider.name);
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    setIsTestingAll(false);
  };

  const getStatusIcon = (provider: APIProvider) => {
    const testResult = testResults[provider.name];
    
    if (testResult?.testing || isTestingAll) {
      return <RefreshCw className="w-4 h-4 animate-spin text-info" />;
    }
    
    if (testResult) {
      return testResult.success 
        ? <CheckCircle className="w-4 h-4 text-success" />
        : <XCircle className="w-4 h-4 text-destructive" />;
    }
    
    return provider.configured 
      ? <Wifi className="w-4 h-4 text-primary" />
      : <WifiOff className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusBadge = (provider: APIProvider) => {
    const testResult = testResults[provider.name];
    
    if (testResult?.testing || isTestingAll) {
      return <Badge variant="secondary" className="text-xs">جاري الاختبار...</Badge>;
    }
    
    if (testResult) {
      return testResult.success 
        ? <Badge variant="default" className="text-xs bg-success">يعمل ✓</Badge>
        : <Badge variant="destructive" className="text-xs">خطأ ✗</Badge>;
    }
    
    return provider.configured 
      ? <Badge variant="outline" className="text-xs">جاهز</Badge>
      : <Badge variant="secondary" className="text-xs">غير مُعد</Badge>;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="button-modern border-info/50 text-info hover:bg-info/20">
          <Activity className="w-4 h-4 ml-2" />
          حالة API
        </Button>
      </DialogTrigger>
      <DialogContent className="glassmorphism border-white/20 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-gradient flex items-center gap-2">
            <Activity className="w-5 h-5" />
            مراقب حالة مزودي الذكاء الاصطناعي
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Test All Button */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              آخر فحص: {new Date().toLocaleTimeString('ar-SA')}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => refetch()}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
              <Button
                onClick={testAllProviders}
                disabled={isTestingAll}
                size="sm"
                className="button-modern bg-gradient-to-r from-primary to-secondary"
              >
                <CheckCircle className="w-4 h-4 ml-2" />
                {isTestingAll ? "جاري الاختبار..." : "اختبار الكل"}
              </Button>
            </div>
          </div>

          {/* Progress Bar for Testing */}
          {isTestingAll && (
            <div className="space-y-2">
              <Progress value={Math.random() * 100} className="w-full" />
              <p className="text-xs text-center text-muted-foreground">
                جاري اختبار جميع المزودين...
              </p>
            </div>
          )}

          {/* Providers List */}
          <div className="space-y-3">
            {providers.map((provider) => {
              const testResult = testResults[provider.name];
              
              return (
                <div
                  key={provider.name}
                  className="p-4 rounded-lg border border-border/50 bg-muted/20 card-hover"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(provider)}
                      <div>
                        <h4 className="font-medium text-foreground">
                          {provider.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {provider.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(provider)}
                      <Button
                        onClick={() => testProvider(provider.name)}
                        variant="outline"
                        size="sm"
                        disabled={!provider.configured || testResult?.testing}
                      >
                        اختبار
                      </Button>
                    </div>
                  </div>

                  {/* Test Results */}
                  {testResult && !testResult.testing && (
                    <div className="mt-3 p-3 rounded-md bg-background/50">
                      {testResult.success ? (
                        <div className="space-y-1">
                          <p className="text-xs text-success">
                            ✓ نجح الاختبار - المزود: {testResult.provider}
                          </p>
                          {testResult.responseTime && (
                            <p className="text-xs text-muted-foreground">
                              زمن الاستجابة: {testResult.responseTime}ms
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-destructive">
                          ✗ فشل الاختبار: {testResult.error}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(testResult.timestamp).toLocaleTimeString('ar-SA')}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">ملخص الحالة</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>المزودين المتاحين: {providers.filter(p => p.configured).length}</p>
              <p>المزودين العاملين: {Object.values(testResults).filter(r => r.success).length}</p>
              <p>معدل النجاح: {providers.length > 0 ? Math.round((Object.values(testResults).filter(r => r.success).length / providers.filter(p => p.configured).length) * 100) || 0 : 0}%</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}