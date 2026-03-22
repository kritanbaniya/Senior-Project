/** 
 * This component renders a call-to-action button that directs users to the clinic discovery page. 
 * It is designed to be visually appealing and encourages users to find nearby clinics.
 */

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronRight } from "lucide-react";

export default function FindClinicsCTA() {
  return (
    <section className="px-10 pb-10">
      <div className="mx-auto flex max-w-[1325px] justify-center">
        <Button
          asChild
          size="xl"
          className="h-auto rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 px-8 py-4 text-xl font-semibold text-white shadow-[0px_10px_24px_rgba(124,58,237,0.28)] hover:from-violet-600 hover:to-indigo-600"
        >
          <Link to="/clinic-discovery" className="flex items-center gap-3">
            <MapPin className="h-8 w-8" />
            <span>Find Nearby Clinics</span>
            <ChevronRight className="h-8 w-8" />
          </Link>
        </Button>
      </div>
    </section>
  );
}