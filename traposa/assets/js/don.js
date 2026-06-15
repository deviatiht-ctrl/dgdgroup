// TRAPOSA Donation Page JavaScript
// Payment routing:
//   moncash / natcash / kashpaw / all  → Automatic via PLOP PLOP API (redirect)
//   stripe                              → Stripe card form (manual, client-side)
//   bank / other                        → Manual instructions shown

const PLOP_METHODS = new Set(['moncash', 'natcash', 'kashpaw', 'all']);

function tr(key, vars = {}) {
  let value = (typeof t === 'function') ? t(key) : key;
  Object.entries(vars).forEach(([name, replacement]) => {
    value = value.replaceAll(`{${name}}`, replacement);
  });
  return value;
}

document.addEventListener('DOMContentLoaded', () => {
  initCauseSelection();
  initAmountSelection();
  initCurrencySelector();
  initDonationForm();
  loadRecentDonations();
  loadCauses();
  loadPaymentMethods();
});

// Load causes from Supabase
async function loadCauses() {
  try {
    const { data: causes, error } = await supabase
      ?.from('traposa_causes')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    if (causes && causes.length > 0) {
      renderCauses(causes);
    }
  } catch (error) {
    console.error('Error loading causes:', error);
  }
}

// Render cause cards
function renderCauses(causes) {
  const container = document.querySelector('.causes-grid');
  if (!container) return;

  container.innerHTML = causes.map(cause => `
    <div class="cause-card" data-cause-id="${cause.id}" data-cause-name="${cause.name}">
      <div class="cause-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${getCauseIcon(cause.icon)}
        </svg>
      </div>
      <div class="cause-info">
        <h4>${cause.name}</h4>
        <p>${cause.description || ''}</p>
      </div>
      ${cause.goal_amount ? `
        <div class="cause-progress">
          <div class="cause-progress-bar">
            <div class="progress-fill" style="width: ${Math.min((cause.raised_amount || 0) / cause.goal_amount * 100, 100)}%"></div>
          </div>
          <div class="cause-progress-text">${formatCurrency(cause.raised_amount || 0)} / ${formatCurrency(cause.goal_amount)}</div>
        </div>
      ` : ''}
    </div>
  `).join('');

  // Re-initialize selection on new elements
  initCauseSelection();
}

// Get cause icon SVG paths
function getCauseIcon(iconName) {
  const icons = {
    'AlertTriangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>',
    'BookOpen': '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    'Sprout': '<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7"/><path d="M14.1 6a7 7 0 0 0-5.2 2.4"/>',
    'Heart': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    'default': '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/>'
  };
  return icons[iconName] || icons.default;
}

// Format currency
function formatCurrency(amount, currency = 'G') {
  return `${currency}${(amount || 0).toLocaleString()}`;
}

// Cause selection
function initCauseSelection() {
  const causeCards = document.querySelectorAll('.cause-card');

  causeCards.forEach(card => {
    card.addEventListener('click', () => {
      causeCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      updateSummary();
    });
  });
}

// Amount selection
function initAmountSelection() {
  const amountButtons = document.querySelectorAll('.amount-btn');
  const customInput = document.querySelector('.amount-custom input');

  amountButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      amountButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      
      if (customInput) {
        customInput.value = btn.dataset.amount;
      }
      
      updateSummary();
    });
  });

  if (customInput) {
    customInput.addEventListener('input', () => {
      amountButtons.forEach(b => b.classList.remove('selected'));
      updateSummary();
    });
  }
}

// Currency selector
function initCurrencySelector() {
  const currencyButtons = document.querySelectorAll('.currency-btn');
  
  currencyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currencyButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      updateSummary();
    });
  });
}

// Load payment methods from Supabase
async function loadPaymentMethods() {
  try {
    const { data, error } = await supabase
      ?.from('traposa_payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      renderPaymentMethods(data);
    } else {
      renderDefaultPaymentMethods();
    }
  } catch (err) {
    console.warn('Payment methods table not found, using defaults:', err.message);
    renderDefaultPaymentMethods();
  }
}

// Fallback static methods if table doesn't exist yet
function renderDefaultPaymentMethods() {
  renderPaymentMethods([
    { id: 'moncash', type: 'moncash', name: 'MonCash',        icon_name: 'smartphone',  is_active: true, is_automatic: true },
    { id: 'natcash', type: 'natcash', name: 'NatCash',        icon_name: 'wallet',      is_active: true, is_automatic: true },
    { id: 'stripe',  type: 'stripe',  name: 'Kat Kredi',      icon_name: 'credit-card', is_active: true, is_automatic: false },
  ]);
}

