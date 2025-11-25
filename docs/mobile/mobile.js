/* mobile.js — PayArise FINAL with 3-dot menu + logout + correct back logic */

console.log("MOBILE.JS LOADED");

// Quick selector
const $ = id => document.getElementById(id);

/* SCREENS */
const scrLogin = $('screenLogin');
const scrType = $('screenType');
const scrDetails = $('screenDetails');
const scrAmount = $('screenAmount');
const scrPin = $('screenPin');
const scrProcessing = $('screenProcessing');
const scrResult = $('screenResult');

const backBtn = $('backBtn');
const menuBtn = $('menuBtn');
const menuDropdown = $('menuDropdown');
const menuLogout = $('menuLogout');
const userBadge = $('userBadge');

/* Inputs and UI */
const loginBtn = $('loginBtn');
const loginUser = $('loginUser');
const loginPass = $('loginPass');

const mobileField = $('mobileField');
const upiField = $('upiField');
const accField = $('accField');
const ifscField = $('ifscField');
const continueBtn = $('continueBtn');
const fetchStatus = $('fetchStatus');
const errorMsg = $('errorMsg');

const receiverBox = $('receiverBox');
const recvAvatar = $('recvAvatar');
const recvName = $('recvName');
const recvBank = $('recvBank');
const recvUpi = $('recvUpi');

const amountField = $('amountField');
const predContainer = $('predContainer');
const payNowBtn = $('payNowBtn');

const pinDots = [ $('p1'), $('p2'), $('p3'), $('p4') ];
const keys = Array.from(document.querySelectorAll('.key'));

const resultTitle = $('resultTitle');
const resultMsg = $('resultMsg');
const resultDoneBtn = $('resultDoneBtn');

const devPanel = $('devPanel'); // optional
const devSuccess = $('forceSuccess');
const devModerate = $('forceModerate');
const devFail = $('forceFail');

/* STATE */
let chosenType = null;
let receiver = null;
let prediction = null;
let fetchTimer = null;
let amountTimer = null;
let tapTimer = null;
let pinBuffer = "";
let forceMode = null;
let tapCount = 0;

/* CONSTANTS */
const BASE = "http://127.0.0.1:5000";
const DEBOUNCE_MS = 750;

/* ----------------------
   showScreen: controls visibility and topbar behavior
-----------------------*/
function showScreen(s){
  [scrLogin, scrType, scrDetails, scrAmount, scrPin, scrProcessing, scrResult].forEach(x => x.classList.add('hidden'));
  s.classList.remove('hidden');

  // login: hide back & menu
  if(s === scrLogin){
    backBtn.style.display = "none";
    menuBtn.style.display = "none";
    if(menuDropdown) menuDropdown.classList.add('hidden');
    userBadge.innerText = "";
    return;
  }

  // payment screens: show menu
  menuBtn.style.display = "block";

  // on send-money (main) hide back (user shouldn't go back to login)
  if(s === scrType){
    backBtn.style.display = "none";
  } else {
    backBtn.style.display = "block";
  }

  // hide menu in PIN/Processing
  if(s === scrPin || s === scrProcessing){
    menuBtn.style.display = "none";
    if(menuDropdown) menuDropdown.classList.add('hidden');
  }
}

/* INIT: start on login */
showScreen(scrLogin);

/* ----------------------
   LOGIN handling
-----------------------*/
loginBtn.addEventListener('click', () => {
  const u = loginUser.value.trim();
  const p = loginPass.value.trim();
  if(!u || !p){
    // simple inline feedback
    alert("Enter username and password (demo)");
    return;
  }

  userBadge.innerText = u;
  loginPass.value = "";
  showScreen(scrType);

  // reset payment UI state
  chosenType = null;
  receiver = null;
  prediction = null;
  predContainer.innerHTML = "";
  continueBtn.classList.add('disabled');
  payNowBtn.classList.add('disabled');
});

/* ----------------------
   Type selection (Send Money)
-----------------------*/
document.querySelectorAll('.type-card').forEach(card => {
  card.addEventListener('click', () => {
    chosenType = card.dataset.type;

    $('inputMobile').classList.toggle('hidden', chosenType !== "mobile");
    $('inputUpi').classList.toggle('hidden', chosenType !== "upi");
    $('inputBank').classList.toggle('hidden', chosenType !== "bank");

    mobileField.value = "";
    upiField.value = "";
    accField.value = "";
    ifscField.value = "";

    fetchStatus.classList.add('hidden');
    errorMsg.classList.add('hidden');
    if(receiverBox) receiverBox.classList.add('hidden');
    continueBtn.classList.add('disabled');

    showScreen(scrDetails);
  });
});

