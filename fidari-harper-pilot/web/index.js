/**
 * Fidari Pizza - Single-Page Accessible Ordering Application
 * Connects directly to Harper 5.x REST API endpoints (/Pizza/, /Topping/, /place-order)
 */

// Application State
const state = {
  pizzas: [],
  toppings: [],
  selectedPizza: null,
  selectedToppingIds: new Set(),
  customerName: '',
  isSubmitting: false,
};

// DOM References
const elements = {
  srAnnouncements: document.getElementById('sr-announcements'),
  errorBanner: document.getElementById('error-banner'),
  errorMessage: document.getElementById('error-message'),
  dismissErrorBtn: document.getElementById('dismiss-error-btn'),
  orderingForm: document.getElementById('ordering-form'),
  pizzasGrid: document.getElementById('pizzas-grid'),
  pizzasLoading: document.getElementById('pizzas-loading'),
  toppingsGrid: document.getElementById('toppings-grid'),
  toppingsLoading: document.getElementById('toppings-loading'),
  customerNameInput: document.getElementById('customer-name'),
  nameError: document.getElementById('name-error'),
  summaryPizzaName: document.getElementById('summary-pizza-name'),
  summaryPizzaPrice: document.getElementById('summary-pizza-price'),
  summaryToppingsContainer: document.getElementById('summary-toppings-container'),
  summaryTotalPrice: document.getElementById('summary-total-price'),
  placeOrderBtn: document.getElementById('place-order-btn'),
  confirmationView: document.getElementById('confirmation-view'),
  receiptCustomerName: document.getElementById('receipt-customer-name'),
  receiptOrderId: document.getElementById('receipt-order-id'),
  receiptPizzaName: document.getElementById('receipt-pizza-name'),
  receiptPizzaPrice: document.getElementById('receipt-pizza-price'),
  receiptToppingsGroup: document.getElementById('receipt-toppings-group'),
  receiptTotalPrice: document.getElementById('receipt-total-price'),
  startNewOrderBtn: document.getElementById('start-new-order-btn'),
};

/**
 * Currency Formatter: Converts integer cents to $XX.XX display
 */
function formatCents(cents) {
  if (typeof cents !== 'number' || isNaN(cents)) return '$0.00';
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Screen Reader Announcement
 */
function announce(message) {
  if (elements.srAnnouncements) {
    elements.srAnnouncements.textContent = '';
    // Small timeout ensures screen readers register the live region change
    setTimeout(() => {
      elements.srAnnouncements.textContent = message;
    }, 50);
  }
}

/**
 * Show / Hide Error Banner
 */
function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorBanner.classList.remove('hidden');
  elements.errorBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  announce(`Error: ${message}`);
}

function clearError() {
  elements.errorBanner.classList.add('hidden');
  elements.errorMessage.textContent = '';
}

/**
 * Fetch initial menu data from Harper
 */
async function loadMenu() {
  try {
    const [pizzasRes, toppingsRes] = await Promise.all([
      fetch('/Pizza/'),
      fetch('/Topping/'),
    ]);

    if (!pizzasRes.ok) throw new Error(`Failed to load pizza menu (HTTP ${pizzasRes.status})`);
    if (!toppingsRes.ok) throw new Error(`Failed to load toppings (HTTP ${toppingsRes.status})`);

    const pizzasData = await pizzasRes.json();
    const toppingsData = await toppingsRes.json();

    // Filter available items and sort
    state.pizzas = Array.isArray(pizzasData) ? pizzasData.filter(p => p.available !== false) : [];
    state.toppings = Array.isArray(toppingsData) ? toppingsData.filter(t => t.available !== false) : [];

    renderPizzas();
    renderToppings();
    updateSummary();
  } catch (err) {
    console.error('Menu load failed:', err);
    showError('Unable to load our menu at this moment. Please refresh the page or call the shop.');
  } finally {
    if (elements.pizzasLoading) elements.pizzasLoading.classList.add('hidden');
    if (elements.toppingsLoading) elements.toppingsLoading.classList.add('hidden');
  }
}

/**
 * Render Pizza Selection Grid
 */
function renderPizzas() {
  elements.pizzasGrid.innerHTML = '';

  state.pizzas.forEach((pizza) => {
    const card = document.createElement('div');
    card.className = 'pizza-card';
    card.id = `pizza-card-${pizza.id}`;
    card.setAttribute('role', 'radio');
    card.setAttribute('aria-checked', 'false');
    card.setAttribute('tabindex', '0');

    const formattedPrice = formatCents(pizza.basePriceCents);
    const imageUrl = pizza.imageUrl || '/images/pizzas/margherita.jpg';

    card.innerHTML = `
      <div class="pizza-image-wrapper">
        <img src="${imageUrl}" alt="${pizza.name} pizza illustration" class="pizza-img" loading="lazy" />
      </div>
      <div class="pizza-card-body">
        <h3 class="pizza-name">${pizza.name}</h3>
        <p class="pizza-description">${pizza.description || 'Authentic artisan pie with fresh ingredients.'}</p>
        <div class="pizza-card-footer">
          <span class="pizza-price">${formattedPrice}</span>
          <span class="select-indicator" aria-hidden="true">Select</span>
        </div>
      </div>
    `;

    // Click selection
    card.addEventListener('click', () => selectPizza(pizza));

    // Keyboard selection (Space or Enter)
    card.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        selectPizza(pizza);
      }
    });

    elements.pizzasGrid.appendChild(card);
  });
}

