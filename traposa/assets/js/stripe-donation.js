// TRAPOSA Stripe Donation Integration
// Replace with your real Stripe publishable key from https://dashboard.stripe.com/apikeys
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51TW3enFfdtFD3Ow0ME9kvLz24LDvmFnvk8wIA1SqNDIjPE8JV1IW2BYmxpU3S5eXGiUOQdbAk4m0ZOniMU4oM9IJ00ptnijnYH';

let stripeInstance = null;
let cardElement = null;

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Stripe !== 'undefined' && STRIPE_PUBLISHABLE_KEY !== 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY') {
    initStripe();
  } else if (typeof Stripe !== 'undefined') {
    // Initialize with placeholder key for UI display only
    try {
      stripeInstance = Stripe(STRIPE_PUBLISHABLE_KEY);
      mountCardElement();
    } catch (e) {
      console.warn('Stripe init skipped — set a valid STRIPE_PUBLISHABLE_KEY in stripe-donation.js');
    }
  }

  setupPaymentMethodObserver();
});

function initStripe() {
  stripeInstance = Stripe(STRIPE_PUBLISHABLE_KEY);
  mountCardElement();
}

function mountCardElement() {
  if (!stripeInstance) return;

  const elements = stripeInstance.elements({
    appearance: {
      theme: 'flat',
      variables: {
        colorPrimary: '#2d6a4f',
        colorBackground: '#ffffff',
        colorText: '#1a1a2e',
        colorDanger: '#e74c3c',
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '10px',
      },
      rules: {
        '.Input': {
          border: '2px solid #e5e7eb',
          padding: '12px 16px',
          fontSize: '15px',
        },
        '.Input:focus': {
          border: '2px solid #2d6a4f',
          boxShadow: 'none',
        },
        '.Label': {
          fontWeight: '500',
          marginBottom: '6px',
          color: '#374151',
        },
      },
    },
  });

  cardElement = elements.create('card', {
    hidePostalCode: false,
    iconStyle: 'solid',
  });

  const mountTarget = document.getElementById('stripe-card-element');
  if (mountTarget) {
    cardElement.mount('#stripe-card-element');
  }

  cardElement.on('change', (event) => {
    const errorsEl = document.getElementById('stripe-card-errors');
    if (errorsEl) {
      errorsEl.textContent = event.error ? event.error.message : '';
      errorsEl.style.display = event.error ? 'block' : 'none';
    }
  });
}

function setupPaymentMethodObserver() {
  const paymentMethods = document.querySelectorAll('.payment-method');
  const cardSection = document.getElementById('stripe-card-section');

  if (!cardSection) return;

  paymentMethods.forEach(method => {
    method.addEventListener('click', () => {
      const radio = method.querySelector('input[type="radio"]');
      const isStripe = radio?.value === 'stripe';
      cardSection.style.display = isStripe ? 'block' : 'none';

      if (isStripe && stripeInstance && !cardElement) {
        mountCardElement();
      }
    });
  });
}

// Full payment flow: Edge Function creates PaymentIntent → stripe.confirmCardPayment
async function confirmPayment({ amount, currency, donorEmail, donorName, causeName }) {
  if (!stripeInstance || !cardElement) {
    throw new Error('Stripe non disponible. Veuillez rafraîchir la page.');
  }

  // Step 1 — Call Supabase Edge Function to create PaymentIntent server-side
  const edgeUrl = `${window.SUPABASE_URL}/functions/v1/create-payment-intent`;

  let clientSecret;
  try {
    const res = await fetch(edgeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        amount,
        currency,
        donor_email: donorEmail || undefined,
        donor_name:  donorName  || undefined,
        cause_name:  causeName  || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Erè Edge Function');
    clientSecret = data.clientSecret;
  } catch (err) {
    throw new Error(`Erè sèvè: ${err.message}`);
  }

  // Step 2 — Confirm card payment (handles 3D Secure automatically)
  const { paymentIntent, error } = await stripeInstance.confirmCardPayment(clientSecret, {
    payment_method: {
      card: cardElement,
      billing_details: {
        name:  donorName  || undefined,
        email: donorEmail || undefined,
      },
    },
  });

  if (error) throw new Error(error.message);

  if (paymentIntent.status !== 'succeeded') {
    throw new Error(`Pèman an pa reyisi (statut: ${paymentIntent.status})`);
  }

  return paymentIntent;
}

window.stripeUtils = {
  init: initStripe,
  confirmPayment,
  isReady:          () => !!(stripeInstance && cardElement),
  isStripeSelected: () => {
    const selected = document.querySelector('.payment-method.selected input[type="radio"]');
    return selected?.value === 'stripe';
  },
};
