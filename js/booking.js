/**
 * Hope Station — Booking System
 * Multi-step: Select Package → Pick Date → Your Details → Accept T&Cs → Pay Deposit via PayFast
 */
(function () {
  'use strict';

  const cfg = () => window.HOPESTATION_CONFIG || {};

  /* ============================================================
     PRICING DATA
     ============================================================ */
  const PACKAGES = [
    { id: 'corp-half',     name: 'Corporate Boardroom — Half Day',  duration: '4 hours',  price: 2500, deposit: 1250, category: 'corporate' },
    { id: 'corp-full',     name: 'Corporate Boardroom — Full Day',  duration: '8 hours',  price: 4500, deposit: 2250, category: 'corporate' },
    { id: 'wellness-hr',   name: 'Wellness Space — Hourly',         duration: '1 hour',   price: 400,  deposit: 400,  category: 'wellness' },
    { id: 'wellness-half', name: 'Wellness Space — Half Day',       duration: '4 hours',  price: 1800, deposit: 900,  category: 'wellness' },
    { id: 'speaker',       name: 'Guest Speaker / Talk',            duration: 'Evening',  price: 2000, deposit: 1000, category: 'speaker' },
    { id: 'private-half',  name: 'Private Event — Half Day',        duration: '4 hours',  price: 3000, deposit: 1500, category: 'private' },
    { id: 'private-full',  name: 'Private Event — Full Day',        duration: '8 hours',  price: 5000, deposit: 2500, category: 'private' },
    { id: 'workshop-2',    name: 'Training Workshop — 2 Days',      duration: '2 days',   price: 8000, deposit: 4000, category: 'training' },
    { id: 'workshop-3',    name: 'Training Workshop — 3 Days',      duration: '3 days',   price: 12000, deposit: 6000, category: 'training' },
  ];

  const TIME_SLOTS = [
    { id: 'morning',   label: 'Morning (08:00–12:00)', categories: ['corporate','wellness','training','private','speaker'] },
    { id: 'afternoon', label: 'Afternoon (12:00–16:00)', categories: ['corporate','wellness','training','private','speaker'] },
    { id: 'fullday',   label: 'Full Day (08:00–16:00)', categories: ['corporate','training','private'] },
    { id: 'evening',   label: 'Evening (17:00–21:00)', categories: ['wellness','speaker','private'] },
  ];

  /* ============================================================
     STATE
     ============================================================ */
  let state = {
    step: 1,
    selectedPackage: null,
    selectedDate: null,
    selectedSlot: null,
    calendarMonth: new Date().getMonth(),
    calendarYear: new Date().getFullYear(),
    bookedDates: [], // fetched from Airtable
    formData: {}
  };

  /* ============================================================
     DOM REFERENCES
     ============================================================ */
  const stepsContainer = document.getElementById('booking-steps');
  if (!stepsContainer) return;

  /* ============================================================
     STEP INDICATOR
     ============================================================ */
  function renderStepIndicator() {
    const labels = ['Select Package', 'Choose Date', 'Your Details', 'Review & Pay'];
    return '<div class="booking-steps-nav">' +
      labels.map((label, i) => {
        const num = i + 1;
        const cls = num === state.step ? 'active' : (num < state.step ? 'done' : '');
        return '<div class="step-item ' + cls + '">' +
          '<div class="step-num">' + (num < state.step ? '&#10003;' : num) + '</div>' +
          '<div class="step-label">' + label + '</div>' +
        '</div>';
      }).join('<div class="step-line"></div>') +
    '</div>';
  }

  /* ============================================================
     STEP 1: SELECT PACKAGE
     ============================================================ */
  function renderStep1() {
    let html = renderStepIndicator();
    html += '<h2 class="booking-title">Choose Your <span style="color:var(--green-mid)">Package</span></h2>';
    html += '<p class="booking-subtitle">Select the type of booking that fits your event.</p>';
    html += '<div class="package-grid">';

    PACKAGES.forEach(pkg => {
      const selected = state.selectedPackage && state.selectedPackage.id === pkg.id;
      html += '<div class="package-card ' + (selected ? 'selected' : '') + '" data-pkg="' + pkg.id + '">' +
        '<div class="package-name">' + pkg.name + '</div>' +
        '<div class="package-duration">' + pkg.duration + '</div>' +
        '<div class="package-price">R' + pkg.price.toLocaleString() + '</div>' +
        '<div class="package-deposit">50% deposit: R' + pkg.deposit.toLocaleString() + '</div>' +
      '</div>';
    });

    html += '</div>';

    if (state.selectedPackage) {
      html += '<div class="booking-actions"><button class="btn btn--gold btn--lg" id="btn-next-1">Continue to Date Selection</button></div>';
    }

    return html;
  }

  /* ============================================================
     STEP 2: CALENDAR
     ============================================================ */
  function renderStep2() {
    let html = renderStepIndicator();
    html += '<button class="btn-back" id="btn-back-2">&larr; Back to packages</button>';
    html += '<h2 class="booking-title">Pick Your <span style="color:var(--green-mid)">Date & Time</span></h2>';
    html += '<p class="booking-subtitle">Select an available date and time slot for your ' + state.selectedPackage.name + '.</p>';

    // Calendar
    html += renderCalendar();

    // Time slots (show after date selected)
    if (state.selectedDate) {
      const cat = state.selectedPackage.category;
      const slots = TIME_SLOTS.filter(s => s.categories.includes(cat));
      html += '<div class="timeslot-section">';
      html += '<h3 class="timeslot-title">Available Time Slots — ' + formatDate(state.selectedDate) + '</h3>';
      html += '<div class="timeslot-grid">';
      slots.forEach(slot => {
        const sel = state.selectedSlot && state.selectedSlot.id === slot.id;
        html += '<div class="timeslot-card ' + (sel ? 'selected' : '') + '" data-slot="' + slot.id + '">' + slot.label + '</div>';
      });
      html += '</div></div>';
    }

    if (state.selectedDate && state.selectedSlot) {
      html += '<div class="booking-actions"><button class="btn btn--gold btn--lg" id="btn-next-2">Continue to Your Details</button></div>';
    }

    return html;
  }

  function renderCalendar() {
    const year = state.calendarYear;
    const month = state.calendarMonth;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    let html = '<div class="calendar">';
    html += '<div class="calendar-header">';
    html += '<button class="cal-nav" id="cal-prev">&lsaquo;</button>';
    html += '<div class="cal-month">' + monthNames[month] + ' ' + year + '</div>';
    html += '<button class="cal-nav" id="cal-next">&rsaquo;</button>';
    html += '</div>';

    html += '<div class="calendar-grid">';
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
      html += '<div class="cal-dayname">' + d + '</div>';
    });

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="cal-day empty"></div>';
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = formatDateISO(date);
      const isPast = date < today;
      const isBooked = state.bookedDates.includes(dateStr);
      const isSelected = state.selectedDate === dateStr;
      const isSunday = date.getDay() === 0;

      let cls = 'cal-day';
      if (isPast || isBooked || isSunday) cls += ' unavailable';
      if (isSelected) cls += ' selected';
      if (!isPast && !isBooked && !isSunday) cls += ' available';

      html += '<div class="' + cls + '" data-date="' + dateStr + '">' + d + '</div>';
    }

    html += '</div>'; // calendar-grid
    html += '<div class="calendar-legend">';
    html += '<span><span class="legend-dot available"></span> Available</span>';
    html += '<span><span class="legend-dot unavailable"></span> Unavailable</span>';
    html += '<span><span class="legend-dot selected"></span> Selected</span>';
    html += '</div>';
    html += '</div>'; // calendar

    return html;
  }

  /* ============================================================
     STEP 3: YOUR DETAILS
     ============================================================ */
  function renderStep3() {
    const fd = state.formData;
    let html = renderStepIndicator();
    html += '<button class="btn-back" id="btn-back-3">&larr; Back to calendar</button>';
    html += '<h2 class="booking-title">Your <span style="color:var(--green-mid)">Details</span></h2>';
    html += '<p class="booking-subtitle">Fill in your details and accept the venue terms.</p>';

    html += '<form id="booking-details-form">';
    html += '<div class="form-row">';
    html += '<div class="form-group"><label for="b-name">Full Name *</label><input type="text" id="b-name" name="name" required value="' + (fd.name || '') + '" placeholder="Your full name"></div>';
    html += '<div class="form-group"><label for="b-email">Email Address *</label><input type="email" id="b-email" name="email" required value="' + (fd.email || '') + '" placeholder="you@example.com"></div>';
    html += '</div>';
    html += '<div class="form-row">';
    html += '<div class="form-group"><label for="b-phone">Phone Number *</label><input type="tel" id="b-phone" name="phone" required value="' + (fd.phone || '') + '" placeholder="+27 000 000 0000"></div>';
    html += '<div class="form-group"><label for="b-company">Company / Organisation</label><input type="text" id="b-company" name="company" value="' + (fd.company || '') + '" placeholder="Optional"></div>';
    html += '</div>';
    html += '<div class="form-group"><label for="b-guests">Number of Guests *</label><input type="number" id="b-guests" name="guests" required min="1" max="40" value="' + (fd.guests || '') + '" placeholder="1–40"></div>';
    html += '<div class="form-group"><label for="b-requirements">Special Requirements</label><textarea id="b-requirements" name="requirements" placeholder="Catering, AV, seating layout, accessibility...">' + (fd.requirements || '') + '</textarea></div>';

    // T&C
    html += '<div class="tc-box">';
    html += '<label class="tc-label"><input type="checkbox" id="tc-accept" required> ';
    html += 'I have read and agree to the <a href="terms.html" target="_blank">Venue Hire Terms & Conditions</a>, ';
    html += 'including the cancellation policy, alcohol policy, and damage deposit. ';
    html += 'I understand that a <strong>50% deposit (R' + state.selectedPackage.deposit.toLocaleString() + ')</strong> is required to confirm my booking.</label>';
    html += '</div>';

    html += '<div class="booking-actions"><button type="submit" class="btn btn--gold btn--lg">Review & Proceed to Payment</button></div>';
    html += '</form>';

    return html;
  }

  /* ============================================================
     STEP 4: REVIEW & PAY
     ============================================================ */
  function renderStep4() {
    const pkg = state.selectedPackage;
    const fd = state.formData;
    let html = renderStepIndicator();
    html += '<button class="btn-back" id="btn-back-4">&larr; Back to details</button>';
    html += '<h2 class="booking-title">Review & <span style="color:var(--green-mid)">Pay Deposit</span></h2>';

    html += '<div class="review-card">';
    html += '<h3>Booking Summary</h3>';
    html += '<table class="review-table">';
    html += '<tr><td>Package</td><td><strong>' + pkg.name + '</strong></td></tr>';
    html += '<tr><td>Date</td><td><strong>' + formatDate(state.selectedDate) + '</strong></td></tr>';
    html += '<tr><td>Time</td><td><strong>' + state.selectedSlot.label + '</strong></td></tr>';
    html += '<tr><td>Guests</td><td><strong>' + fd.guests + '</strong></td></tr>';
    html += '<tr><td>Name</td><td>' + fd.name + '</td></tr>';
    html += '<tr><td>Email</td><td>' + fd.email + '</td></tr>';
    html += '<tr><td>Phone</td><td>' + fd.phone + '</td></tr>';
    if (fd.company) html += '<tr><td>Company</td><td>' + fd.company + '</td></tr>';
    if (fd.requirements) html += '<tr><td>Requirements</td><td>' + fd.requirements + '</td></tr>';
    html += '</table>';

    html += '<div class="review-total">';
    html += '<div class="review-line"><span>Total venue hire</span><span>R' + pkg.price.toLocaleString() + '</span></div>';
    html += '<div class="review-line deposit"><span>50% Deposit due now</span><span>R' + pkg.deposit.toLocaleString() + '</span></div>';
    html += '<div class="review-line"><span>Balance due 48hrs before event</span><span>R' + (pkg.price - pkg.deposit).toLocaleString() + '</span></div>';
    html += '</div>';
    html += '</div>';

    // PayFast form
    const c = cfg();
    if (c.payfastMerchantId) {
      html += '<form action="https://www.payfast.co.za/eng/process" method="POST" id="payfast-form">';
      html += '<input type="hidden" name="merchant_id" value="' + c.payfastMerchantId + '">';
      html += '<input type="hidden" name="merchant_key" value="' + c.payfastMerchantKey + '">';
      html += '<input type="hidden" name="return_url" value="' + window.location.origin + '/booking-confirmed.html">';
      html += '<input type="hidden" name="cancel_url" value="' + window.location.origin + '/booking.html">';
      html += '<input type="hidden" name="notify_url" value="">'; // ITN webhook — set when you have a server
      html += '<input type="hidden" name="name_first" value="' + fd.name.split(' ')[0] + '">';
      html += '<input type="hidden" name="name_last" value="' + (fd.name.split(' ').slice(1).join(' ') || '') + '">';
      html += '<input type="hidden" name="email_address" value="' + fd.email + '">';
      html += '<input type="hidden" name="cell_number" value="' + fd.phone.replace(/[^0-9]/g, '') + '">';
      html += '<input type="hidden" name="m_payment_id" value="HS-' + Date.now() + '">';
      html += '<input type="hidden" name="amount" value="' + pkg.deposit.toFixed(2) + '">';
      html += '<input type="hidden" name="item_name" value="Hope Station — ' + pkg.name + ' Deposit">';
      html += '<input type="hidden" name="item_description" value="50% deposit for ' + pkg.name + ' on ' + formatDate(state.selectedDate) + '">';
      html += '<input type="hidden" name="custom_str1" value="' + state.selectedDate + '">';
      html += '<input type="hidden" name="custom_str2" value="' + state.selectedSlot.id + '">';
      html += '<input type="hidden" name="custom_str3" value="' + pkg.id + '">';
      html += '<div class="booking-actions">';
      html += '<button type="submit" class="btn btn--gold btn--lg" id="btn-pay">Pay R' + pkg.deposit.toLocaleString() + ' Deposit via PayFast</button>';
      html += '</div>';
      html += '<p class="pay-note">You will be redirected to PayFast\'s secure payment page.</p>';
      html += '</form>';
    } else {
      // PayFast not configured — show manual payment instructions
      html += '<div class="pay-manual">';
      html += '<h3>Pay Your Deposit</h3>';
      html += '<p>To confirm your booking, please pay the <strong>R' + pkg.deposit.toLocaleString() + '</strong> deposit via EFT:</p>';
      html += '<div class="bank-details">';
      html += '<p><strong>Account Name:</strong> Hope Station</p>';
      html += '<p><strong>Bank:</strong> TBC</p>';
      html += '<p><strong>Account Number:</strong> TBC</p>';
      html += '<p><strong>Branch Code:</strong> TBC</p>';
      html += '<p><strong>Reference:</strong> HS-' + Date.now() + '</p>';
      html += '</div>';
      html += '<p>Alternatively, <a href="https://wa.me/27000000000" style="color:var(--green-mid);font-weight:600;">WhatsApp us</a> and we\'ll send you a payment link.</p>';
      html += '<div class="booking-actions"><button class="btn btn--gold btn--lg" id="btn-confirm-manual">I\'ve Made the Payment</button></div>';
      html += '</div>';
    }

    return html;
  }

  /* ============================================================
     RENDER ENGINE
     ============================================================ */
  function render() {
    let html = '';
    switch (state.step) {
      case 1: html = renderStep1(); break;
      case 2: html = renderStep2(); break;
      case 3: html = renderStep3(); break;
      case 4: html = renderStep4(); break;
    }
    stepsContainer.innerHTML = html;
    bindEvents();
    stepsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ============================================================
     EVENT BINDING
     ============================================================ */
  function bindEvents() {
    // Step 1: Package selection
    document.querySelectorAll('.package-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-pkg');
        state.selectedPackage = PACKAGES.find(p => p.id === id);
        state.selectedSlot = null; // reset slot when package changes
        render();
      });
    });

    // Step 1: Next
    const btn1 = document.getElementById('btn-next-1');
    if (btn1) btn1.addEventListener('click', () => { state.step = 2; render(); });

    // Step 2: Calendar nav
    const prevBtn = document.getElementById('cal-prev');
    const nextBtn = document.getElementById('cal-next');
    if (prevBtn) prevBtn.addEventListener('click', () => {
      state.calendarMonth--;
      if (state.calendarMonth < 0) { state.calendarMonth = 11; state.calendarYear--; }
      render();
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
      state.calendarMonth++;
      if (state.calendarMonth > 11) { state.calendarMonth = 0; state.calendarYear++; }
      render();
    });

    // Step 2: Date selection
    document.querySelectorAll('.cal-day.available').forEach(day => {
      day.addEventListener('click', () => {
        state.selectedDate = day.getAttribute('data-date');
        state.selectedSlot = null;
        render();
      });
    });

    // Step 2: Time slot selection
    document.querySelectorAll('.timeslot-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-slot');
        state.selectedSlot = TIME_SLOTS.find(s => s.id === id);
        render();
      });
    });

    // Step 2: Next
    const btn2 = document.getElementById('btn-next-2');
    if (btn2) btn2.addEventListener('click', () => { state.step = 3; render(); });

    // Step 3: Form submit
    const form3 = document.getElementById('booking-details-form');
    if (form3) {
      form3.addEventListener('submit', (e) => {
        e.preventDefault();
        const tc = document.getElementById('tc-accept');
        if (!tc || !tc.checked) {
          alert('Please read and accept the Terms & Conditions.');
          return;
        }
        // Save form data
        state.formData = {
          name: document.getElementById('b-name').value,
          email: document.getElementById('b-email').value,
          phone: document.getElementById('b-phone').value,
          company: document.getElementById('b-company').value,
          guests: document.getElementById('b-guests').value,
          requirements: document.getElementById('b-requirements').value,
        };
        // Save to Airtable
        saveToAirtable();
        state.step = 4;
        render();
      });
    }

    // Back buttons
    const back2 = document.getElementById('btn-back-2');
    const back3 = document.getElementById('btn-back-3');
    const back4 = document.getElementById('btn-back-4');
    if (back2) back2.addEventListener('click', () => { state.step = 1; render(); });
    if (back3) back3.addEventListener('click', () => { state.step = 2; render(); });
    if (back4) back4.addEventListener('click', () => { state.step = 3; render(); });

    // PayFast form pre-submit: also save to Airtable
    const pfForm = document.getElementById('payfast-form');
    if (pfForm) {
      pfForm.addEventListener('submit', () => {
        // Let the form submit normally to PayFast
      });
    }

    // Manual payment confirmation
    const btnManual = document.getElementById('btn-confirm-manual');
    if (btnManual) {
      btnManual.addEventListener('click', () => {
        window.location.href = 'booking-confirmed.html';
      });
    }
  }

  /* ============================================================
     AIRTABLE SAVE
     ============================================================ */
  async function saveToAirtable() {
    const c = cfg();
    if (!c.airtableToken || !c.airtableBaseId) return;

    const pkg = state.selectedPackage;
    const fd = state.formData;
    const data = {
      Name: fd.name,
      Email: fd.email,
      Phone: fd.phone,
      Company: fd.company || '',
      'Event Type': pkg.name,
      'Preferred Date': state.selectedDate,
      'Time Slot': state.selectedSlot.label,
      'Guest Count': parseInt(fd.guests) || 0,
      Requirements: fd.requirements || '',
      'T&C Accepted': true,
      'T&C Accepted At': new Date().toISOString(),
      Status: 'New',
      'Quote Amount': pkg.price,
      Source: 'Website'
    };

    try {
      const table = encodeURIComponent(c.airtableTableName || 'Enquiries');
      await fetch('https://api.airtable.com/v0/' + c.airtableBaseId + '/' + table, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + c.airtableToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ records: [{ fields: data }] })
      });
    } catch (err) {
      console.warn('Airtable save failed:', err);
    }
  }

  /* ============================================================
     FETCH BOOKED DATES FROM AIRTABLE
     ============================================================ */
  async function fetchBookedDates() {
    const c = cfg();
    if (!c.airtableToken || !c.airtableBaseId) return;

    try {
      const table = encodeURIComponent('Calendar');
      const filter = encodeURIComponent('AND({Status}="Booked")');
      const res = await fetch(
        'https://api.airtable.com/v0/' + c.airtableBaseId + '/' + table + '?filterByFormula=' + filter + '&fields[]=Date',
        { headers: { 'Authorization': 'Bearer ' + c.airtableToken } }
      );
      if (res.ok) {
        const data = await res.json();
        state.bookedDates = data.records.map(r => r.fields.Date).filter(Boolean);
        render();
      }
    } catch (err) {
      console.warn('Could not fetch booked dates:', err);
    }
  }

  /* ============================================================
     HELPERS
     ============================================================ */
  function formatDateISO(date) {
    return date.getFullYear() + '-' +
      String(date.getMonth() + 1).padStart(2, '0') + '-' +
      String(date.getDate()).padStart(2, '0');
  }

  function formatDate(isoStr) {
    const d = new Date(isoStr + 'T00:00:00');
    return d.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* ============================================================
     INIT
     ============================================================ */
  render();
  fetchBookedDates();

})();
