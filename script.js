// script.js

// 1. Cấu hình Firebase
// Truy cập Firebase Console, chọn dự án của bạn, sau đó "Project settings" (biểu tượng bánh răng),
// và cuộn xuống mục "Your apps" để lấy cấu hình.
const firebaseConfig = {
    apiKey: "AIzaSyDhRhLAvh22RAYh_6rELSYHMd2AaY51Ruw",
    authDomain: "project-teaching-89801.firebaseapp.com",
    projectId: "project-teaching-89801",
    storageBucket: "project-teaching-89801.firebasestorage.app",
    messagingSenderId: "441282021443",
    appId: "1:441282021443:web:223ef629568b9b6e39acf6",
    measurementId: "G-KB0ZT3GR3K"
};

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 2. Tham chiếu đến các phần tử DOM
const dashboardWrapper = document.getElementById('dashboard-wrapper');

// Navigation
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');

// Transaction Form
const typeIncomeRadio = document.getElementById('type-income');
const typeExpenseRadio = document.getElementById('type-expense');
const transactionNameInput = document.getElementById('transaction-name');
const transactionAmountInput = document.getElementById('transaction-amount');
const transactionDateInput = document.getElementById('transaction-date');
const addTransactionBtn = document.getElementById('add-transaction-btn');

// Summary Cards
const totalIncomeCard = document.getElementById('total-income-card');
const totalExpenseCard = document.getElementById('total-expense-card');
const currentBalanceCard = document.getElementById('current-balance-card');

// Transaction Table
const transactionsTableBody = document.getElementById('transactions-table-body');
const totalIncomeTableSpan = document.getElementById('total-income-table');
const totalExpenseTableSpan = document.getElementById('total-expense-table');
const currentBalanceTableSpan = document.getElementById('current-balance-table');

// 3. Hàm khởi tạo Dashboard
function initDashboard() {
    dashboardWrapper.style.display = 'flex'; // Luôn hiển thị dashboard
    loadTransactions(); // Tải giao dịch ngay lập tức
    activateSection('overview'); // Mặc định hiển thị trang tổng quan
}

// 4. Hàm chuyển đổi giữa các section trong dashboard
function activateSection(sectionId) {
    contentSections.forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId + '-section').classList.add('active');

    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === sectionId) {
            item.classList.add('active');
        }
    });
}

// Xử lý click trên các nav item
navItems.forEach(item => {
    item.addEventListener('click', () => {
        activateSection(item.dataset.section);
    });
});