// Render payment method cards dynamically
function renderPaymentMethods(methods) {
  const container = document.querySelector('.payment-methods');
  if (!container) return;

  window._paymentMethods = methods;

  container.innerHTML = methods.map((m, idx) => {
    const isAutomatic = m.is_automatic || PLOP_METHODS.has(m.type);
    const badge = isAutomatic
      ? `<span class="pm-auto-badge"><i data-lucide="zap" style="width:11px;height:11px;"></i> Auto</span>`
      : '';
    return `
    <label class="payment-method ${idx === 0 ? 'selected' : ''}" data-method-id="${m.id}">
      <input type="radio" name="payment" value="${m.type}" ${idx === 0 ? 'checked' : ''}>
      <div class="payment-icon">
        ${m.logo_url
          ? `<img src="${m.logo_url}" alt="${m.name}" style="width:26px;height:26px;object-fit:contain;" onerror="this.style.display='none'">`
          : `<i data-lucide="${m.icon_name || 'credit-card'}"></i>`
        }
      </div>
      <span class="payment-label">${m.name}</span>
      ${badge}
    </label>`;
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();

  // Show info for first method right away
  if (methods.length > 0) showPaymentInfo(methods[0]);

  initPaymentMethods();
}

// Re-attach click events after dynamic render
function initPaymentMethods() {
  const paymentMethods = document.querySelectorAll('.payment-method');

  paymentMethods.forEach(method => {
    method.addEventListener('click', () => {
      paymentMethods.forEach(m => m.classList.remove('selected'));
      method.classList.add('selected');

      const radio = method.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;

      const methodId = method.dataset.methodId;
      const methodData = window._paymentMethods?.find(m => m.id === methodId);
      if (methodData) {
        showPaymentInfo(methodData);
      } else if (radio?.value === 'stripe') {
        const cardSection = document.getElementById('stripe-card-section');
        if (cardSection) cardSection.style.display = 'block';
        const infoBox = document.getElementById('payment-info-box');
        if (infoBox) infoBox.style.display = 'none';
      }
    });
  });
}

// Show correct UI panel based on selected payment method
function showPaymentInfo(method) {
  const infoBox     = document.getElementById('payment-info-box');
  const cardSection = document.getElementById('stripe-card-section');
  const plopSection = document.getElementById('plop-redirect-section');

  // Hide all panels first
  if (cardSection) cardSection.style.display = 'none';
  if (plopSection) plopSection.style.display = 'none';
  if (infoBox)     infoBox.style.display     = 'none';

  const isAutomatic = method.is_automatic || PLOP_METHODS.has(method.type);

  if (method.type === 'stripe') {
    // Stripe card form
    if (cardSection) cardSection.style.display = 'block';
    return;
  }

  if (isAutomatic) {
    // PLOP PLOP automatic redirect — show PLOP info panel
    if (plopSection) {
      plopSection.style.display = 'block';
      const nameEl = plopSection.querySelector('.plop-method-name');
      const iconEl = plopSection.querySelector('.plop-method-icon');
      if (nameEl) nameEl.textContent = method.name;
      if (iconEl) {
        iconEl.innerHTML = method.logo_url
          ? `<img src="${method.logo_url}" alt="${method.name}" style="width:32px;height:32px;object-fit:contain;">`
          : `<i data-lucide="${method.icon_name || 'smartphone'}"></i>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    }
    return;
  }

  // Manual methods (bank, other) — show account details
  const hasDetails = method.account_name || method.account_number || method.instructions;
  if (!hasDetails || !infoBox) return;

  infoBox.style.display = 'flex';
  infoBox.innerHTML = `
    <div class="payment-info-icon">
      ${method.logo_url
        ? `<img src="${method.logo_url}" alt="${method.name}" class="payment-info-logo" onerror="this.style.display='none'">`
        : `<i data-lucide="${method.icon_name || 'credit-card'}"></i>`
      }
    </div>
    <div class="payment-info-details">
      <h4>${method.name}</h4>
      ${method.account_name ? `
        <div class="payment-info-account-row">
          <span class="payment-info-label">Nom du compte:</span>
          <span class="payment-info-value">${method.account_name}</span>
        </div>` : ''}
      ${method.account_number ? `
        <div class="payment-info-account-row">
          <span class="payment-info-label">Numéro:</span>
          <span class="payment-info-value">${method.account_number}</span>
          <button class="payment-copy-btn" onclick="copyToClipboard('${method.account_number}')" title="Copier">
            <i data-lucide="copy"></i>
          </button>
        </div>` : ''}
      ${method.instructions ? `<p class="payment-info-instructions">${method.instructions}</p>` : ''}
    </div>
  `;
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Copy number to clipboard
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.payment-copy-btn');
    if (btn) {
      btn.innerHTML = '<i data-lucide="check"></i>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      setTimeout(() => {
        btn.innerHTML = '<i data-lucide="copy"></i>';
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }, 2000);
    }
  }).catch(() => {});
}

// Update donation summary
function updateSummary() {
  const selectedCause = document.querySelector('.cause-card.selected');
  const amount = getSelectedAmount();
  const currency = document.querySelector('.currency-btn.selected')?.dataset.currency || 'HTG';
  
  const summaryCause = document.querySelector('.summary-cause');
  const summaryAmount = document.querySelector('.summary-amount');
  const summaryTotal = document.querySelector('.summary-total .summary-value');
  
  if (summaryCause) {
    summaryCause.textContent = selectedCause?.querySelector('h4')?.textContent || 'Jeneral TRAPOSA';
  }
  
  if (summaryAmount) {
    summaryAmount.textContent = formatAmount(amount, currency);
  }
  
  if (summaryTotal) {
    summaryTotal.textContent = formatAmount(amount, currency);
  }
}

// Get selected amount
function getSelectedAmount() {
  const selectedBtn = document.querySelector('.amount-btn.selected');
  const customInput = document.querySelector('.amount-custom input');
  
  if (selectedBtn) {
    return parseFloat(selectedBtn.dataset.amount) || 0;
  }
  
  if (customInput && customInput.value) {
    return parseFloat(customInput.value) || 0;
  }
  
  return 0;
}

// Format amount with currency
function formatAmount(amount, currency) {
  const symbols = { HTG: 'G', USD: '$', EUR: '€' };
  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toLocaleString()}`;
}

// Donation form submission
function initDonationForm() {
  const submitBtn = document.querySelector('.submit-donation-btn');
  if (!submitBtn) return;

  submitBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const selectedCause   = document.querySelector('.cause-card.selected');
    const selectedPayment = document.querySelector('.payment-method.selected input');
    const amount          = getSelectedAmount();
    const currency        = document.querySelector('.currency-btn.selected')?.dataset.currency || 'HTG';
    const donorName       = document.querySelector('input[name="donor_name"]')?.value  || null;
    const donorEmail      = document.querySelector('input[name="donor_email"]')?.value || null;
    const donorPhone      = document.querySelector('input[name="donor_phone"]')?.value || null;
    const isAnonymous     = document.querySelector('input[name="is_anonymous"]')?.checked || false;

    if (!amount || amount <= 0) {
      showError(tr('don_error_amount_required'));
      return;
    }
    if (!selectedPayment) {
      showError(tr('don_error_payment_required'));
      return;
    }

    const paymentType = selectedPayment.value;
    const isPlop      = PLOP_METHODS.has(paymentType);
    const isStripe    = paymentType === 'stripe';

    if (isStripe && !window.stripeUtils?.isReady()) {
      showError(tr('don_error_stripe_unavailable'));
      return;
    }

    // For PLOP methods, amount must be in HTG (minimum 20)
    if (isPlop && currency !== 'HTG') {
      showError(tr('don_error_plop_htg_only'));
      return;
    }
    if (isPlop && amount < 20) {
      showError(tr('don_error_plop_minimum'));
      return;
    }

    const donationData = {
      donor_name:     donorName,
      donor_email:    donorEmail,
      donor_phone:    donorPhone,
      amount,
      currency,
      payment_method: paymentType,
      cause_id:       selectedCause?.dataset.causeId   || null,
      cause_name:     selectedCause?.dataset.causeName || 'TRAPOSA Général',
      is_anonymous:   isAnonymous,
      status:         'pending',
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span style="opacity:0.7;">${tr('don_processing_payment')}</span>`;

    try {
      // ── PLOP PLOP automatic redirect ───────────────────────────────────
      if (isPlop) {
        // 1. Save a pending donation record first to get an ID
        const { data: don, error: donErr } = await supabase
          ?.from('traposa_donations')
          .insert([donationData])
          .select('id')
          .single();
        if (donErr) throw donErr;

        // 2. Call plop-payment Edge Function to initiate the transaction
        const edgeUrl = `${window.SUPABASE_URL}/functions/v1/plop-payment`;
        const plopRes = await fetch(edgeUrl, {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action:         'initiate',
            amount,
            payment_method: paymentType,
            donation_id:    don?.id,
            donor_name:     donorName,
            donor_email:    donorEmail,
          }),
        });

        const plopData = await plopRes.json();
        if (!plopRes.ok || !plopData.success) {
          throw new Error(plopData.error || tr('don_error_plop_generic'));
        }

        // 3. Link the PLOP transaction record to the donation
        if (plopData.plop_record_id && don?.id) {
          await supabase
            ?.from('traposa_donations')
            .update({ plop_transaction_id: plopData.plop_record_id })
            .eq('id', don.id);
        }

        // 4. Show the PLOP redirect panel with the payment URL
        showPlopRedirect({
          url:          plopData.url,
          referenceId:  plopData.reference_id,
          donationId:   don?.id,
          methodName:   document.querySelector('.payment-method.selected .payment-label')?.textContent || paymentType,
          amount,
        });

        return; // Submit button re-enabled inside showPlopRedirect
      }

      // ── Stripe card payment ────────────────────────────────────────────
      if (isStripe) {
        const paymentIntent = await window.stripeUtils.confirmPayment({
          amount, currency, donorEmail, donorName,
          causeName: donationData.cause_name,
        });
        donationData.stripe_payment_intent_id = paymentIntent.id;
        donationData.status = 'confirmed';
      }

      // ── Save donation (Stripe or manual bank/other) ────────────────────
      const { data, error } = await supabase
        ?.from('traposa_donations')
        .insert([donationData])
        .select()
        .single();
      if (error) throw error;

      showSuccessModal(donationData, data?.id);

    } catch (err) {
      console.error('Error processing donation:', err);
      showError(err.message || tr('don_error_generic'));
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i data-lucide="lock" style="width: 18px; height: 18px;"></i><span>${tr('don_submit')}</span>`;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  });
}

// ── PLOP in-page overlay + popup + auto-poll ─────────────────────────────
// Opens the PLOP payment URL in a small popup window.
// An overlay stays on the main page showing a spinner + polling every 3s.
// When payment confirmed (or popup closed): overlay updates automatically.

let _plopPollTimer  = null;
let _plopPollCount  = 0;
const PLOP_POLL_MAX = 80; // 80 × 3s = 4 minutes max

function showPlopRedirect({ url, referenceId, donationId, methodName, amount }) {
  const submitBtn = document.querySelector('.submit-donation-btn');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i data-lucide="lock" style="width:18px;height:18px;"></i><span>${tr('don_submit')}</span>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // Create/show full-page overlay
  _showPlopOverlay(methodName, amount, referenceId, donationId);

  // Open payment in popup (triggered by btn click already in progress — allowed)
  const popup = window.open(
    url,
    'plop_payment',
    'width=500,height=750,left=' + Math.round((screen.width - 500) / 2) +
    ',top=' + Math.round((screen.height - 750) / 2) +
    ',resizable=yes,scrollbars=yes'
  );

  if (!popup || popup.closed) {
    // Popup blocked — show fallback link inside overlay
    const hint = document.getElementById('plopOverlayHint');
    if (hint) hint.innerHTML = `
      ${tr('plop_popup_blocked')} <a href="${url}" target="_blank" rel="noopener" class="btn btn-primary" style="margin-top:.5rem;display:inline-flex;gap:.4rem;">
        <i data-lucide="external-link"></i> ${tr('plop_open_payment')}
      </a>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // Start auto-polling every 3 seconds
  _plopPollCount = 0;
  clearInterval(_plopPollTimer);
  _plopPollTimer = setInterval(async () => {
    _plopPollCount++;

    // Close popup check
    const popupClosed = !popup || popup.closed;

    const confirmed = await _callPlopVerify(referenceId);

    if (confirmed) {
      clearInterval(_plopPollTimer);
      if (!popupClosed) { try { popup.close(); } catch(_) {} }
      _hidePlopOverlay();
      showSuccessModal({ payment_method: 'plop', amount, currency: 'HTG' }, donationId);
      return;
    }

    // Popup closed without paying
    if (popupClosed) {
      clearInterval(_plopPollTimer);
      const hint = document.getElementById('plopOverlayHint');
      if (hint) hint.innerHTML = tr('plop_window_closed');
      const manualBtn = document.getElementById('plopManualVerify');
      if (manualBtn) manualBtn.style.display = 'inline-flex';
      const spinner = document.getElementById('plopSpinner');
      if (spinner) spinner.style.display = 'none';
      return;
    }

    // Timeout
    if (_plopPollCount >= PLOP_POLL_MAX) {
      clearInterval(_plopPollTimer);
      const hint = document.getElementById('plopOverlayHint');
      if (hint) hint.innerHTML = tr('plop_timeout');
      const manualBtn = document.getElementById('plopManualVerify');
      if (manualBtn) manualBtn.style.display = 'inline-flex';
      const spinner = document.getElementById('plopSpinner');
      if (spinner) spinner.style.display = 'none';
    }
  }, 3000);
}

function _showPlopOverlay(methodName, amount, referenceId, donationId) {
  let overlay = document.getElementById('plopPaymentOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'plopPaymentOverlay';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div class="plop-overlay-backdrop"></div>
    <div class="plop-overlay-card">
      <div id="plopSpinner" class="plop-overlay-spinner">
        <svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#2d6a4f" stroke-width="4" stroke-dasharray="100 28" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite"/></circle></svg>
      </div>
      <h3 class="plop-overlay-title">${tr('plop_overlay_title', { method: methodName })}</h3>
      <p class="plop-overlay-amount">G${Number(amount).toLocaleString()} HTG</p>
      <p id="plopOverlayHint" class="plop-overlay-hint">${tr('plop_overlay_hint')}</p>
      <button id="plopManualVerify" class="btn btn-primary" style="display:none;margin-top:1rem;" onclick="_manualVerify('${referenceId}','${donationId || ''}')">
        ${tr('plop_verify_payment')}
      </button>
      <button class="plop-overlay-cancel" onclick="_cancelPlopOverlay()">× ${tr('plop_cancel')}</button>
    </div>
  `;
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function _hidePlopOverlay() {
  const overlay = document.getElementById('plopPaymentOverlay');
  if (overlay) overlay.style.display = 'none';
  document.body.style.overflow = '';
}

function _cancelPlopOverlay() {
  clearInterval(_plopPollTimer);
  _hidePlopOverlay();
}

async function _callPlopVerify(referenceId) {
  try {
    const res = await fetch(`${window.SUPABASE_URL}/functions/v1/plop-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ action: 'verify', reference_id: referenceId }),
    });
    const data = await res.json();
    return data.confirmed === true;
  } catch { return false; }
}

async function _manualVerify(referenceId, donationId) {
  const btn = document.getElementById('plopManualVerify');
  if (btn) { btn.disabled = true; btn.textContent = tr('plop_verifying'); }
  const confirmed = await _callPlopVerify(referenceId);
  if (confirmed) {
    _hidePlopOverlay();
    showSuccessModal({ payment_method: 'plop', currency: 'HTG' }, donationId);
  } else {
    const hint = document.getElementById('plopOverlayHint');
    if (hint) hint.innerHTML = `<strong style="color:#f59e0b;">${tr('plop_not_confirmed')}</strong>`;
    if (btn) { btn.disabled = false; btn.textContent = tr('plop_verify_again'); }
  }
}

// Show success modal
function showSuccessModal(donation, donationId) {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.classList.add('active');
  }

  // Could update modal content with donation details
  console.log('Donation saved:', donationId);
}

// Generate PDF receipt (placeholder)
function generateReceipt(donation, donationId) {
  // This would integrate with jsPDF or similar library
  console.log('Generating receipt for donation:', donationId);
  
  // Receipt data structure:
  const receiptData = {
    organization: 'TRAPOSA',
    donationId: donationId,
    date: new Date().toISOString(),
    donor: donation.donor_name || 'Anonymous',
    amount: donation.amount,
    currency: donation.currency,
    cause: donation.cause_name
  };

  // In a real implementation, use jsPDF to generate PDF
  // const { jsPDF } = window.jspdf;
  // const doc = new jsPDF();
  // ... generate receipt
}

// Load recent donations ticker
async function loadRecentDonations() {
  const ticker = document.querySelector('.donation-ticker');
  if (!ticker) return;

  try {
    const { data: donations, error } = await supabase
      ?.from('traposa_donations')
      .select('*')
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    const tickerList = ticker.querySelector('.ticker-list') || ticker;
    
    if (donations && donations.length > 0) {
      tickerList.innerHTML = donations.map(d => `
        <div class="ticker-item">
          <span class="ticker-donor">${d.is_anonymous ? 'Yon zanmi' : (d.donor_name || 'Yon zanmi')}</span>
          <span class="ticker-amount">${formatAmount(d.amount, d.currency)}</span>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading donations:', error);
  }
}

// Show error message
function showError(message) {
  const errorEl = document.querySelector('.form-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
    setTimeout(() => errorEl.classList.remove('show'), 5000);
  }
}
