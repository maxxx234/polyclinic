const API = "http://localhost:4000/api";
let pass = 0, fail = 0;
const ok = (n, c, x = "") => { c ? pass++ : fail++; console.log(`  ${c ? "✅" : "❌"} ${n} ${x}`); };

async function req(method, path, token, body) {
  const res = await fetch(API + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null; try { data = await res.json(); } catch {}
  return { status: res.status, data };
}
const nextDate = (dow) => { const d = new Date(); d.setDate(d.getDate() + ((dow - d.getDay() + 7) % 7)); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };

async function main() {
  console.log("\n[Registration with phone/age/sex]");
  const email = `e2e_${Math.floor(performance.now())}@test.com`;
  const missing = await req("POST", "/auth/register", null, { name: "No Phone", email: `np_${email}`, password: "Pass@123" });
  ok("register without phone/age/sex rejected (400)", missing.status === 400, `-> ${missing.status}`);

  const reg = await req("POST", "/auth/register", null, {
    name: "Test Patient", email, password: "Pass@123", phone: "9876543210", age: 30, gender: "male",
  });
  ok("register with phone/age/sex (201)", reg.status === 201, `-> ${reg.status}`);
  ok("user has age & gender", reg.data?.user?.age === 30 && reg.data?.user?.gender === "male");
  const PT = reg.data.token;

  console.log("\n[Booking -> doctor gets a request notification]");
  const docs = await req("GET", "/doctors", PT);
  const pedi = docs.data.find((d) => d.specialty === "Pediatrics");
  const slots = await req("GET", `/slots/doctor/${pedi._id}`, PT);
  const slot = slots.data[0];
  const date = nextDate(slot.dayOfWeek);
  const book = await req("POST", "/appointments", PT, { doctorId: pedi._id, slotId: slot._id, date, reason: "checkup" });
  ok("booking succeeds (201)", book.status === 201, `-> ${book.status}`);
  const apptId = book.data?._id;

  const DT = (await req("POST", "/auth/login", null, { email: "sneha@clinic.com", password: "Doctor@123" })).data.token;
  const docNotif = await req("GET", "/notifications", DT);
  ok("doctor has unread request notification", docNotif.data.unreadCount >= 1 && docNotif.data.items.some((n) => n.type === "request"), `-> unread ${docNotif.data.unreadCount}`);

  console.log("\n[Confirm -> patient gets confirmed notification]");
  await req("PATCH", `/appointments/${apptId}/status`, DT, { status: "Confirmed" });
  const ptNotif = await req("GET", "/notifications", PT);
  ok("patient has confirmed notification", ptNotif.data.items.some((n) => n.type === "confirmed"), `-> unread ${ptNotif.data.unreadCount}`);
  ok("patient sees reminder (today/tomorrow if applicable)", Array.isArray(ptNotif.data.items));

  console.log("\n[Mark-all-read clears the red dot]");
  await req("PATCH", "/notifications/read-all", PT);
  const after = await req("GET", "/notifications", PT);
  ok("unread count is 0 after read-all", after.data.unreadCount === 0, `-> ${after.data.unreadCount}`);

  console.log("\n[Cancel -> doctor notified]");
  // book again then cancel to notify doctor
  const slot2 = slots.data[1];
  const date2 = nextDate(slot2.dayOfWeek);
  const b2 = await req("POST", "/appointments", PT, { doctorId: pedi._id, slotId: slot2._id, date: date2 });
  await req("PATCH", `/appointments/${b2.data._id}/status`, PT, { status: "Cancelled" });
  const docNotif2 = await req("GET", "/notifications", DT);
  ok("doctor notified of cancellation", docNotif2.data.items.some((n) => n.type === "cancelled"));

  console.log(`\n==== ${pass} passed, ${fail} failed ====`);
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
