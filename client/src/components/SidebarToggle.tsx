import { Button } from "@/components/ui/button";

interface SidebarToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function SidebarToggle({ isOpen, onToggle }: SidebarToggleProps) {
  return (
    <Button
      onClick={onToggle}
      variant="outline"
      size="sm"
      className={`
        fixed bottom-4 left-4 z-50 
        w-14 h-14 rounded-full
        bg-gradient-to-r from-primary to-secondary 
        text-white shadow-lg hover:scale-105 
        transition-all duration-300
        lg:hidden flex items-center justify-center
      `}
      aria-label={isOpen ? 'إغلاق اللوحة الجانبية' : 'فتح اللوحة الجانبية'}
    >
      <i className={`bi ${isOpen ? 'bi-x-lg' : 'bi-bar-chart'} text-xl`}></i>
    </Button>
  );
}