/**
 * Select a Pizza
 */
function selectPizza(pizza) {
  state.selectedPizza = pizza;

  // Update card styles & accessibility attributes
  const allCards = elements.pizzasGrid.querySelectorAll('.pizza-card');
  allCards.forEach((c) => {
    const isThis = c.id === `pizza-card-${pizza.id}`;
    c.classList.toggle('selected', isThis);
    c.setAttribute('aria-checked', isThis ? 'true' : 'false');
    const indicator = c.querySelector('.select-indicator');
    if (indicator) indicator.textContent = isThis ? '✓ Selected' : 'Select';
  });

  clearError();
  announce(`Selected ${pizza.name} pizza, ${formatCents(pizza.basePriceCents)}`);
  updateSummary();
}

/**
 * Render Toppings Grid
 */
function renderToppings() {
  elements.toppingsGrid.innerHTML = '';

  state.toppings.forEach((topping) => {
    const tile = document.createElement('div');
    tile.className = 'topping-tile';
    tile.id = `topping-tile-${topping.id}`;
    tile.setAttribute('role', 'checkbox');
    tile.setAttribute('aria-checked', 'false');
    tile.setAttribute('tabindex', '0');

    const formattedPrice = `+${formatCents(topping.priceCents)}`;

    tile.innerHTML = `
      <div class="topping-label-group">
        <div class="custom-checkbox" aria-hidden="true"></div>
        <span class="topping-name">${topping.name}</span>
      </div>
      <span class="topping-price">${formattedPrice}</span>
    `;

    // Click toggle
    tile.addEventListener('click', () => toggleTopping(topping));

    // Keyboard toggle (Space or Enter)
    tile.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggleTopping(topping);
      }
    });

    elements.toppingsGrid.appendChild(tile);
  });
}

/**
 * Toggle Topping Selection
 */
function toggleTopping(topping) {
  const isChecked = state.selectedToppingIds.has(topping.id);
  const tile = document.getElementById(`topping-tile-${topping.id}`);

  if (isChecked) {
    state.selectedToppingIds.delete(topping.id);
    if (tile) {
      tile.classList.remove('checked');
      tile.setAttribute('aria-checked', 'false');
    }
    announce(`Removed ${topping.name}`);
  } else {
    state.selectedToppingIds.add(topping.id);
    if (tile) {
      tile.classList.add('checked');
      tile.setAttribute('aria-checked', 'true');
    }
    announce(`Added ${topping.name}, +${formatCents(topping.priceCents)}`);
  }

  updateSummary();
}

/**
 * Update Sidebar Order Summary and Total
 */
function updateSummary() {
  const hasPizza = !!state.selectedPizza;

  // 1. Pizza Details
  if (hasPizza) {
    elements.summaryPizzaName.textContent = state.selectedPizza.name;
    elements.summaryPizzaPrice.textContent = formatCents(state.selectedPizza.basePriceCents);
  } else {
    elements.summaryPizzaName.textContent = 'No pizza selected';
    elements.summaryPizzaPrice.textContent = '$0.00';
  }

  // 2. Toppings Details
  let toppingTotalCents = 0;
  elements.summaryToppingsContainer.innerHTML = '';

  if (state.selectedToppingIds.size > 0) {
    elements.summaryToppingsContainer.classList.remove('hidden');

    state.selectedToppingIds.forEach((tid) => {
      const topping = state.toppings.find((t) => t.id === tid);
      if (topping) {
        toppingTotalCents += topping.priceCents;
        const subItem = document.createElement('div');
        subItem.className = 'summary-subitem';
        subItem.innerHTML = `
          <span>+ ${topping.name}</span>
          <span>${formatCents(topping.priceCents)}</span>
        `;
        elements.summaryToppingsContainer.appendChild(subItem);
      }
    });
  } else {
    elements.summaryToppingsContainer.classList.add('hidden');
  }

  // 3. Total Calculation
  const baseCents = hasPizza ? state.selectedPizza.basePriceCents : 0;
  const totalCents = baseCents + toppingTotalCents;
  const formattedTotal = formatCents(totalCents);

  elements.summaryTotalPrice.textContent = formattedTotal;

  // 4. Update Submit Button
  const btnText = elements.placeOrderBtn.querySelector('.btn-text');
  if (!hasPizza) {
    elements.placeOrderBtn.disabled = true;
    elements.placeOrderBtn.setAttribute('aria-disabled', 'true');
    if (btnText) btnText.textContent = 'Choose a Pizza to Continue';
  } else {
    elements.placeOrderBtn.disabled = false;
    elements.placeOrderBtn.removeAttribute('aria-disabled');
    if (btnText) btnText.textContent = `Place Order • ${formattedTotal}`;
  }
}

