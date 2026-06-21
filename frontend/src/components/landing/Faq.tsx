import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "How do I book an appointment?",
    a: "Click ‘Book an Appointment’, sign in or create a free patient account, choose a doctor and an available slot, and confirm. You’ll get an instant confirmation in ‘My Appointments’.",
  },
  {
    q: "Do I need to pay before the consultation?",
    a: "No. Your consultation bill is generated after the doctor completes your visit. You can then pay it securely from the ‘Bills’ section of your patient portal.",
  },
  {
    q: "Can I cancel or reschedule my appointment?",
    a: "Yes. You can cancel a requested or confirmed appointment anytime from ‘My Appointments’, which instantly frees the slot for other patients.",
  },
  {
    q: "Will I get a prescription digitally?",
    a: "Absolutely. After your visit, your doctor adds a digital prescription that you can view and access anytime from your appointment history.",
  },
  {
    q: "What specialities do you offer?",
    a: "We cover Cardiology, Dermatology, Orthopedics, Pediatrics, Neurology, Ophthalmology, General Medicine, Dentistry and more — all under one roof.",
  },
  {
    q: "Are the doctors verified?",
    a: "Every doctor on our platform is qualified, experienced and verified by our clinic administration before they accept appointments.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto mt-10 max-w-3xl space-y-3">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-semibold text-slate-800">{f.q}</span>
              <ChevronDown
                size={20}
                className={`shrink-0 text-brand-600 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className="grid transition-all duration-300 ease-out"
              style={{
                gridTemplateRows: isOpen ? "1fr" : "0fr",
                opacity: isOpen ? 1 : 0,
              }}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 text-sm leading-relaxed text-slate-600">{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
