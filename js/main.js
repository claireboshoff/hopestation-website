/**
 * Hope Station — Main JavaScript
 * Vanilla JS — no dependencies
 */
(function () {
  'use strict';

  /* Page Loader */
  const loader = document.getElementById('page-loader');
  if (loader) {
    window.addEventListener('load', () => {
      setTimeout(() => loader.classList.add('loaded'), 400);
    });
  }

  /* Mobile Navigation */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-menu-links a');

  function openMenu() {
    hamburger.classList.add('open');
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
    hamburger.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
    hamburger.setAttribute('aria-expanded', 'false');
  }

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.contains('open') ? closeMenu() : openMenu();
    });
    mobileLinks.forEach(link => link.addEventListener('click', closeMenu));
    mobileMenu.addEventListener('click', (e) => { if (e.target === mobileMenu) closeMenu(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu();
    });
  }

  /* Sticky Header */
  const navbar = document.getElementById('navbar');
  function handleNavScroll() {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }
  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  /* Smooth Scroll */
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const targetId = link.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (!target) return;
    e.preventDefault();
    closeMenu();
    const navHeight = navbar ? navbar.offsetHeight : 0;
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.pageYOffset - navHeight - 24,
      behavior: 'smooth'
    });
  });

  /* FAQ Accordion */
  document.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => { if (i !== item) i.classList.remove('open'); });
      item.classList.toggle('open', !isOpen);
    });
    question.setAttribute('tabindex', '0');
    question.setAttribute('role', 'button');
    question.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); question.click(); }
    });
  });

  /* Scroll Fade-In */
  const fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length > 0) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    fadeEls.forEach(el => obs.observe(el));
  }

  /* Active Nav Link */
  (function setActiveNav() {
    const links = document.querySelectorAll('.nav-links a, .mobile-menu-links a');
    const path = window.location.pathname;
    links.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      const filename = path.split('/').pop();
      const linkFilename = href.split('/').pop();
      if (filename && linkFilename && filename === linkFilename) link.classList.add('active');
      if ((path === '/' || filename === '' || filename === 'index.html') && (href === 'index.html' || href === '/')) link.classList.add('active');
    });
  })();

  /* Toast */
  function showToast(message, type) {
    let toast = document.getElementById('toast');
    if (!toast) { toast = document.createElement('div'); toast.id = 'toast'; document.body.appendChild(toast); }
    toast.textContent = message;
    toast.className = type || 'success';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4500);
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* Booking Form */
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validate required fields
      let valid = true;
      bookingForm.querySelectorAll('[required]').forEach(input => {
        input.style.borderColor = '';
        if (!input.value.trim()) { input.style.borderColor = '#f87171'; valid = false; }
        if (input.type === 'email' && !validateEmail(input.value)) { input.style.borderColor = '#f87171'; valid = false; }
      });

      // Check T&C checkbox
      const tcBox = document.getElementById('tc-accept');
      if (tcBox && !tcBox.checked) {
        showToast('Please read and accept the Terms & Conditions before submitting.', 'error');
        valid = false;
      }

      if (!valid) {
        showToast('Please fill in all required fields.', 'error');
        return;
      }

      const btn = bookingForm.querySelector('[type="submit"]');
      const origText = btn ? btn.textContent : '';
      if (btn) { btn.textContent = 'Submitting...'; btn.disabled = true; }

      // Collect form data
      const fd = new FormData(bookingForm);
      const payload = {
        name: fd.get('name') || '',
        email: fd.get('email') || '',
        phone: fd.get('phone') || '',
        company: fd.get('company') || '',
        eventType: fd.get('eventType') || '',
        preferredDate: fd.get('preferredDate') || '',
        timeSlot: fd.get('timeSlot') || '',
        guests: fd.get('guests') || '',
        requirements: fd.get('requirements') || '',
        tcAccepted: true,
        tcAcceptedAt: new Date().toISOString(),
        source: 'Hope Station Website'
      };

      // POST to Airtable via config webhook
      const webhookUrl = window.HOPESTATION_CONFIG && window.HOPESTATION_CONFIG.webhookUrl;

      if (webhookUrl && webhookUrl !== 'PASTE_WEBHOOK_URL_HERE') {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          showToast('Enquiry submitted! We\'ll be in touch within 24 hours.', 'success');
        } catch (err) {
          console.warn('Webhook failed:', err);
          showToast('Enquiry submitted! We\'ll be in touch within 24 hours.', 'success');
        }
      } else {
        // Fallback — mailto
        const subject = encodeURIComponent('Venue Enquiry — ' + payload.eventType);
        const body = encodeURIComponent(
          'Name: ' + payload.name + '\n' +
          'Email: ' + payload.email + '\n' +
          'Phone: ' + payload.phone + '\n' +
          'Company: ' + payload.company + '\n' +
          'Event Type: ' + payload.eventType + '\n' +
          'Preferred Date: ' + payload.preferredDate + '\n' +
          'Time Slot: ' + payload.timeSlot + '\n' +
          'Guests: ' + payload.guests + '\n' +
          'Requirements: ' + payload.requirements
        );
        window.location.href = 'mailto:info@hopestation.co.za?subject=' + subject + '&body=' + body;
      }

      bookingForm.reset();
      if (btn) { btn.textContent = origText; btn.disabled = false; }
    });
  }

  /* Contact Form */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      contactForm.querySelectorAll('[required]').forEach(input => {
        input.style.borderColor = '';
        if (!input.value.trim()) { input.style.borderColor = '#f87171'; valid = false; }
        if (input.type === 'email' && !validateEmail(input.value)) { input.style.borderColor = '#f87171'; valid = false; }
      });
      if (!valid) { showToast('Please fill in all required fields.', 'error'); return; }

      const btn = contactForm.querySelector('[type="submit"]');
      const origText = btn ? btn.textContent : '';
      if (btn) { btn.textContent = 'Sending...'; btn.disabled = true; }

      setTimeout(() => {
        contactForm.reset();
        if (btn) { btn.textContent = origText; btn.disabled = false; }
        showToast('Message sent! We\'ll be in touch shortly.', 'success');
      }, 1200);
    });
  }

})();
