// App State
let appState = {
  balance: 0,
  totalIncome: 0,
  totalExpenses: 0,
  plannedExpenses: [],
  transactions: [],
  darkMode: false,
  currentView: 'balance'
};

// DOM Elements
const elements = {
  welcomeScreen: document.getElementById('welcome-screen'),
  appContainer: document.getElementById('app-container'),
  getStartedBtn: document.getElementById('get-started-btn'),
  viewTitle: document.getElementById('view-title'),
  balanceView: document.getElementById('balance-view'),
  transactionsView: document.getElementById('transactions-view'),
  analyticsView: document.getElementById('analytics-view'),
  settingsView: document.getElementById('settings-view'),
  totalIncome: document.getElementById('total-income'),
  plannedExpenses: document.getElementById('planned-expenses'),
  mainBalance: document.getElementById('main-balance'),
  plannedExpensesList: document.getElementById('planned-expenses-list'),
  transactionList: document.getElementById('transaction-list'),
  pieChart: document.getElementById('pie-chart'),
  barChart: document.getElementById('bar-chart'),
  darkModeSwitch: document.getElementById('dark-mode-switch'),
  exportDataBtn: document.getElementById('export-data-btn'),
  resetDataBtn: document.getElementById('reset-data-btn'),
  incomeForm: document.getElementById('income-form'),
  expenseForm: document.getElementById('expense-form'),
  adjustmentForm: document.getElementById('adjustment-form'),
  applyFiltersBtn: document.getElementById('apply-filters-btn'),
  clearFiltersBtn: document.getElementById('clear-filters-btn')
};

// Initialize the app
function initApp() {
  // Load data from localStorage
  const savedData = localStorage.getItem('expenseTrackerData');
  if (savedData) {
    appState = JSON.parse(savedData);
  }
  
  // Set up event listeners
  setupEventListeners();
  
  // Initialize UI
  updateUI();
  
  // Initialize charts
  initCharts();
  
  // Set default dates for filters
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  document.getElementById('start-date').value = formatDate(firstDay);
  document.getElementById('end-date').value = formatDate(today);
}

// Format date as YYYY-MM-DD
function formatDate(date) {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

// Set up event listeners
function setupEventListeners() {
  // Navigation
  elements.getStartedBtn.addEventListener('click', showApp);
  
  // Bottom nav
  document.querySelectorAll('.nav-link[data-view]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(link.getAttribute('data-view'));
    });
  });
  
  // Forms
  elements.incomeForm.addEventListener('submit', handleIncomeSubmit);
  elements.expenseForm.addEventListener('submit', handleExpenseSubmit);
  elements.adjustmentForm.addEventListener('submit', handleAdjustmentSubmit);
  
  // Settings
  elements.darkModeSwitch.addEventListener('change', toggleDarkMode);
  elements.exportDataBtn.addEventListener('click', exportData);
  elements.resetDataBtn.addEventListener('click', resetData);
  
  // Filters
  elements.applyFiltersBtn.addEventListener('click', applyFilters);
  elements.clearFiltersBtn.addEventListener('click', clearFilters);
}

// Show main app
function showApp() {
  elements.welcomeScreen.classList.add('d-none');
  elements.appContainer.classList.remove('d-none');
}

// Switch between views
function switchView(view) {
  appState.currentView = view;
  
  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('data-view') === view) {
      link.classList.add('active');
    }
  });
  
  // Hide all views
  elements.balanceView.classList.add('d-none');
  elements.transactionsView.classList.add('d-none');
  elements.analyticsView.classList.add('d-none');
  elements.settingsView.classList.add('d-none');
  
  // Show current view
  switch(view) {
    case 'balance':
      elements.balanceView.classList.remove('d-none');
      elements.viewTitle.textContent = 'Balance Overview';
      break;
    case 'transactions':
      elements.transactionsView.classList.remove('d-none');
      elements.viewTitle.textContent = 'Transactions';
      renderTransactions();
      break;
    case 'analytics':
      elements.analyticsView.classList.remove('d-none');
      elements.viewTitle.textContent = 'Analytics';
      updateCharts();
      break;
    case 'settings':
      elements.settingsView.classList.remove('d-none');
      elements.viewTitle.textContent = 'Settings';
      break;
  }
  
  saveState();
}

