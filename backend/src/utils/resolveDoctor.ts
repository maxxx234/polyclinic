import { Doctor, IDoctor } from "../models/Doctor";
import { ApiError } from "./ApiError";

/** Returns the Doctor profile linked to a logged-in doctor user, or throws. */
export async function resolveDoctorByUser(userId: string): Promise<IDoctor> {
  const doctor = await Doctor.findOne({ user: userId });
  if (!doctor) throw new ApiError(404, "Doctor profile not found for this account");
  return doctor;
}