// 5. Thêm giao dịch
addTransactionBtn.addEventListener('click', async () => {
    const type = typeIncomeRadio.checked ? 'income' : 'expense';
    const name = transactionNameInput.value.trim();
    const amount = parseFloat(transactionAmountInput.value);
    const date = transactionDateInput.value;

    if (name === '' || isNaN(amount) || amount <= 0 || date === '') {
        alert('Vui lòng nhập đầy đủ và chính xác thông tin giao dịch (loại, tên, số tiền và ngày).');
        return;
    }

    try {
        await db.collection('transactions').add({ // Đổi collection từ 'expenses' thành 'transactions'
            type: type, // Lưu loại giao dịch (income/expense)
            name: name,
            amount: amount,
            date: date,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('Giao dịch đã được thêm thành công!');
        // Clear form and switch to transactions view
        transactionNameInput.value = '';
        transactionAmountInput.value = '';
        transactionDateInput.value = '';
        typeIncomeRadio.checked = true; // Đặt lại về "Thu" mặc định
        activateSection('transactions'); // Chuyển sang mục "Giao Dịch" sau khi thêm
    } catch (error) {
        alert('Lỗi khi thêm giao dịch: ' + error.message);
    }
});

// 6. Tải và hiển thị giao dịch vào bảng
const loadTransactions = () => {
    db.collection('transactions') // Đọc từ collection 'transactions'
        .orderBy('timestamp', 'desc')
        .onSnapshot(snapshot => {
            transactionsTableBody.innerHTML = ''; // Xóa dữ liệu cũ trong bảng
            let totalIncome = 0;
            let totalExpense = 0;

            snapshot.forEach(doc => {
                const transaction = doc.data();
                const tr = document.createElement('tr');
                tr.setAttribute('data-id', doc.id);
                tr.classList.add(transaction.type + '-row'); // Thêm class để dễ style

                const displayType = transaction.type === 'income' ? 'Thu' : 'Chi';

                tr.innerHTML = `
                    <td>${displayType}</td>
                    <td>${transaction.name}</td>
                    <td>${transaction.amount.toLocaleString('vi-VN')} VNĐ</td>
                    <td>${transaction.date}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="edit-btn"><i class="fas fa-edit"></i> Sửa</button>
                            <button class="delete-btn"><i class="fas fa-trash-alt"></i> Xóa</button>
                        </div>
                    </td>
                `;
                transactionsTableBody.appendChild(tr);

                if (transaction.type === 'income') {
                    totalIncome += transaction.amount;
                } else {
                    totalExpense += transaction.amount;
                }
            });

            const currentBalance = totalIncome - totalExpense;

            // Cập nhật thẻ tổng quan
            totalIncomeCard.textContent = totalIncome.toLocaleString('vi-VN') + ' VNĐ';
            totalExpenseCard.textContent = totalExpense.toLocaleString('vi-VN') + ' VNĐ';
            currentBalanceCard.textContent = currentBalance.toLocaleString('vi-VN') + ' VNĐ';

            // Cập nhật tổng ở bảng
            totalIncomeTableSpan.textContent = totalIncome.toLocaleString('vi-VN') + ' VNĐ';
            totalExpenseTableSpan.textContent = totalExpense.toLocaleString('vi-VN') + ' VNĐ';
            currentBalanceTableSpan.textContent = currentBalance.toLocaleString('vi-VN') + ' VNĐ';
        }, error => {
            console.error("Lỗi khi tải giao dịch: ", error);
            alert("Không thể tải giao dịch. Vui lòng thử lại.");
        });
};

// 7. Xử lý sửa và xóa giao dịch trên bảng (Event Delegation)
transactionsTableBody.addEventListener('click', async (e) => {
    const tr = e.target.closest('tr');
    if (!tr) return;

    const transactionId = tr.getAttribute('data-id');

    // Xử lý xóa giao dịch
    if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
        if (confirm('Bạn có chắc muốn xóa giao dịch này?')) {
            try {
                await db.collection('transactions').doc(transactionId).delete();
                alert('Giao dịch đã được xóa.');
            } catch (error) {
                alert('Lỗi khi xóa giao dịch: ' + error.message);
            }
        }
    }

    // Xử lý sửa giao dịch
    if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
        const docRef = db.collection('transactions').doc(transactionId);
        const doc = await docRef.get();
        if (doc.exists) {
            const transaction = doc.data();
            const newType = prompt('Nhập loại giao dịch mới (income/expense):', transaction.type);
            const newName = prompt('Nhập tên giao dịch mới:', transaction.name);
            const newAmountStr = prompt('Nhập số tiền mới:', transaction.amount);
            const newDate = prompt('Nhập ngày mới (YYYY-MM-DD):', transaction.date);

            const newAmount = parseFloat(newAmountStr);

            if (newName && !isNaN(newAmount) && newAmount > 0 && newDate && (newType === 'income' || newType === 'expense')) {
                try {
                    await docRef.update({
                        type: newType, // Cập nhật loại
                        name: newName,
                        amount: newAmount,
                        date: newDate
                    });
                    alert('Giao dịch đã được cập nhật.');
                } catch (error) {
                    alert('Lỗi khi cập nhật giao dịch: ' + error.message);
                }
            } else {
                alert('Thông tin cập nhật không hợp lệ. Vui lòng kiểm tra lại loại giao dịch (income/expense), tên, số tiền và ngày.');
            }
        }
    }
});

// Khởi tạo dashboard khi DOM được tải
document.addEventListener('DOMContentLoaded', initDashboard);