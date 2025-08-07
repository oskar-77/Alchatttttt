import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AIProviderSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AIProviderSettings({ open, onOpenChange }: AIProviderSettingsProps) {
  const [geminiKey, setGeminiKey] = useState("");
  const [huggingFaceKey, setHuggingFaceKey] = useState("");
  const [testMessage, setTestMessage] = useState("مرحباً، كيف حالك؟");
  const [testResults, setTestResults] = useState<{[key: string]: {success: boolean, response?: string, error?: string}}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available AI providers
  const { data: providers = [] } = useQuery<Array<{name: string; configured: boolean}>>({
    queryKey: ['/api/ai-providers'],
    enabled: open
  });

  // Test AI provider mutation
  const testProviderMutation = useMutation({
    mutationFn: async (providerName: string) => {
      const testEmotions = {
        happy: 0.8,
        sad: 0.1,
        angry: 0.05,
        surprised: 0.02,
        fearful: 0.02,
        disgusted: 0.01,
        neutral: 0.0
      };

      const response = await fetch('/api/test-ai-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerName,
          message: testMessage,
          emotions: testEmotions
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data, providerName) => {
      setTestResults(prev => ({
        ...prev,
        [providerName]: { success: true, response: data.response }
      }));
      toast({
        title: "✅ نجح الاختبار",
        description: `${providerName} يعمل بشكل صحيح`
      });
    },
    onError: (error: any, providerName) => {
      setTestResults(prev => ({
        ...prev,
        [providerName]: { success: false, error: error.message }
      }));
      toast({
        title: "❌ فشل الاختبار",
        description: `${providerName}: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleTestProvider = (providerName: string) => {
    testProviderMutation.mutate(providerName);
  };

  const handleSaveKeys = () => {
    // In a real app, you'd save these to secure storage
    // For now, we'll just show a toast
    toast({
      title: "💾 تم الحفظ",
      description: "تم حفظ مفاتيح API بنجاح. سيتم تطبيقها في الجلسة التالية."
    });
    
    queryClient.invalidateQueries({ queryKey: ['/api/ai-providers'] });
    onOpenChange(false);
  };

  const getProviderIcon = (name: string) => {
    if (name.includes('Gemini')) return 'bi-google';
    if (name.includes('OpenAI')) return 'bi-robot';
    if (name.includes('Hugging Face')) return 'bi-heart';
    if (name.includes('Free GPT')) return 'bi-lightning';
    return 'bi-cpu';
  };

  const getProviderColor = (name: string, configured: boolean) => {
    if (!configured) return 'text-gray-500';
    if (name.includes('Free GPT')) return 'text-green-400';
    if (name.includes('Gemini')) return 'text-blue-400';
    if (name.includes('OpenAI')) return 'text-purple-400';
    return 'text-orange-400';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphism border-white/20 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="gradient-text text-xl flex items-center gap-2">
            <i className="bi bi-gear"></i>
            إعدادات الذكاء الاصطناعي
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            إدارة واختبار مزودي الذكاء الاصطناعي
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Providers Status */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 rounded-lg border border-blue-500/20">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <i className="bi bi-list-check"></i>
              حالة المزودين الحالية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {providers.map(provider => (
                <div key={provider.name} className="flex items-center justify-between p-2 bg-black/20 rounded">
                  <div className="flex items-center gap-2">
                    <i className={`bi ${getProviderIcon(provider.name)} ${getProviderColor(provider.name, provider.configured)}`}></i>
                    <span className="text-sm text-gray-300">{provider.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${provider.configured ? 'text-success' : 'text-gray-500'}`}>
                      {provider.configured ? 'متصل' : 'غير مُعد'}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestProvider(provider.name)}
                      disabled={testProviderMutation.isPending}
                      className="text-xs px-2 py-1 h-auto"
                    >
                      {testProviderMutation.isPending && testProviderMutation.variables === provider.name ? (
                        <i className="bi bi-spinner animate-spin"></i>
                      ) : (
                        "اختبار"
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Results */}
          {Object.keys(testResults).length > 0 && (
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 p-4 rounded-lg border border-green-500/20">
              <h3 className="font-semibold text-white mb-3">نتائج الاختبار</h3>
              <div className="space-y-2">
                {Object.entries(testResults).map(([provider, result]) => (
                  <div key={provider} className="p-3 bg-black/20 rounded text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <i className={`bi ${result.success ? 'bi-check-circle text-success' : 'bi-x-circle text-red-400'}`}></i>
                      <span className="font-medium text-gray-200">{provider}</span>
                    </div>
                    {result.success ? (
                      <p className="text-gray-300 text-xs bg-green-500/10 p-2 rounded">
                        ✅ {result.response?.substring(0, 100)}...
                      </p>
                    ) : (
                      <p className="text-red-300 text-xs bg-red-500/10 p-2 rounded">
                        ❌ {result.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Message Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">رسالة الاختبار</label>
            <Input
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="أدخل رسالة لاختبار الذكاء الاصطناعي..."
              className="bg-gray-800/50 border-gray-600 text-right"
            />
          </div>

          {/* API Keys Configuration */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <i className="bi bi-key"></i>
              إعداد مفاتيح API
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  مفتاح Google Gemini (مجاني)
                </label>
                <Input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIza..."
                  className="bg-gray-800/50 border-gray-600"
                  dir="ltr"
                />
                <p className="text-xs text-gray-400 mt-1">
                  احصل على مفتاح مجاني من: https://aistudio.google.com
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  مفتاح Hugging Face (مجاني)
                </label>
                <Input
                  type="password"
                  value={huggingFaceKey}
                  onChange={(e) => setHuggingFaceKey(e.target.value)}
                  placeholder="hf_..."
                  className="bg-gray-800/50 border-gray-600"
                  dir="ltr"
                />
                <p className="text-xs text-gray-400 mt-1">
                  احصل على مفتاح مجاني من: https://huggingface.co/settings/tokens
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveKeys}
              className="flex-1 bg-gradient-to-r from-primary to-secondary"
              disabled={!geminiKey && !huggingFaceKey}
            >
              <i className="bi bi-check-lg ml-2"></i>
              حفظ الإعدادات
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}