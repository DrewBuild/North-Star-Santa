import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import FAQHelpPopup from "./components/FAQHelpPopup";
import SanityReadDebugPanel from "./components/SanityReadDebugPanel";
import Layout from "./components/Layout";
import Index from "./pages/Index.tsx";
import Testimonials from "./pages/Testimonials.tsx";
import Gallery from "./pages/Gallery.tsx";
import Services from "./pages/Services.tsx";
import Tips from "./pages/Tips.tsx";
import Book from "./pages/Book.tsx";
import NotFound from "./pages/NotFound.tsx";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/services" element={<Services />} />
          <Route path="/tips" element={<Tips />} />
          <Route path="/book" element={<Book />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <FAQHelpPopup />
      <SanityReadDebugPanel />
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
