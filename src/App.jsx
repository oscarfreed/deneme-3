import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import GuestUpload from "./pages/GuestUpload";
import Gallery from "./pages/Gallery";
import AdminDashboard from "./pages/AdminDashboard";
import EventDetail from "./pages/EventDetail";
import Slideshow from "./pages/Slideshow";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/upload/:qrToken" component={GuestUpload} />
      <Route path="/gallery/:coupleToken" component={Gallery} />
      <Route path="/slideshow/:coupleToken" component={Slideshow} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/events/:eventId" component={EventDetail} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
