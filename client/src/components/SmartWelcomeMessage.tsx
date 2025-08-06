import { useQuery } from "@tanstack/react-query";

interface SmartWelcomeMessageProps {
  userName: string;
}

export default function SmartWelcomeMessage({ userName }: SmartWelcomeMessageProps) {
  const { data: providers = [] } = useQuery<Array<{name: string; configured: boolean}>>({
    queryKey: ['/api/ai-providers']
  });

  const hasAI = providers.some(p => p.configured);
  const primaryProvider = providers.find(p => p.configured);

  return (
    <div className="chat-bubble-ai p-4 max-w-md">
      <p className="text-gray-100">
        مرحباً {userName.startsWith('ضيف_') ? '' : userName}! 🤖 أنا مساعدك العاطفي الذكي.
        
        {hasAI ? (
          <>
            <br/><br/>✨ نظام ذكي متطور نشط:
            <br/>• تحليل المشاعر التلقائي من الكاميرا
            <br/>• ردود متعاطفة بواسطة {primaryProvider?.name}
            <br/>• فهم عميق لحالتك النفسية
            <br/>• نصائح شخصية ودعم فوري
            
            <br/><br/>🎯 ابدأ المحادثة وسأتفهم مشاعرك تلقائياً!
          </>
        ) : (
          <>
            <br/><br/>💡 وضع الذكاء المحلي النشط:
            <br/>• تحليل المشاعر من الكاميرا ✓
            <br/>• ردود ذكية محلية ✓
            <br/>• حماية كاملة للخصوصية ✓
            
            <br/><br/>🚀 للحصول على ردود أكثر تطوراً، يمكنك إضافة مفتاح ذكاء اصطناعي مجاني من الإعدادات.
          </>
        )}
      </p>
      <span className="text-xs text-gray-400 mt-2 block">الآن</span>
    </div>
  );
}