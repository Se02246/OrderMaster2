import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Menu } from "lucide-react";

type HeaderProps = {
  toggleSidebar: () => void;
};

export default function Header({ toggleSidebar }: HeaderProps) {
  const currentDate = format(new Date(), "d MMMM yyyy", { locale: it });

  return (
    <header className="bg-white shadow-sm sticky top-0 z-20">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <button 
          onClick={toggleSidebar}
          className="md:hidden text-gray-600 focus:outline-none"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
        
        <h1 className="text-xl font-semibold text-dark md:hidden">GESTORE ORDINI</h1>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600 hidden md:block">
            {currentDate}
          </span>
        </div>
      </div>
    </header>
  );
}
