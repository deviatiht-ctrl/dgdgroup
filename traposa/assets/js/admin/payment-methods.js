// TRAPOSA Admin — Gestion des Méthodes de Paiement
// Methods with is_automatic=true (or type in PLOP_AUTO_METHODS) are processed
// automatically via the PLOP PLOP API — manual account fields are hidden for them.

const PLOP_AUTO_METHODS = new Set(['moncash', 'natcash', 'kashpaw', 'all']);

let allMethods = [];
let editingId = null;

document.addEventListener('DOMContentLoaded', () => {
  loadMethods();
  initModal();
  initLogoPreview();
});

async function loadMethods() {
  const tbody = document.getElementById('methodsTable');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#9ca3af;">Chargement...</td></tr>`;

  try {
    const { data, error } = await window.supabaseClient
      .from('traposa_payment_methods')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;

    allMethods = data || [];
    renderTable(allMethods);
  } catch (err) {
    console.error('Error loading payment methods:', err);
    showToast('Erreur de chargement: ' + err.message, 'error');
  }
}

function renderTable(methods) {
  const tbody = document.getElementById('methodsTable');
  if (!tbody) return;

  if (methods.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#9ca3af;">Aucune méthode de paiement. Cliquez "Ajouter" pour créer la première.</td></tr>`;
    return;
  }

  tbody.innerHTML = methods.map(m => {
    const isAuto = m.is_automatic || PLOP_AUTO_METHODS.has(m.type);
    const autoBadge = isAuto
      ? `<span style="background:#d1fae5;color:#065f46;border-radius:20px;padding:1px 7px;font-size:.72rem;font-weight:600;margin-left:6px;">Auto PLOP</span>`
      : '';
    const manualCell = isAuto
      ? '<span style="color:#9ca3af;font-style:italic;font-size:.8rem;">automatique</span>'
      : null;
    return `
    <tr data-id="${m.id}">
      <td>
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <div class="method-icon-preview">
            ${m.logo_url
              ? `<img src="${m.logo_url}" alt="${m.name}" onerror="this.style.display='none';this.nextSibling.style.display='flex'"><span style="display:none"><i data-lucide="${m.icon_name || 'credit-card'}"></i></span>`
              : `<i data-lucide="${m.icon_name || 'credit-card'}"></i>`
            }
          </div>
          <div>
            <strong>${m.name}</strong>${autoBadge}
            <div style="font-size:0.75rem;color:#9ca3af;">${m.type}</div>
          </div>
        </div>
      </td>
      <td>${manualCell || m.account_name || '<span style="color:#9ca3af;">—</span>'}</td>
      <td>
        ${isAuto
          ? manualCell
          : (m.account_number
              ? `<code class="account-number-cell">${m.account_number}</code>`
              : '<span style="color:#9ca3af;">—</span>')
        }
      </td>
      <td style="max-width:200px;font-size:0.8rem;color:#6b7280;">
        ${isAuto
          ? manualCell
          : (m.instructions ? m.instructions.slice(0, 60) + (m.instructions.length > 60 ? '…' : '') : '<span style="color:#9ca3af;">—</span>')
        }
      </td>
      <td>
        <label class="toggle-input" title="${m.is_active ? 'Actif' : 'Inactif'}">
          <input type="checkbox" ${m.is_active ? 'checked' : ''} onchange="toggleActive('${m.id}', this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </td>
      <td class="table-actions">
        <button class="table-btn" onclick="openEditModal('${m.id}')" title="Modifier">
          <i data-lucide="edit"></i>
        </button>
        <button class="table-btn delete" onclick="deleteMethod('${m.id}')" title="Supprimer">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    </tr>`;
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function initModal() {
  const modal = document.getElementById('paymentModal');
  if (!modal) return;

  const closeBtn = modal.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  document.getElementById('paymentForm').addEventListener('submit', (e) => {
    e.preventDefault();
    saveMethod();
  });

  // Show/hide manual fields based on type
  const typeSelect = document.getElementById('pmType');
  if (typeSelect) {
    typeSelect.addEventListener('change', () => toggleManualFields(typeSelect.value));
    toggleManualFields(typeSelect.value);
  }

  // Logo file upload handler
  const fileInput = document.getElementById('pmLogoFile');
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const statusEl = document.getElementById('uploadStatus');
      if (statusEl) {
        statusEl.textContent = 'Upload en cours...';
        statusEl.style.color = '#6b7280';
      }

      try {
        const fileName = `${Date.now()}-${file.name}`;

        // Get current session for authenticated upload
        const { data: { session } } = await window.supabaseClient.auth.getSession();

        const { data, error } = await window.supabaseClient
          .storage
          .from('payment-logos')
          .upload(fileName, file, {
            upsert: true,
            cacheControl: '3600',
            metadata: { uploadedBy: session?.user?.email || 'admin' }
          });

        if (error) throw error;

        const { data: { publicUrl } } = window.supabaseClient
          .storage
          .from('payment-logos')
          .getPublicUrl(fileName);

        document.getElementById('pmLogoUrl').value = publicUrl;

        if (statusEl) {
          statusEl.textContent = '✓ Upload réussi!';
          statusEl.style.color = '#16a34a';
        }

        // Trigger logo preview
        initLogoPreview();
      } catch (err) {
        console.error('Upload error:', err);
        if (statusEl) {
          statusEl.textContent = '✗ Erreur: ' + err.message;
          statusEl.style.color = '#dc2626';
        }
      }
    });
  }
}