/**
 * Handle Order Form Submission
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  clearError();

  // Validate Pizza
  if (!state.selectedPizza) {
    showError('Please select a pizza before placing your order.');
    const firstPizza = elements.pizzasGrid.querySelector('.pizza-card');
    if (firstPizza) firstPizza.focus();
    return;
  }

  // Validate Customer Name
  const name = elements.customerNameInput.value.trim();
  if (!name) {
    elements.customerNameInput.classList.add('input-invalid');
    elements.nameError.classList.remove('sr-only');
    elements.customerNameInput.focus();
    showError('Please enter your name for the order.');
    return;
  }

  elements.customerNameInput.classList.remove('input-invalid');
  elements.nameError.classList.add('sr-only');

  // Lock UI for submission
  setSubmitting(true);

  try {
    const payload = {
      customerName: name,
      pizzaId: state.selectedPizza.id,
      toppingIds: Array.from(state.selectedToppingIds),
    };

    const response = await fetch('/place-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.title || result.message || `Order failed (HTTP ${response.status})`);
    }

    // Success! Render Receipt Confirmation
    renderReceipt(result);
  } catch (err) {
    console.error('Order submission error:', err);
    showError(err.message || 'An error occurred while submitting your order. Please try again.');
  } finally {
    setSubmitting(false);
  }
}

/**
 * Toggle Submitting State on Button
 */
function setSubmitting(isSubmitting) {
  state.isSubmitting = isSubmitting;
  elements.placeOrderBtn.disabled = isSubmitting;
  const btnSpinner = elements.placeOrderBtn.querySelector('.btn-spinner');
  const btnText = elements.placeOrderBtn.querySelector('.btn-text');

  if (isSubmitting) {
    elements.placeOrderBtn.setAttribute('aria-busy', 'true');
    if (btnSpinner) btnSpinner.classList.remove('hidden');
    if (btnText) btnText.textContent = 'Submitting your order...';
  } else {
    elements.placeOrderBtn.removeAttribute('aria-busy');
    if (btnSpinner) btnSpinner.classList.add('hidden');
    updateSummary();
  }
}

/**
 * Render Confirmation Receipt
 */
function renderReceipt(order) {
  // Populate receipt fields
  elements.receiptCustomerName.textContent = order.customerName;
  elements.receiptOrderId.textContent = order.id;
  elements.receiptPizzaName.textContent = order.pizzaName;
  elements.receiptPizzaPrice.textContent = formatCents(order.basePriceCents);
  elements.receiptTotalPrice.textContent = formatCents(order.totalCents);

  // Render toppings breakdown on receipt
  elements.receiptToppingsGroup.innerHTML = '';
  if (Array.isArray(order.toppingNames) && order.toppingNames.length > 0) {
    order.toppingNames.forEach((tName, idx) => {
      const toppingItem = document.createElement('div');
      toppingItem.className = 'receipt-subitem';
      // Find matching topping price from state if available
      const toppingObj = state.toppings.find(t => t.name === tName || (order.toppingIds && order.toppingIds[idx] === t.id));
      const priceText = toppingObj ? formatCents(toppingObj.priceCents) : '';
      toppingItem.innerHTML = `
        <span>+ ${tName}</span>
        <span>${priceText}</span>
      `;
      elements.receiptToppingsGroup.appendChild(toppingItem);
    });
  }

  // Switch views
  elements.orderingForm.classList.add('hidden');
  elements.confirmationView.classList.remove('hidden');
  elements.confirmationView.focus();

  announce(`Order received! Thank you, ${order.customerName}. Your total is ${formatCents(order.totalCents)}.`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Reset and Start a New Order
 */
function resetForm() {
  state.selectedPizza = null;
  state.selectedToppingIds.clear();
  elements.customerNameInput.value = '';
  elements.customerNameInput.classList.remove('input-invalid');
  elements.nameError.classList.add('sr-only');

  // Reset card selections
  const allPizzaCards = elements.pizzasGrid.querySelectorAll('.pizza-card');
  allPizzaCards.forEach((c) => {
    c.classList.remove('selected');
    c.setAttribute('aria-checked', 'false');
    const indicator = c.querySelector('.select-indicator');
    if (indicator) indicator.textContent = 'Select';
  });

  // Reset topping checkboxes
  const allToppingTiles = elements.toppingsGrid.querySelectorAll('.topping-tile');
  allToppingTiles.forEach((t) => {
    t.classList.remove('checked');
    t.setAttribute('aria-checked', 'false');
  });

  // Switch views
  elements.confirmationView.classList.add('hidden');
  elements.orderingForm.classList.remove('hidden');

  updateSummary();
  announce('Ready for a new order.');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Event Listeners
elements.orderingForm.addEventListener('submit', handleFormSubmit);

elements.customerNameInput.addEventListener('input', () => {
  if (elements.customerNameInput.value.trim()) {
    elements.customerNameInput.classList.remove('input-invalid');
    elements.nameError.classList.add('sr-only');
  }
});

elements.dismissErrorBtn.addEventListener('click', clearError);
elements.startNewOrderBtn.addEventListener('click', resetForm);

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', loadMenu);
