document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const nightModeToggle = document.getElementById('night-mode-toggle');
    const appContainer = document.querySelector('.app-container');
    const transactionModal = document.getElementById('transaction-modal');
    const confirmModal = document.getElementById('confirm-modal');
    const detailsModal = document.getElementById('details-modal');
    const addIncomeBtn = document.getElementById('add-income-btn');
    const addExpenseBtn = document.getElementById('add-expense-btn');
    const closeModalBtn = document.querySelector('.close-modal');
    const closeConfirmModalBtn = document.querySelector('.close-confirm-modal');
    const closeDetailsModalBtn = document.querySelector('.close-details-modal');
    const transactionForm = document.getElementById('transaction-form');
    const transactionsList = document.getElementById('transactions-list');
    const categorySelect = document.getElementById('transaction-category');
    const modalTitle = document.getElementById('modal-title');
    const submitBtn = document.getElementById('submit-btn');
    const submitText = document.getElementById('submit-text');
    const deleteBtn = document.getElementById('delete-btn');
    const resetBtn = document.getElementById('reset-btn');
    const transactionFilter = document.getElementById('transaction-filter');
    const cancelBtn = document.getElementById('cancel-btn');
    const confirmBtn = document.getElementById('confirm-btn');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmMessage = document.getElementById('confirm-message');
    const detailTitle = document.getElementById('details-title');
    const detailIcon = document.getElementById('detail-icon');
    const detailAmount = document.getElementById('detail-amount');
    const detailType = document.getElementById('detail-type');
    const detailCategory = document.getElementById('detail-category');
    const detailDate = document.getElementById('detail-date');
    const detailNote = document.getElementById('detail-note');
    const noteItem = document.getElementById('note-item');
    const editDetailBtn = document.getElementById('edit-detail-btn');
    const deleteDetailBtn = document.getElementById('delete-detail-btn');

    // State
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let isEditing = false;
    let editId = null;
    let currentAction = null;
    let currentTransactionType = 'expense';

    // Categories
    const categories = {
        expense: [
            { id: 'food', name: 'Food & Dining', icon: 'fas fa-utensils' },
            { id: 'transport', name: 'Transportation', icon: 'fas fa-bus' },
            { id: 'shopping', name: 'Shopping', icon: 'fas fa-shopping-bag' },
            { id: 'housing', name: 'Housing', icon: 'fas fa-home' },
            { id: 'entertainment', name: 'Entertainment', icon: 'fas fa-film' },
            { id: 'health', name: 'Health', icon: 'fas fa-heartbeat' },
            { id: 'education', name: 'Education', icon: 'fas fa-book' },
            { id: 'other', name: 'Other', icon: 'fas fa-wallet' }
        ],
        income: [
            { id: 'salary', name: 'Salary', icon: 'fas fa-money-bill-wave' },
            { id: 'freelance', name: 'Freelance', icon: 'fas fa-laptop-code' },
            { id: 'investment', name: 'Investment', icon: 'fas fa-chart-line' },
            { id: 'gift', name: 'Gift', icon: 'fas fa-gift' },
            { id: 'other', name: 'Other', icon: 'fas fa-wallet' }
        ]
    };

    // Initialize the app
    function initApp() {
        renderTransactions();
        updateBalance();
        setupEventListeners();
        setCurrentDate();
    }

    // Set current date as default in form
    function setCurrentDate() {
        const today = new Date();
        const formattedDate = today.toISOString().substr(0, 10);
        document.getElementById('transaction-date').value = formattedDate;
    }

    // Setup event listeners
    function setupEventListeners() {
        // Night mode toggle
        nightModeToggle.addEventListener('change', toggleTheme);
        
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'dark';
        appContainer.setAttribute('data-theme', savedTheme);
        nightModeToggle.checked = savedTheme === 'dark';

        // Transaction modals
        addIncomeBtn.addEventListener('click', () => openModal('income'));
        addExpenseBtn.addEventListener('click', () => openModal('expense'));

        // Close modals
        closeModalBtn.addEventListener('click', closeModal);
        closeConfirmModalBtn.addEventListener('click', closeConfirmModal);
        closeDetailsModalBtn.addEventListener('click', closeDetailsModal);

        // Close modals when clicking outside
        transactionModal.addEventListener('click', (e) => {
            if (e.target === transactionModal) closeModal();
        });
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) closeConfirmModal();
        });
        detailsModal.addEventListener('click', (e) => {
            if (e.target === detailsModal) closeDetailsModal();
        });

        // Form submission
        transactionForm.addEventListener('submit', handleSubmit);

        // Filter transactions
        transactionFilter.addEventListener('change', renderTransactions);

        // Reset button
        resetBtn.addEventListener('click', () => {
            currentAction = 'reset';
            showConfirmModal(
                'Reset All Data',
                'Are you sure you want to reset all transactions? This cannot be undone.',
                'Reset'
            );
        });

        // Confirmation modal buttons
        cancelBtn.addEventListener('click', closeConfirmModal);
        confirmBtn.addEventListener('click', handleConfirmAction);

        // Details modal buttons
        editDetailBtn.addEventListener('click', editFromDetails);
        deleteDetailBtn.addEventListener('click', deleteFromDetails);
    }

    // Toggle between light/dark theme
    function toggleTheme() {
        const theme = nightModeToggle.checked ? 'dark' : 'light';
        appContainer.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    // Open modal with correct type
    function openModal(type) {
        isEditing = false;
        editId = null;
        currentTransactionType = type;

        // Reset form
        transactionForm.reset();
        setCurrentDate();

        // Set modal title and type
        if (type === 'income') {
            modalTitle.textContent = 'Add Income';
            submitText.textContent = 'Add Income';
        } else {
            modalTitle.textContent = 'Add Expense';
            submitText.textContent = 'Add Expense';
        }

        // Update categories
        updateCategories(type);

        // Hide delete button for new transactions
        deleteBtn.style.display = 'none';

        // Open modal
        transactionModal.classList.add('active');
    }

    // Close modal
    function closeModal() {
        transactionModal.classList.remove('active');
    }

    // Close confirmation modal
    function closeConfirmModal() {
        confirmModal.classList.remove('active');
    }

    // Close details modal
    function closeDetailsModal() {
        detailsModal.classList.remove('active');
    }

    // Show confirmation modal
    function showConfirmModal(title, message, confirmText) {
        confirmTitle.textContent = title;
        confirmMessage.textContent = message;
        confirmBtn.textContent = confirmText;
        confirmModal.classList.add('active');
    }

    // Show transaction details
    function showTransactionDetails(id) {
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) return;
        
        const isIncome = transaction.amount > 0;
        const type = isIncome ? 'income' : 'expense';
        const amount = Math.abs(transaction.amount);
        const categoryName = getCategoryName(transaction.category, type);
        const categoryIcon = getCategoryIcon(transaction.category, type);
        
        // Format date
        const formattedDate = new Date(transaction.date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        // Set details
        detailTitle.textContent = transaction.note || categoryName;
        detailAmount.textContent = `${isIncome ? '+' : '-'}₹${amount.toFixed(2)}`;
        detailAmount.style.color = isIncome ? 'var(--income-color)' : 'var(--expense-color)';
        detailType.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        detailType.style.color = isIncome ? 'var(--income-color)' : 'var(--expense-color)';
        detailCategory.textContent = categoryName;
        detailDate.textContent = formattedDate;
        
        // Set icon
        detailIcon.innerHTML = `<i class="${categoryIcon}"></i>`;
        detailIcon.style.background = `linear-gradient(135deg, var(--primary-color), var(--primary-dark))`;
        
        // Show note if exists
        if (transaction.note) {
            detailNote.textContent = transaction.note;
            noteItem.style.display = 'flex';
        } else {
            noteItem.style.display = 'none';
        }
        
        // Set current transaction for edit/delete
        editId = id;
        currentTransactionType = type;
        
        // Open modal
        detailsModal.classList.add('active');
    }

    // Edit from details view
    function editFromDetails() {
        closeDetailsModal();
        editTransaction(editId);
    }

    // Delete from details view
    function deleteFromDetails() {
        closeDetailsModal();
        currentAction = 'delete';
        showConfirmModal(
            'Delete Transaction',
            'Are you sure you want to delete this transaction?',
            'Delete'
        );
    }

    // Update categories based on transaction type
    function updateCategories(type = currentTransactionType) {
        categorySelect.innerHTML = '';
        
        const categoryList = type === 'income' ? categories.income : categories.expense;
        
        categoryList.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }

    // Handle form submission
    function handleSubmit(e) {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const category = document.getElementById('transaction-category').value;
        const date = document.getElementById('transaction-date').value;
        const note = document.getElementById('transaction-note').value;
        
        if (!amount || !category || !date) {
            showAlert('Please fill in all required fields');
            return;
        }
        
        // Check for negative balance when adding expense
        if (currentTransactionType === 'expense' && !isEditing) {
            const currentBalance = calculateBalance();
            if (amount > currentBalance) {
                showAlert('Insufficient balance! You cannot spend more than you have.');
                return;
            }
        }
        
        const transactionData = {
            id: isEditing ? editId : Date.now(),
            amount: currentTransactionType === 'income' ? amount : -amount,
            type: currentTransactionType,
            category,
            date,
            note: note || getCategoryName(category, currentTransactionType),
            timestamp: new Date(date).getTime()
        };
        
        if (isEditing) {
            // Update existing transaction
            transactions = transactions.map(t => 
                t.id === editId ? transactionData : t
            );
        } else {
            // Add new transaction
            transactions.unshift(transactionData);
        }
        
        // Save and update UI
        saveTransactions();
        renderTransactions();
        updateBalance();
        closeModal();
        
        // Show success feedback
        showSuccessFeedback(isEditing ? 'Transaction updated' : 'Transaction added');
    }

    // Handle confirmation actions
    function handleConfirmAction() {
        if (currentAction === 'delete') {
            // Delete transaction
            transactions = transactions.filter(t => t.id !== editId);
            saveTransactions();
            renderTransactions();
            updateBalance();
            showSuccessFeedback('Transaction deleted');
        } else if (currentAction === 'reset') {
            // Reset all transactions
            transactions = [];
            saveTransactions();
            renderTransactions();
            updateBalance();
            showSuccessFeedback('All data reset');
        }
        
        closeConfirmModal();
        closeModal();
    }

    // Edit transaction
    function editTransaction(id) {
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) return;
        
        isEditing = true;
        editId = id;
        currentTransactionType = transaction.type;
        
        // Fill form with transaction data
        document.getElementById('transaction-amount').value = Math.abs(transaction.amount);
        document.getElementById('transaction-date').value = transaction.date;
        document.getElementById('transaction-note').value = transaction.note;
        
        // Update categories and select the right one
        updateCategories(transaction.type);
        setTimeout(() => {
            document.getElementById('transaction-category').value = transaction.category;
        }, 0);
        
        // Update modal title
        modalTitle.textContent = 'Edit Transaction';
        submitText.textContent = 'Update Transaction';
        
        // Show delete button
        deleteBtn.style.display = 'block';
        deleteBtn.onclick = (e) => {
            e.preventDefault();
            currentAction = 'delete';
            showConfirmModal(
                'Delete Transaction',
                'Are you sure you want to delete this transaction?',
                'Delete'
            );
        };
        
        // Open modal
        transactionModal.classList.add('active');
    }

    // Calculate current balance
    function calculateBalance() {
        return transactions.reduce((sum, t) => sum + t.amount, 0);
    }

    // Render transactions list
    function renderTransactions() {
        const filterType = transactionFilter.value;
        
        let filteredTransactions = [...transactions];
        
        if (filterType !== 'all') {
            filteredTransactions = filteredTransactions.filter(
                t => t.type === filterType
            );
        }
        
        if (filteredTransactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exchange-alt"></i>
                    <p>No transactions found</p>
                    <small>${filterType === 'all' ? 'Add your first transaction to get started' : 'No ' + filterType + ' transactions'}</small>
                </div>
            `;
            return;
        }
        
        // Sort transactions by date (newest first)
        filteredTransactions.sort((a, b) => b.timestamp - a.timestamp);
        
        transactionsList.innerHTML = '';
        
        filteredTransactions.forEach(transaction => {
            const isIncome = transaction.amount > 0;
            const type = isIncome ? 'income' : 'expense';
            const categoryIcon = getCategoryIcon(transaction.category, type);
            const categoryName = getCategoryName(transaction.category, type);
            const amount = Math.abs(transaction.amount);
            
            const formattedDate = new Date(transaction.date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
            
            const transactionEl = document.createElement('div');
            transactionEl.className = 'transaction-item';
            transactionEl.dataset.id = transaction.id;
            transactionEl.innerHTML = `
                <div class="transaction-icon" style="background-color: rgba(124, 77, 255, 0.1); color: var(--primary-color)">
                    <i class="${categoryIcon}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${transaction.note || categoryName}</div>
                    <div class="transaction-category">${categoryName}</div>
                    <div class="transaction-date">${formattedDate}</div>
                </div>
                <div class="transaction-amount ${isIncome ? 'transaction-income' : 'transaction-expense'}">
                    ${isIncome ? '+' : '-'}₹${amount.toFixed(2)}
                </div>
            `;
            
            // Add click event for showing details
            transactionEl.addEventListener('click', () => showTransactionDetails(transaction.id));
            
            transactionsList.appendChild(transactionEl);
        });
    }

    // Update balance information
    function updateBalance() {
        const totalIncome = transactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpense = transactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            
        const totalBalance = totalIncome - totalExpense;
        
        document.getElementById('total-balance').textContent = totalBalance.toFixed(2);
        document.getElementById('total-income').textContent = totalIncome.toFixed(2);
        document.getElementById('total-expense').textContent = totalExpense.toFixed(2);
        
        // Change balance color if negative
        const balanceElement = document.getElementById('total-balance');
        if (totalBalance < 0) {
            balanceElement.style.color = 'var(--expense-color)';
        } else {
            balanceElement.style.color = 'var(--text-primary)';
        }
    }

    // Get category name by ID
    function getCategoryName(id, type) {
        const categoryList = type === 'income' ? categories.income : categories.expense;
        const category = categoryList.find(c => c.id === id);
        return category ? category.name : 'Other';
    }

    // Get category icon by ID
    function getCategoryIcon(id, type) {
        const categoryList = type === 'income' ? categories.income : categories.expense;
        const category = categoryList.find(c => c.id === id);
        return category ? category.icon : 'fas fa-wallet';
    }

    // Save transactions to localStorage
    function saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }

    // Show alert message
    function showAlert(message) {
        const alertEl = document.createElement('div');
        alertEl.className = 'alert-message';
        alertEl.textContent = message;
        document.body.appendChild(alertEl);
        
        setTimeout(() => {
            alertEl.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            alertEl.classList.remove('show');
            setTimeout(() => {
                alertEl.remove();
            }, 300);
        }, 3000);
    }

    // Show success feedback
    function showSuccessFeedback(message) {
        const feedbackEl = document.createElement('div');
        feedbackEl.className = 'success-feedback';
        
        feedbackEl.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(feedbackEl);
        
        setTimeout(() => {
            feedbackEl.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            feedbackEl.classList.remove('show');
            setTimeout(() => {
                feedbackEl.remove();
            }, 300);
        }, 2000);
    }

    // Initialize the app
    initApp();
});