function initLogoPreview() {
  const logoInput = document.getElementById('pmLogoUrl');
  const preview = document.getElementById('logoPreview');
  if (!logoInput || !preview) return;

  logoInput.addEventListener('input', () => {
    const url = logoInput.value.trim();
    if (url) {
      preview.innerHTML = `<img src="${url}" alt="Preview" onerror="this.parentElement.innerHTML='<span style=color:#ef4444;font-size:0.8rem;>URL invalid</span>'">`;
    } else {
      preview.innerHTML = '';
    }
  });
}

// Show or hide manual account fields depending on whether the type is automatic
function toggleManualFields(type) {
  const isAuto    = PLOP_AUTO_METHODS.has(type);
  const manualIds = ['pmAccountName', 'pmAccountNumber', 'pmInstructions'];
  const manualRow = document.getElementById('manualFieldsRow');

  manualIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const group = el.closest('.form-group') || el.closest('.form-row');
      if (group) group.style.display = isAuto ? 'none' : '';
    }
  });

  if (manualRow) manualRow.style.display = isAuto ? 'none' : '';

  // Show hint when auto
  let hint = document.getElementById('plopAutoHint');
  if (isAuto && !hint) {
    hint = document.createElement('p');
    hint.id = 'plopAutoHint';
    hint.style.cssText = 'background:#d1fae5;color:#065f46;border-radius:8px;padding:.6rem 1rem;font-size:.83rem;margin:.5rem 0 0;';
    hint.innerHTML = '<strong>Traitement automatique PLOP PLOP</strong> — les paiements seront redirigés vers la plateforme PLOP PLOP. Aucun numéro de compte requis.';
    const typeEl = document.getElementById('pmType');
    if (typeEl) typeEl.closest('.form-row')?.after(hint);
  } else if (!isAuto && hint) {
    hint.remove();
  }
}

function openAddModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Ajouter une Méthode de Paiement';
  document.getElementById('paymentForm').reset();
  document.getElementById('logoPreview').innerHTML = '';
  toggleManualFields(document.getElementById('pmType')?.value || 'other');
  document.getElementById('paymentModal').style.display = 'flex';
}

