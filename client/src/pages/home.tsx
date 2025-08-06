import { useState, useEffect } from "react";
import ChatInterface from "@/components/ChatInterface";
import MonitoringPanel from "@/components/MonitoringPanel";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, Session, EmotionData } from "@shared/schema";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [currentEmotions, setCurrentEmotions] = useState<EmotionData | null>(null);
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  // Initialize guest user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('emotional_ai_user');
    const storedSession = localStorage.getItem('emotional_ai_session');
    
    if (storedUser && storedSession) {
      setCurrentUser(JSON.parse(storedUser));
      setCurrentSession(JSON.parse(storedSession));
    } else {
      createGuestUser();
    }
  }, []);

  const createUserMutation = useMutation({
    mutationFn: async (userData: { name: string; email?: string; age?: number; gender?: string }) => {
      const response = await apiRequest('POST', '/api/users', userData);
      return response.json();
    },
    onSuccess: (user: User) => {
      setCurrentUser(user);
      localStorage.setItem('emotional_ai_user', JSON.stringify(user));
      createSession(user.id);
    }
  });

  const createSessionMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('POST', '/api/sessions', { userId });
      return response.json();
    },
    onSuccess: (session: Session) => {
      setCurrentSession(session);
      localStorage.setItem('emotional_ai_session', JSON.stringify(session));
    }
  });

  const createGuestUser = () => {
    createUserMutation.mutate({
      name: `ضيف_${Date.now()}`,
      age: 25,
      gender: 'unknown'
    });
  };

  const createSession = (userId: string) => {
    createSessionMutation.mutate(userId);
  };

  const registerUser = (userData: { name: string; email?: string }) => {
    if (currentUser) {
      // Update existing guest user with real info
      createUserMutation.mutate({
        ...userData,
        age: currentUser.age || 25,
        gender: currentUser.gender || 'unknown'
      });
    }
  };

  const updateEmotionData = (emotions: EmotionData, age?: number, gender?: string) => {
    setCurrentEmotions(emotions);
    
    // Update user demographics if detected
    if (currentUser && (age || gender)) {
      const updatedUser = {
        ...currentUser,
        age: age || currentUser.age,
        gender: gender || currentUser.gender
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('emotional_ai_user', JSON.stringify(updatedUser));
    }
  };

  if (!currentUser || !currentSession) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="glassmorphism p-8 rounded-2xl text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">جاري تهيئة النظام...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Chat Interface */}
      <ChatInterface 
        user={currentUser}
        session={currentSession}
        currentEmotions={currentEmotions}
        onRegisterUser={registerUser}
        onEmotionUpdate={updateEmotionData}
      />

      {/* Desktop Monitoring Panel */}
      <div className="hidden lg:flex lg:w-2/5">
        <MonitoringPanel 
          user={currentUser}
          session={currentSession}
          currentEmotions={currentEmotions}
          onEmotionUpdate={updateEmotionData}
        />
      </div>

      {/* Mobile Panel Toggle */}
      <div className="lg:hidden fixed bottom-4 left-4 z-50">
        <button 
          onClick={() => setShowMobilePanel(!showMobilePanel)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:scale-105 transition-transform"
        >
          <i className="bi bi-bar-chart text-xl"></i>
        </button>
      </div>

      {/* Mobile Monitoring Panel */}
      {showMobilePanel && (
        <div className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex">
          <div className="w-full max-w-sm mr-auto bg-gradient-to-br from-darker via-dark to-gray-900">
            <div className="flex justify-between items-center p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold gradient-text">المراقبة المباشرة</h3>
              <button 
                onClick={() => setShowMobilePanel(false)}
                className="p-2 rounded-full hover:bg-white/10"
              >
                <i className="bi bi-x-lg text-gray-400"></i>
              </button>
            </div>
            <MonitoringPanel 
              user={currentUser}
              session={currentSession}
              currentEmotions={currentEmotions}
              onEmotionUpdate={updateEmotionData}
              isMobile={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
