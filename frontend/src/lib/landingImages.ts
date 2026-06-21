// Curated, connectivity-verified Unsplash medical imagery for the landing page.
// Each section falls back to a gradient if an image fails to load.

export function img(id: string, w = 800, q = 75): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=${q}`;
}

export interface HeroSlide {
  id: string;
  heading: string;
  sub: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "1576091160550-2173dba999ef",
    heading: "We Are Your Family Doctors",
    sub: "Compassionate, life-long care for every member of your family.",
  },
  {
    id: "1612349317150-e413f6a5b16d",
    heading: "Trusted by Thousands of Patients",
    sub: "Experienced specialists who truly listen and care.",
  },
  {
    id: "1559839734-2b71ea197ec2",
    heading: "Modern Care, Made Simple",
    sub: "Book appointments online in seconds — no long queues.",
  },
];

// Speciality name -> representative photo id (all connectivity-verified).
export const SPECIALITY_IMAGE: Record<string, string> = {
  Cardiology: "1505751172876-fa1923c5c528",
  Dermatology: "1594824476967-48c8b964273f",
  Orthopedics: "1538108149393-fbbd81895907",
  Pediatrics: "1581056771107-24ca5f033842",
  Neurology: "1579684385127-1ef15d508118",
  Ophthalmology: "1584982751601-97dcc096659c",
  "General Medicine": "1576091160550-2173dba999ef",
  Dentistry: "1551601651-2a8555f1a136",
  ENT: "1612349317150-e413f6a5b16d",
  Gynecology: "1582750433449-648ed127bb54",
  Psychiatry: "1537368910025-700350fe46c7",
  Gastroenterology: "1559839734-2b71ea197ec2",
  Pulmonology: "1607990281513-2c110a25bd8c",
  Urology: "1622253692010-333f2da6031d",
  Endocrinology: "1631217868264-e5b90bb7e133",
};

export const ABOUT_IMAGE = "1537368910025-700350fe46c7";

export const WHO_WE_ARE_STRIP = [
  "1559839734-2b71ea197ec2",
  "1612349317150-e413f6a5b16d",
  "1607990281513-2c110a25bd8c",
  "1622253692010-333f2da6031d",
];

// Cycled across the doctor cards so each gets a distinct portrait.
export const DOCTOR_PHOTOS = [
  "1622253692010-333f2da6031d",
  "1594824476967-48c8b964273f",
  "1582750433449-648ed127bb54",
  "1612349317150-e413f6a5b16d",
  "1607990281513-2c110a25bd8c",
  "1538108149393-fbbd81895907",
];

export function doctorPhoto(index: number): string {
  return img(DOCTOR_PHOTOS[index % DOCTOR_PHOTOS.length], 600);
}

/** Deterministic photo for a doctor id, so the same doctor always shows the
 *  same portrait across the landing page and the booking page. */
export function doctorPhotoById(id: string, w = 600): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return img(DOCTOR_PHOTOS[h % DOCTOR_PHOTOS.length], w);
}