// Handle income form submission
function handleIncomeSubmit(e) {
  e.preventDefault();
  
  const amount = parseFloat(document.getElementById('income-amount').value);
  const source = document.getElementById('income-source').value;
  const date = document.getElementById('income-date').value || new Date().toISOString().split('T')[0];
  
  // Create transaction
  const transaction = {
    id: Date.now(),
    type: 'income',
    amount: amount,
    source: source,
    date: date,
    category: source
  };
  
  // Update state
  appState.transactions.push(transaction);
  appState.totalIncome += amount;
  appState.balance += amount;
  
  // Update UI
  updateUI();
  
  // Reset form
  elements.incomeForm.reset();
  
  // Close modal
  document.querySelector('#incomeModal .btn-close').click();
}

// Handle expense form submission
function handleExpenseSubmit(e) {
  e.preventDefault();
  
  const item = document.getElementById('expense-item').value;
  const amount = parseFloat(document.getElementById('expense-amount').value);
  const category = document.getElementById('expense-category').value;
  const date = document.getElementById('expense-date').value || new Date().toISOString().split('T')[0];
  const deductImmediately = document.getElementById('deduct-immediately').checked;
  
  // Create planned expense
  const expense = {
    id: Date.now(),
    item: item,
    amount: amount,
    category: category,
    plannedDate: date,
    status: deductImmediately ? 'paid' : 'planned'
  };
  
  // Update state
  appState.plannedExpenses.push(expense);
  appState.totalExpenses += amount;
  
  if (deductImmediately) {
    appState.balance -= amount;
    
    // Create transaction
    const transaction = {
      id: Date.now(),
      type: 'expense',
      amount: amount,
      item: item,
      date: new Date().toISOString().split('T')[0],
      category: category
    };
    
    appState.transactions.push(transaction);
  }
  
  // Update UI
  updateUI();
  
  // Reset form
  elements.expenseForm.reset();
  
  // Close modal
  document.querySelector('#expenseModal .btn-close').click();
}

// Handle adjustment form submission
function handleAdjustmentSubmit(e) {
  e.preventDefault();
  
  const amount = parseFloat(document.getElementById('adjustment-amount').value);
  const type = document.querySelector('input[name="adjustment-type"]:checked').value;
  const reason = document.getElementById('adjustment-reason').value || "Balance adjustment";
  
  // Update balance
  if (type === 'add') {
    appState.balance += amount;
  } else {
    appState.balance -= amount;
  }
  
  // Create transaction
  const transaction = {
    id: Date.now(),
    type: 'adjustment',
    amount: type === 'add' ? amount : -amount,
    reason: reason,
    date: new Date().toISOString().split('T')[0],
    category: 'Adjustment'
  };
  
  appState.transactions.push(transaction);
  
  // Update UI
  updateUI();
  
  // Reset form
  elements.adjustmentForm.reset();
  
  // Close modal
  document.querySelector('#adjustmentModal .btn-close').click();
}

// Mark expense as paid
function markExpenseAsPaid(id) {
  const expense = appState.plannedExpenses.find(e => e.id === id);
  if (expense && expense.status === 'planned') {
    expense.status = 'paid';
    appState.balance -= expense.amount;
    
    // Create transaction
    const transaction = {
      id: Date.now(),
      type: 'expense',
      amount: expense.amount,
      item: expense.item,
      date: new Date().toISOString().split('T')[0],
      category: expense.category
    };
    
    appState.transactions.push(transaction);
    
    // Update UI
    updateUI();
  }
}

