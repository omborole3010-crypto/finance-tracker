document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const form = document.getElementById('transaction-form');
    const transactionIdInput = document.getElementById('transaction-id');
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const typeInput = document.getElementById('type');
    const addBtn = document.getElementById('add-btn');
    const updateBtn = document.getElementById('update-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const transactionList = document.getElementById('transaction-list');
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpenseEl = document.getElementById('total-expense');
    const balanceEl = document.getElementById('balance');
    const expenseChartCanvas = document.getElementById('expense-chart').getContext('2d');

    let expenseChart;

    // --- API Calls ---
    const API_URL = '/api/transactions';

    const getTransactions = async () => {
        const response = await fetch(API_URL);
        return await response.json();
    };

    const addTransaction = async (transaction) => {
        await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction),
        });
    };

    const updateTransaction = async (id, transaction) => {
        await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction),
        });
    };

    const deleteTransaction = async (id) => {
        await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
        });
    };

    // --- UI Logic ---
    const renderTransactions = (transactions) => {
        transactionList.innerHTML = '';
        if (transactions.length === 0) {
            transactionList.innerHTML = '<li>No transactions yet.</li>';
            return;
        }

        transactions.forEach(tx => {
            const item = document.createElement('li');
            item.className = `list-item ${tx.type}-border`;
            item.innerHTML = `
                <span>${tx.description}</span>
                <span class="${tx.type}">$${tx.amount.toFixed(2)}</span>
                <div class="buttons">
                    <button class="edit-btn" data-id="${tx.id}">Edit</button>
                    <button class="delete-btn" data-id="${tx.id}">Delete</button>
                </div>
            `;
            transactionList.appendChild(item);
        });
    };
    
    const updateDashboard = (transactions) => {
        const amounts = transactions.map(tx => tx.amount);
        const totalIncome = amounts
            .filter((_, i) => transactions[i].type === 'income')
            .reduce((acc, item) => acc + item, 0);

        const totalExpense = amounts
            .filter((_, i) => transactions[i].type === 'expense')
            .reduce((acc, item) => acc + item, 0);
        
        const balance = totalIncome - totalExpense;

        totalIncomeEl.textContent = `$${totalIncome.toFixed(2)}`;
        totalExpenseEl.textContent = `$${totalExpense.toFixed(2)}`;
        balanceEl.textContent = `$${balance.toFixed(2)}`;
    };

    const renderChart = (transactions) => {
        const expenseData = transactions
            .filter(tx => tx.type === 'expense')
            .reduce((acc, tx) => {
                acc[tx.description] = (acc[tx.description] || 0) + tx.amount;
                return acc;
            }, {});

        const labels = Object.keys(expenseData);
        const data = Object.values(expenseData);
        
        if (expenseChart) {
            expenseChart.destroy();
        }

        expenseChart = new Chart(expenseChartCanvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'top' } }
            }
        });
    };

    const resetForm = () => {
        form.reset();
        transactionIdInput.value = '';
        addBtn.classList.remove('hidden');
        updateBtn.classList.add('hidden');
        cancelBtn.classList.add('hidden');
    };

    const loadApp = async () => {
        const transactions = await getTransactions();
        renderTransactions(transactions);
        updateDashboard(transactions);
        renderChart(transactions);
    };

    // --- Event Listeners ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = transactionIdInput.value;
        const transaction = {
            description: descriptionInput.value,
            amount: parseFloat(amountInput.value),
            type: typeInput.value
        };

        if (id) { // If ID exists, it's an update
            await updateTransaction(id, transaction);
        } else { // Otherwise, it's a new addition
            await addTransaction(transaction);
        }

        resetForm();
        await loadApp();
    });

    transactionList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            await deleteTransaction(id);
            await loadApp();
        }

        if (e.target.classList.contains('edit-btn')) {
            const id = e.target.dataset.id;
            const transactions = await getTransactions();
            const txToEdit = transactions.find(tx => tx.id == id);
            
            transactionIdInput.value = txToEdit.id;
            descriptionInput.value = txToEdit.description;
            amountInput.value = txToEdit.amount;
            typeInput.value = txToEdit.type;

            addBtn.classList.add('hidden');
            updateBtn.classList.remove('hidden');
            cancelBtn.classList.remove('hidden');
        }
    });

    cancelBtn.addEventListener('click', resetForm);

    // --- Initial Load ---
    loadApp();
});