import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import ValueSection from "@/components/ValueSection";
import ConditionsSection from "@/components/ConditionsSection";
import MuseumGallery from "@/components/MuseumGallery";
import BookingForm from "@/components/BookingForm";
import SiteFooter from "@/components/SiteFooter";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <ValueSection />
        <ConditionsSection />
        <MuseumGallery />
        <BookingForm />
      </main>
      <SiteFooter />
    </div>
  );
}