// Delete expense
function deleteExpense(id) {
  const expenseIndex = appState.plannedExpenses.findIndex(e => e.id === id);
  if (expenseIndex !== -1) {
    const expense = appState.plannedExpenses[expenseIndex];
    
    // Only update totals if it was planned and not paid
    if (expense.status === 'planned') {
      appState.totalExpenses -= expense.amount;
    }
    
    appState.plannedExpenses.splice(expenseIndex, 1);
    
    // Update UI
    updateUI();
  }
}

// Toggle dark mode
function toggleDarkMode() {
  appState.darkMode = elements.darkModeSwitch.checked;
  if (appState.darkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  saveState();
}

// Export data
function exportData() {
  const dataStr = JSON.stringify(appState);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = 'expense-tracker-data.json';
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

// Reset data
function resetData() {
  if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
    appState = {
      balance: 0,
      totalIncome: 0,
      totalExpenses: 0,
      plannedExpenses: [],
      transactions: [],
      darkMode: appState.darkMode,
      currentView: appState.currentView
    };
    localStorage.removeItem('expenseTrackerData');
    updateUI();
  }
}

// Apply filters
function applyFilters() {
  const type = document.getElementById('filter-type').value;
  const category = document.getElementById('filter-category').value;
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  
  // Render transactions with filters
  renderTransactions(type, category, startDate, endDate);
}

// Clear filters
function clearFilters() {
  document.getElementById('filter-type').value = 'all';
  document.getElementById('filter-category').value = 'all';
  
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  document.getElementById('start-date').value = formatDate(firstDay);
  document.getElementById('end-date').value = formatDate(today);
  
  renderTransactions();
}

// Render planned expenses
function renderPlannedExpenses() {
  const list = elements.plannedExpensesList;
  list.innerHTML = '';
  
  if (appState.plannedExpenses.length === 0) {
    list.innerHTML = `<tr><td colspan="4" class="text-center py-4">No planned expenses yet</td></tr>`;
    return;
  }
  
  appState.plannedExpenses.forEach(expense => {
    const row = document.createElement('tr');
    
    // Status badge
    let badgeClass, badgeText;
    if (expense.status === 'paid') {
      badgeClass = 'badge-paid';
      badgeText = 'Paid';
    } else {
      badgeClass = 'badge-planned';
      badgeText = 'Planned';
    }
    
    row.innerHTML = `
      <td>${expense.item}</td>
      <td class="text-danger">$${expense.amount.toFixed(2)}</td>
      <td><span class="badge ${badgeClass}">${badgeText}</span></td>
      <td>
        ${expense.status === 'planned' ? `
          <button class="btn btn-sm btn-success me-1" onclick="markExpenseAsPaid(${expense.id})">
            <i class="fas fa-check"></i>
          </button>
        ` : ''}
        <button class="btn btn-sm btn-danger" onclick="deleteExpense(${expense.id})">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    
    list.appendChild(row);
  });
}

// Render transactions
function renderTransactions(type = 'all', category = 'all', startDate = null, endDate = null) {
  const list = elements.transactionList;
  list.innerHTML = '';
  
  // Filter transactions
  let transactions = [...appState.transactions];
  
  if (type !== 'all') {
    transactions = transactions.filter(t => t.type === type);
  }
  
  if (category !== 'all') {
    transactions = transactions.filter(t => t.category === category);
  }
  
  if (startDate) {
    transactions = transactions.filter(t => t.date >= startDate);
  }
  
  if (endDate) {
    transactions = transactions.filter(t => t.date <= endDate);
  }
  
  if (transactions.length === 0) {
    list.innerHTML = `<tr><td colspan="5" class="text-center py-4">No transactions found</td></tr>`;
    return;
  }
  
  // Sort by date (newest first)
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Render transactions
  transactions.forEach(transaction => {
    const row = document.createElement('tr');
    const isIncome = transaction.type === 'income';
    const isExpense = transaction.type === 'expense';
    const isAdjustment = transaction.type === 'adjustment';
    
    row.innerHTML = `
      <td>
        ${isIncome ? '<span class="badge bg-success">Income</span>' : ''}
        ${isExpense ? '<span class="badge bg-danger">Expense</span>' : ''}
        ${isAdjustment ? '<span class="badge bg-warning text-dark">Adjustment</span>' : ''}
      </td>
      <td class="${isIncome ? 'text-success' : isExpense ? 'text-danger' : isAdjustment && transaction.amount > 0 ? 'text-success' : 'text-danger'}">
        ${isIncome || (isAdjustment && transaction.amount > 0) ? '+' : ''}${isExpense || (isAdjustment && transaction.amount < 0) ? '-' : ''}$${Math.abs(transaction.amount).toFixed(2)}
      </td>
      <td>${transaction.category}</td>
      <td>${transaction.date}</td>
      <td><span class="badge bg-success">Completed</span></td>
    `;
    
    list.appendChild(row);
  });
}

// Initialize charts
function initCharts() {
  // Pie chart for expense categories
  elements.pieChart = new Chart(
    document.getElementById('pie-chart'),
    {
      type: 'pie',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [
            '#ef476f',
            '#ffd166',
            '#06d6a0',
            '#118ab2',
            '#073b4c',
            '#7209b7'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          },
          title: {
            display: false
          }
        }
      }
    }
  );
  
  // Bar chart for monthly summary
  elements.barChart = new Chart(
    document.getElementById('bar-chart'),
    {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Income',
            data: [],
            backgroundColor: '#06d6a0'
          },
          {
            label: 'Expenses',
            data: [],
            backgroundColor: '#ef476f'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    }
  );
}

// Update charts
function updateCharts() {
  // Expense categories
  const categories = {};
  appState.transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
  
  elements.pieChart.data.labels = Object.keys(categories);
  elements.pieChart.data.datasets[0].data = Object.values(categories);
  elements.pieChart.update();
  
  // Monthly summary
  const months = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  appState.transactions.forEach(t => {
    const month = new Date(t.date).getMonth();
    const year = new Date(t.date).getFullYear();
    const key = `${year}-${month}`;
    
    if (!months[key]) {
      months[key] = { income: 0, expense: 0 };
    }
    
    if (t.type === 'income' || (t.type === 'adjustment' && t.amount > 0)) {
      months[key].income += Math.abs(t.amount);
    } else if (t.type === 'expense' || (t.type === 'adjustment' && t.amount < 0)) {
      months[key].expense += Math.abs(t.amount);
    }
  });
  
  // Get last 6 months
  const now = new Date();
  const labels = [];
  const incomeData = [];
  const expenseData = [];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(now.getMonth() - i);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    
    labels.push(`${monthNames[date.getMonth()]} ${date.getFullYear()}`);
    
    if (months[key]) {
      incomeData.push(months[key].income);
      expenseData.push(months[key].expense);
    } else {
      incomeData.push(0);
      expenseData.push(0);
    }
  }
  
  elements.barChart.data.labels = labels;
  elements.barChart.data.datasets[0].data = incomeData;
  elements.barChart.data.datasets[1].data = expenseData;
  elements.barChart.update();
}

// Update UI
function updateUI() {
  // Update summary values
  elements.totalIncome.textContent = `$${appState.totalIncome.toFixed(2)}`;
  elements.plannedExpenses.textContent = `$${appState.totalExpenses.toFixed(2)}`;
  elements.mainBalance.textContent = `$${appState.balance.toFixed(2)}`;
  
  // Render lists
  renderPlannedExpenses();
  renderTransactions();
  
  // Update settings
  elements.darkModeSwitch.checked = appState.darkMode;
  if (appState.darkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  
  // Update charts if in analytics view
  if (appState.currentView === 'analytics') {
    updateCharts();
  }
  
  saveState();
}

// Save state to localStorage
function saveState() {
  localStorage.setItem('expenseTrackerData', JSON.stringify(appState));
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Set today's date as default in forms
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('income-date').value = today;
  document.getElementById('expense-date').value = today;
  
  // Initialize the app
  initApp();
});

// Make functions available globally for HTML event handlers
window.markExpenseAsPaid = markExpenseAsPaid;
window.deleteExpense = deleteExpense;
