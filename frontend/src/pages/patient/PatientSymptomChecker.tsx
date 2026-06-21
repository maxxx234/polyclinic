import { useNavigate } from "react-router-dom";
import { SymptomChecker } from "../../components/SymptomChecker";

export default function PatientSymptomChecker() {
  const navigate = useNavigate();

  function handleBook(doctorId: string) {
    // Re-use the pre-select flow: the booking page opens this doctor's profile.
    sessionStorage.setItem("pendingDoctorId", doctorId);
    navigate("/patient/book");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">AI Symptom Checker</h1>
        <p className="text-sm text-slate-500">
          Tell us how you feel and get matched to the right specialist.
        </p>
      </div>
      <SymptomChecker onBook={handleBook} />
    </div>
  );
}
