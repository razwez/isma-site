// The store badges. Until a store has the app, its badge opens a popup that
// adds the visitor's email to the waitlist (public.waitlist in Supabase).
// Launch day: set that store's `live` to true and its badge goes straight to
// the store.
const STORES = {
  ios: { live: false, url: "https://apps.apple.com/app/id6822783362" },
  android: { live: false, url: "https://play.google.com/store/apps/details?id=app.theisma.isma" }
};

// Public by design, as in the app's .env: row-level security lets this key
// add a signup and nothing else.
const SUPABASE_URL = "https://oyrdxzgwwkzplpueapwl.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZRVYnyQ1FWEbcloMzTz5mQ_t7qE76yN";

const COPY = {
  ios: { title: "Coming soon on iPhone", text: "Isma isn’t on the App Store yet. Join the waitlist to be the first to know when it launches." },
  android: { title: "Coming soon on Android", text: "Isma isn’t available on Android yet. Join the waitlist to be the first to know when it launches." }
};

const dialog = document.getElementById("waitlist");
const form = dialog.querySelector("form");
const email = form.querySelector("input");
const submit = form.querySelector("button[type=submit]");
const error = dialog.querySelector(".wl-error");
let platform = "ios";

document.querySelectorAll("[data-store]").forEach(function (badge) {
  const store = STORES[badge.dataset.store];
  if (store.live) { badge.href = store.url; return; }
  badge.addEventListener("click", function (e) {
    e.preventDefault();
    open(badge.dataset.store);
  });
});

function open(p) {
  platform = p;
  dialog.querySelector("h2").textContent = COPY[p].title;
  dialog.querySelector(".wl-text").textContent = COPY[p].text;
  dialog.classList.remove("done");
  error.textContent = "";
  form.reset();
  submit.disabled = false;
  dialog.showModal();
  email.focus();
}

dialog.querySelectorAll(".wl-close").forEach(function (b) {
  b.addEventListener("click", function () { dialog.close(); });
});
// A tap on the dim backdrop closes it too.
dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const address = email.value.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(address)) { error.textContent = "Enter an email address like name@example.com."; return; }
  error.textContent = "";
  submit.disabled = true;
  fetch(SUPABASE_URL + "/rest/v1/waitlist", {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ email: address, platform: platform, source: location.pathname || "/" })
  }).then(function (res) {
    if (res.ok) return thanks("We’ll email you the day Isma launches.");
    // 409: this address is already on this store's list.
    if (res.status === 409) return thanks("You’re already on the list. We’ll email you the day Isma launches.");
    throw new Error("waitlist " + res.status);
  }).catch(function () {
    submit.disabled = false;
    error.textContent = "That didn’t go through. Check your connection and try again.";
  });
});

function thanks(text) {
  dialog.querySelector(".wl-thanks-text").textContent = text;
  dialog.classList.add("done");
}