/* ----------------------
   Validation & auto fetch receiver
-----------------------*/
const validMobile = v => /^\d{10}$/.test(v);
const validUpi = v => /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/.test(v);
const validIfsc = v => /^[A-Za-z]{4}0[A-Z0-9]{6}$/.test((v||"").toUpperCase());
const validAccount = v => /^[0-9]{6,20}$/.test(v);

function scheduleFetch(){
  if(fetchTimer) clearTimeout(fetchTimer);
  fetchTimer = setTimeout(doFetch, 400);
}
function doFetch(){
  continueBtn.classList.add('disabled');
  fetchStatus.classList.add('hidden');
  errorMsg.classList.add('hidden');

  if(chosenType === 'mobile'){
    const v = mobileField.value.trim();
    if(!validMobile(v)) return;
    buildReceiver('mobile', v);
  } else if(chosenType === 'upi'){
    const v = upiField.value.trim();
    if(!validUpi(v)) return;
    buildReceiver('upi', v);
  } else {
    const a = accField.value.trim(); const i = ifscField.value.trim();
    if(!validAccount(a) || !validIfsc(i)) return;
    buildReceiver('bank', {acc:a, ifsc:i});
  }
}
async function buildReceiver(type, payload){
  fetchStatus.innerText = "Fetching receiver…";
  fetchStatus.classList.remove('hidden');

  await new Promise(r=>setTimeout(r,350)); // simulate network

  if(type === 'mobile'){
    receiver = { name: "Merchant " + payload.slice(-4), bank: "SBI", upi: payload + "@upi", mobile: payload };
  } else if(type === 'upi'){
    receiver = { name: payload.split("@")[0].replace(/[\.\-_]/g," "), bank: (payload.split("@")[1] || "SBI").toUpperCase(), upi: payload };
  } else {
    receiver = { name: "A/C Merchant", bank: payload.ifsc.slice(0,4), account: payload.acc };
  }

  recvAvatar.innerText = (receiver.name || "PA").split(" ").map(s=>s[0]).slice(0,2).join("").toUpperCase();
  recvName.innerText = receiver.name || "—";
  recvBank.innerText = receiver.bank || "—";
  recvUpi.innerText = receiver.upi || receiver.mobile || receiver.account || "—";

  receiverBox.classList.remove('hidden');
  fetchStatus.classList.add('hidden');
  continueBtn.classList.remove('disabled');
}

mobileField.addEventListener('input', scheduleFetch);
upiField.addEventListener('input', scheduleFetch);
accField.addEventListener('input', scheduleFetch);
ifscField.addEventListener('input', scheduleFetch);

/* Continue -> Amount */
continueBtn.addEventListener('click', () => {
  if(continueBtn.classList.contains('disabled')) return;
  amountField.value = "";
  predContainer.innerHTML = "";
  prediction = null;
  payNowBtn.classList.add('disabled');
  showScreen(scrAmount);
});

/* ----------------------
   Prediction (calls backend or sim)
-----------------------*/
amountField.addEventListener('input', () => {
  predContainer.innerHTML = "";
  prediction = null;
  payNowBtn.classList.add('disabled');
  if(amountTimer) clearTimeout(amountTimer);
  amountTimer = setTimeout(() => {
    const amt = parseFloat(amountField.value || 0);
    if(!amt || amt <= 0) return;
    callPredict({
      method: chosenType,
      bank: receiver?.bank || "SBI",
      amount: amt,
      network: "Average",
      time_of_day: "Evening",
      retries: 0,
      past_failures: 0
    });
  }, DEBOUNCE_MS);
});

async function callPredict(payload){
  try {
    const res = await fetch(BASE + "/predict", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload) });
    const data = await res.json();
    const p = applyNoise(data.success_prob || 50);
    showPrediction({ success_prob: p, reason: predictionReason(p) });
  } catch (e) {
    showPrediction(simulateLocal(payload.amount));
  }
}
function applyNoise(p){
  const noise = Math.floor(Math.random()*21) - 10;
  return Math.max(5, Math.min(95, Math.round((p||50) + noise)));
}
function predictionReason(p){
  if(p < 30) return "Low chance; bank/network may fail";
  if(p <= 60) return "Moderate chance; could fail during load";
  return "High chance of success";
}
function simulateLocal(amount){
  let base = amount > 5000 ? 70 : 90;
  return { success_prob: applyNoise(base), reason: predictionReason(base) };
}

function showPrediction(pred){
  prediction = pred;
  const div = document.createElement('div');
  div.className = 'prediction-card';
  div.innerHTML = `<div class="pred-percent">${Math.round(pred.success_prob)}%</div><div class="pred-reason">${pred.reason}</div>`;
  predContainer.innerHTML = "";
  predContainer.appendChild(div);
  payNowBtn.classList.remove('disabled');

  // triple tap -> show dev panel
  div.addEventListener('click', () => {
    tapCount = (typeof tapCount === 'number' ? tapCount : 0) + 1;
    if(!tapTimer) {
      tapTimer = setTimeout(()=>{ tapCount = 0; tapTimer = null; }, 600);
    }
    if(tapCount >= 3) {
      tapCount = 0;
      tapTimer = null;
      if(devPanel) devPanel.classList.add('visible');
    }
  });
}