function openEditModal(id) {
  const m = allMethods.find(x => x.id === id);
  if (!m) return;

  editingId = id;
  document.getElementById('modalTitle').textContent = 'Modifier la Méthode de Paiement';

  document.getElementById('pmName').value          = m.name          || '';
  document.getElementById('pmType').value          = m.type          || 'other';
  document.getElementById('pmAccountName').value   = m.account_name  || '';
  document.getElementById('pmAccountNumber').value = m.account_number || '';
  document.getElementById('pmInstructions').value  = m.instructions  || '';
  document.getElementById('pmLogoUrl').value       = m.logo_url      || '';
  document.getElementById('pmIconName').value      = m.icon_name     || 'credit-card';
  document.getElementById('pmDisplayOrder').value  = m.display_order ?? 0;
  document.getElementById('pmIsActive').checked    = m.is_active !== false;

  toggleManualFields(m.type || 'other');

  const preview = document.getElementById('logoPreview');
  if (m.logo_url) {
    preview.innerHTML = `<img src="${m.logo_url}" alt="Preview">`;
  } else {
    preview.innerHTML = '';
  }

  document.getElementById('paymentModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('paymentModal').style.display = 'none';
  editingId = null;
}

async function saveMethod() {
  const saveBtn = document.querySelector('#paymentForm .btn-primary');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Sauvegarde...'; }

  const selectedType = document.getElementById('pmType').value;
  const isAutomatic  = PLOP_AUTO_METHODS.has(selectedType);

  const payload = {
    name:           document.getElementById('pmName').value.trim(),
    type:           selectedType,
    is_automatic:   isAutomatic,
    plop_method:    isAutomatic ? selectedType : null,
    account_name:   isAutomatic ? null : (document.getElementById('pmAccountName').value.trim() || null),
    account_number: isAutomatic ? null : (document.getElementById('pmAccountNumber').value.trim() || null),
    instructions:   isAutomatic ? null : (document.getElementById('pmInstructions').value.trim() || null),
    logo_url:       document.getElementById('pmLogoUrl').value.trim() || null,
    icon_name:      document.getElementById('pmIconName').value.trim() || 'credit-card',
    display_order:  parseInt(document.getElementById('pmDisplayOrder').value) || 0,
    is_active:      document.getElementById('pmIsActive').checked,
    updated_at:     new Date().toISOString(),
  };

  try {
    let error;
    if (editingId) {
      ({ error } = await window.supabaseClient
        .from('traposa_payment_methods')
        .update(payload)
        .eq('id', editingId));
    } else {
      ({ error } = await window.supabaseClient
        .from('traposa_payment_methods')
        .insert([payload]));
    }

    if (error) throw error;

    closeModal();
    await loadMethods();
    showToast(editingId ? 'Méthode de paiement modifiée!' : 'Méthode de paiement ajoutée!', 'success');
  } catch (err) {
    console.error('Error saving method:', err);
    showToast('Erreur: ' + err.message, 'error');
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Sauvegarder'; }
  }
}

async function toggleActive(id, isActive) {
  try {
    const { error } = await window.supabaseClient
      .from('traposa_payment_methods')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    const m = allMethods.find(x => x.id === id);
    if (m) m.is_active = isActive;
    showToast(isActive ? 'Méthode activée' : 'Méthode désactivée', 'success');
  } catch (err) {
    showToast('Erreur: ' + err.message, 'error');
  }
}

async function deleteMethod(id) {
  const m = allMethods.find(x => x.id === id);
  if (!confirm(`Supprimer "${m?.name || 'cette méthode'}"? Cette action ne peut pas être annulée.`)) return;

  try {
    const { error } = await window.supabaseClient
      .from('traposa_payment_methods')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await loadMethods();
    showToast('Méthode de paiement supprimée!', 'success');
  } catch (err) {
    showToast('Erreur: ' + err.message, 'error');
  }
}

function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;font-size:1.2rem;line-height:1;">×</button>`;

  Object.assign(toast.style, {
    position: 'fixed', bottom: '100px', right: '20px',
    padding: '12px 24px', borderRadius: '8px',
    color: type === 'error' ? '#DC2626' : '#16A34A',
    background: type === 'error' ? '#FEE2E2' : '#F0FDF4',
    border: `1px solid ${type === 'error' ? '#FECACA' : '#BBF7D0'}`,
    zIndex: '9999', display: 'flex', alignItems: 'center',
    gap: '12px', fontSize: '14px', fontWeight: '500',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  });

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
