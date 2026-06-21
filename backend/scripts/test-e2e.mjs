// End-to-end API test using Node's built-in fetch. Run while the dev server is up.
const API = "http://localhost:4000/api";
let pass = 0,
  fail = 0;

function check(name, cond, extra = "") {
  if (cond) {
    pass++;
    console.log(`  ✅ ${name} ${extra}`);
  } else {
    fail++;
    console.log(`  ❌ ${name} ${extra}`);
  }
}

async function req(method, path, token, body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no body */
  }
  return { status: res.status, data };
}

function nextDate(dow) {
  const d = new Date();
  const diff = (dow - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  // local YYYY-MM-DD (avoid UTC shift)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
function plusDays(iso, n) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

async function main() {
  console.log("\n[Auth]");
  const health = await req("GET", "/health");
  check("health ok", health.status === 200 && health.data.status === "ok");

  const patient = await req("POST", "/auth/login", null, {
    email: "anjali@example.com",
    password: "Patient@123",
  });
  check("patient login", patient.status === 200 && !!patient.data.token);
  const PT = patient.data.token;

  const badLogin = await req("POST", "/auth/login", null, {
    email: "anjali@example.com",
    password: "wrong",
  });
  check("wrong password rejected (401)", badLogin.status === 401);

  console.log("\n[Doctors & slots]");
  const docs = await req("GET", "/doctors", PT);
  check("list doctors (4)", docs.status === 200 && docs.data.length === 4);
  const pedi = docs.data.find((d) => d.specialty === "Pediatrics");
  const slots = await req("GET", `/slots/doctor/${pedi._id}`, PT);
  check("pediatrician has slots", slots.data.length > 0);
  const slot = slots.data[0];
  const date = nextDate(slot.dayOfWeek);

  console.log("\n[Booking + slot-conflict engine]");
  const b1 = await req("POST", "/appointments", PT, {
    doctorId: pedi._id,
    slotId: slot._id,
    date,
    reason: "fever",
  });
  check("booking #1 succeeds (201)", b1.status === 201, `-> ${b1.status}`);
  const apptId = b1.data?._id;

  const b2 = await req("POST", "/appointments", PT, {
    doctorId: pedi._id,
    slotId: slot._id,
    date,
  });
  check("double-booking blocked (409)", b2.status === 409, `-> ${b2.status}: ${b2.data?.message}`);

  const wrongDay = plusDays(date, 1);
  const b3 = await req("POST", "/appointments", PT, {
    doctorId: pedi._id,
    slotId: slot._id,
    date: wrongDay,
  });
  check("wrong-weekday rejected (400)", b3.status === 400, `-> ${b3.status}: ${b3.data?.message}`);

  console.log("\n[Lifecycle: confirm -> complete -> auto-bill]");
  const doc = await req("POST", "/auth/login", null, {
    email: "sneha@clinic.com",
    password: "Doctor@123",
  });
  const DT = doc.data.token;
  const confirm = await req("PATCH", `/appointments/${apptId}/status`, DT, {
    status: "Confirmed",
  });
  check("doctor confirms (200)", confirm.status === 200 && confirm.data.status === "Confirmed");
  const complete = await req("PATCH", `/appointments/${apptId}/status`, DT, {
    status: "Completed",
  });
  check("doctor completes (200)", complete.status === 200 && complete.data.status === "Completed");
  check(
    "bill auto-generated",
    !!complete.data.bill && complete.data.bill.amount === pedi.consultationFee,
    `-> ${complete.data.bill?.invoiceNo} ₹${complete.data.bill?.amount}`
  );

  console.log("\n[Prescription]");
  const presc = await req("POST", `/prescriptions/appointment/${apptId}`, DT, {
    notes: "Rest and fluids",
    medicines: "Paracetamol 500mg twice daily",
  });
  check("doctor adds prescription (201)", presc.status === 201);

  console.log("\n[Cancel frees slot -> re-book]");
  // book a 2nd slot, cancel it, then re-book the same slot/date.
  const slot2 = slots.data[1];
  const date2 = nextDate(slot2.dayOfWeek);
  const c1 = await req("POST", "/appointments", PT, {
    doctorId: pedi._id,
    slotId: slot2._id,
    date: date2,
  });
  check("book slot#2 (201)", c1.status === 201);
  const cancel = await req("PATCH", `/appointments/${c1.data._id}/status`, PT, {
    status: "Cancelled",
  });
  check("patient cancels (200)", cancel.status === 200 && cancel.data.status === "Cancelled");
  const rebook = await req("POST", "/appointments", PT, {
    doctorId: pedi._id,
    slotId: slot2._id,
    date: date2,
  });
  check("cancelled slot can be re-booked (201)", rebook.status === 201, `-> ${rebook.status}`);

  console.log("\n[Bills]");
  const bills = await req("GET", "/bills/mine", PT);
  check("patient sees bills", bills.status === 200 && bills.data.length >= 1);
  const unpaid = bills.data.find((b) => b.status === "unpaid");
  if (unpaid) {
    const pay = await req("PATCH", `/bills/${unpaid._id}/pay`, PT);
    check("patient pays bill (200)", pay.status === 200 && pay.data.status === "paid");
  }

  console.log("\n[Admin dashboard + RBAC]");
  const admin = await req("POST", "/auth/login", null, {
    email: "admin@clinic.com",
    password: "Admin@123",
  });
  const AT = admin.data.token;
  const dash = await req("GET", "/dashboard", AT);
  check("admin dashboard (200)", dash.status === 200 && dash.data.totals.doctors === 4);
  console.log("     totals:", JSON.stringify(dash.data.totals));
  const forbidden = await req("GET", "/dashboard", PT);
  check("patient blocked from dashboard (403)", forbidden.status === 403);

  // admin creates a doctor + posts announcement
  const newDoc = await req("POST", "/doctors", AT, {
    name: "Dr. Test Kapoor",
    email: `test${Date.now()}@clinic.com`,
    password: "Doctor@123",
    specialty: "Neurology",
    consultationFee: 900,
  });
  check("admin creates doctor (201)", newDoc.status === 201);
  const ann = await req("POST", "/announcements", AT, {
    title: "Test Notice",
    message: "This is a test announcement.",
  });
  check("admin posts announcement (201)", ann.status === 201);

  console.log(`\n==== ${pass} passed, ${fail} failed ====`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("Test run crashed:", e);
  process.exit(1);
});