/* Pay Now -> PIN */
payNowBtn.addEventListener('click', () => {
  if(payNowBtn.classList.contains('disabled')) return;
  pinBuffer = "";
  updatePinDots();
  showScreen(scrPin);
});

/* PIN keypad */
keys.forEach(k => k.addEventListener('click', () => {
  const v = k.innerText.trim();
  if(v === '⌫'){ pinBuffer = pinBuffer.slice(0,-1); updatePinDots(); return; }
  if(v === 'OK'){ if(pinBuffer.length === 4) processPayment(); return; }
  if(/^\d$/.test(v) && pinBuffer.length < 4){ pinBuffer += v; updatePinDots(); }
}));
function updatePinDots(){ pinDots.forEach((d,i)=> d.classList.toggle('filled', i < pinBuffer.length)); }

/* Process Payment -> Result */
function processPayment(){
  showScreen(scrProcessing);

  setTimeout(() => {
    const p = prediction?.success_prob ?? 80;
    if(forceMode === 'success') return showResult('success');
    if(forceMode === 'fail') return showResult('fail');
    if(forceMode === 'moderate') return showResult(Math.random() < 0.5 ? 'fail' : 'success');

    let final = 'success';
    if(p < 30) final = 'fail';
    else if(p <= 60) final = Math.random() < 0.5 ? 'fail' : 'success';
    else if(p > 60 && Math.random() < 0.02) final = 'fail';
    showResult(final);
  }, 900);
}

function showResult(status){
  showScreen(scrResult);
  if(status === 'success'){
    resultTitle.className = 'res-success';
    resultTitle.innerText = 'Payment Successful';
    resultMsg.innerText = `Paid ₹${amountField.value} to ${recvName.innerText} • Ref ${genRef()}`;
  } else {
    resultTitle.className = 'res-fail';
    resultTitle.innerText = 'Payment Failed';
    if(prediction?.success_prob < 30) resultMsg.innerText = 'Issuer bank not responding.';
    else if(prediction?.success_prob <= 60) resultMsg.innerText = 'UPI switch timeout during peak load.';
    else resultMsg.innerText = 'Unexpected bank decline.';
  }
}

/* Done -> reset minimal state and stay logged-in */
resultDoneBtn.addEventListener('click', () => {
  receiver = null;
  prediction = null;
  pinBuffer = "";
  predContainer.innerHTML = "";
  receiverBox.classList.add('hidden');
  continueBtn.classList.add('disabled');
  payNowBtn.classList.add('disabled');
  if(devPanel) devPanel.classList.remove('visible');
  showScreen(scrType);
});

/* Back button behavior */
backBtn.addEventListener('click', () => {
  const current = document.querySelector('.screen:not(.hidden)');
  if(!current) return;
  const id = current.id;
  if(id === 'screenDetails') showScreen(scrType);
  else if(id === 'screenAmount') showScreen(scrDetails);
  else if(id === 'screenPin') showScreen(scrAmount);
  else if(id === 'screenResult') showScreen(scrType);
});

/* Menu (three-dots) and Logout */
menuBtn.addEventListener('click', (e) => {
  if(menuDropdown.classList.contains('hidden')) menuDropdown.classList.remove('hidden');
  else menuDropdown.classList.add('hidden');
});

document.addEventListener('click', (e) => {
  if(!menuBtn.contains(e.target) && !menuDropdown.contains(e.target)) {
    menuDropdown.classList.add('hidden');
  }
});

menuLogout.addEventListener('click', () => {
  menuDropdown.classList.add('hidden');
  mobileField.value = "";
  upiField.value = "";
  accField.value = "";
  ifscField.value = "";
  amountField.value = "";
  receiver = null;
  prediction = null;
  pinBuffer = "";
  predContainer.innerHTML = "";
  continueBtn.classList.add('disabled');
  payNowBtn.classList.add('disabled');
  if(devPanel) devPanel.classList.remove('visible');
  userBadge.innerText = "";
  showScreen(scrLogin);
});

/* Utility */
function genRef(){ return 'TX' + Date.now().toString(36).toUpperCase().slice(-8); }

/* Dev Panel hooks */
if(devSuccess) devSuccess.onclick = ()=> { forceMode = 'success'; alert('FORCE SUCCESS'); };
if(devModerate) devModerate.onclick = ()=> { forceMode = 'moderate'; alert('FORCE MODERATE'); };
if(devFail) devFail.onclick = ()=> { forceMode = 'fail'; alert('FORCE FAIL'); };

/* Init */
showScreen(scrLogin);
console.log("PayArise UI ready.");
