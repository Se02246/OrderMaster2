import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Calendar from "@/pages/calendar";
import CalendarDay from "@/pages/calendar-day";
import Employees from "@/pages/employees";
import EmployeeDetail from "@/pages/employee-detail";
import Statistics from "@/pages/statistics";
import Sidebar from "@/components/ui/layout/Sidebar";
import Header from "@/components/ui/layout/Header";

function Router() {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const storedColor = localStorage.getItem("themeColor");
    if (storedColor) {
      document.documentElement.style.setProperty("--primary", storedColor);
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col md:ml-64">
        <Header toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-100">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/calendar" component={Calendar} />
            <Route path="/calendar/:year/:month/:day" component={CalendarDay} />
            <Route path="/employees" component={Employees} />
            <Route path="/employees/:id" component={EmployeeDetail} />
            <Route path="/statistics" component={Statistics} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
