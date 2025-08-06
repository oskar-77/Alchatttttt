import { useQuery } from "@tanstack/react-query";

interface ProviderStatusProps {
  className?: string;
}

export default function ProviderStatus({ className = "" }: ProviderStatusProps) {
  const { data: providers = [] } = useQuery<Array<{name: string; configured: boolean}>>({
    queryKey: ['/api/ai-providers'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const configuredProviders = providers.filter(p => p.configured);
  
  if (configuredProviders.length === 0) {
    return (
      <div className={`text-xs text-orange-400 flex items-center gap-1 ${className}`}>
        <i className="bi bi-exclamation-triangle"></i>
        <span>ذكاء محلي فقط</span>
      </div>
    );
  }

  return (
    <div className={`text-xs text-success flex items-center gap-1 ${className}`}>
      <i className="bi bi-check-circle-fill"></i>
      <span>{configuredProviders[0].name}</span>
    </div>
  );
}