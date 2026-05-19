        let appData = JSON.parse(localStorage.getItem('financialData')) || {};
        let configSettings = JSON.parse(localStorage.getItem('financialConfig')) || {
            companyName: '',
            ppnTitle: '',
            location: '',
            atasanName: '',
            ppnRate: 10,
            royaltiRate: 3,
            ppnOnRoyaltiRate: 11
        };

        let currentEditDay = null;
        let financialChart = null;
        let configExpanded = false;

        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

        function init() {
            loadConfig();
            const today = new Date();
            document.getElementById('monthSelect').value = today.getMonth() + 1;
            document.getElementById('yearSelect').value = today.getFullYear();
            updateUI();
            attachEventListeners();
        }

        function loadConfig() {
            document.getElementById('ppnRate').value = configSettings.ppnRate;
            document.getElementById('royaltiRate').value = configSettings.royaltiRate;
            document.getElementById('ppnOnRoyaltiRate').value = configSettings.ppnOnRoyaltiRate;
        }

        function saveConfig() {
            configSettings = {
                companyName: document.getElementById('companyName').value || 'WARUNG BAKSO KOTA',
                ppnTitle: document.getElementById('ppnTitle').value || 'LAPORAN PPN HARIAN',
                location: document.getElementById('location').value || 'Jayapura',
                atasanName: document.getElementById('atasanName').value || 'Joko Purcahyono',
                ppnRate: parseFloat(document.getElementById('ppnRate').value) || 10,
                royaltiRate: parseFloat(document.getElementById('royaltiRate').value) || 3,
                ppnOnRoyaltiRate: parseFloat(document.getElementById('ppnOnRoyaltiRate').value) || 11
            };

            localStorage.setItem('financialConfig', JSON.stringify(configSettings));
            showSuccessMessage('✓ Konfigurasi berhasil disimpan');
            updateDashboard();
            updatePPNTable();
            updateRoyaltiTable();
        }

        function toggleConfig() {
            const section = document.getElementById('configSection');
            configExpanded = !configExpanded;
            
            if (configExpanded) {
                section.classList.remove('collapsed');
            } else {
                section.classList.add('collapsed');
            }
        }

        function attachEventListeners() {
            document.getElementById('monthSelect').addEventListener('change', updateUI);
            document.getElementById('yearSelect').addEventListener('change', updateUI);
            document.getElementById('daySelect').addEventListener('change', updateCalculations);
            
            const numInputs = ['totalPenjualan', 'tunai', 'qris', 'edc', 'transfer', 'gojek', 'grab', 'pesanan', 'belanjaPagi', 'belanjaSore', 'daging', 'dll'];
            numInputs.forEach(id => {
                document.getElementById(id).addEventListener('input', updateCalculations);
            });
        }

        function updateUI() {
            const month = parseInt(document.getElementById('monthSelect').value);
            const year = parseInt(document.getElementById('yearSelect').value);
            const monthName = months[month - 1];

            document.getElementById('dataTableTitle').textContent = `📋 Data Bulan ${monthName} ${year}`;
            document.getElementById('formTitle').textContent = currentEditDay ? `✏️ Edit Data Tanggal ${currentEditDay}` : '📝 Input Data Harian';

            const daysInMonth = new Date(year, month, 0).getDate();
            const daySelect = document.getElementById('daySelect');
            daySelect.innerHTML = '';
            for (let i = 1; i <= daysInMonth; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i;
                daySelect.appendChild(option);
            }

            loadDataTable();
            updateDashboard();
            updatePPNTable();
            updateRoyaltiTable();
            updateCalculations();
        }

        function updateCalculations() {
            const belanjaPagi = parseFloat(document.getElementById('belanjaPagi').value) || 0;
            const belanjaSore = parseFloat(document.getElementById('belanjaSore').value) || 0;
            const daging = parseFloat(document.getElementById('daging').value) || 0;
            const dll = parseFloat(document.getElementById('dll').value) || 0;

            const totalPengeluaran = belanjaPagi + belanjaSore + daging + dll;

            const totalPenjualan = parseFloat(document.getElementById('totalPenjualan').value) || 0;
            const pesanan = parseFloat(document.getElementById('pesanan').value) || 0;

            const month = parseInt(document.getElementById('monthSelect').value);
            const year = parseInt(document.getElementById('yearSelect').value);
            const key = `${year}-${month}`;

            let prevSaldo = 0;
            const dataForMonth = appData[key] || [];
            if (dataForMonth.length > 0) {
                prevSaldo = dataForMonth[dataForMonth.length - 1].saldo;
            }

            const saldo = prevSaldo + totalPenjualan + pesanan - totalPengeluaran;

            document.getElementById('totalPengeluaranDisplay').textContent = `Rp ${totalPengeluaran.toLocaleString('id-ID')}`;
            document.getElementById('saldoDisplay').textContent = `Rp ${saldo.toLocaleString('id-ID')}`;
        }

        function showPreview() {
            const day = document.getElementById('daySelect').value;
            const totalPenjualan = parseFloat(document.getElementById('totalPenjualan').value) || 0;
            const tunai = parseFloat(document.getElementById('tunai').value) || 0;
            const belanjaPagi = parseFloat(document.getElementById('belanjaPagi').value) || 0;
            const belanjaSore = parseFloat(document.getElementById('belanjaSore').value) || 0;
            const daging = parseFloat(document.getElementById('daging').value) || 0;
            const dll = parseFloat(document.getElementById('dll').value) || 0;
            const keterangan = document.getElementById('keterangan').value;

            if (!totalPenjualan || !tunai) {
                alert('Mohon lengkapi Total Penjualan dan Tunai');
                return;
            }

            const totalPengeluaran = belanjaPagi + belanjaSore + daging + dll;

            document.getElementById('previewDay').textContent = day;
            document.getElementById('previewTotalPenjualan').textContent = `Rp ${totalPenjualan.toLocaleString('id-ID')}`;
            document.getElementById('previewTunai').textContent = `Rp ${tunai.toLocaleString('id-ID')}`;
            document.getElementById('previewTotalPengeluaran').textContent = `Rp ${totalPengeluaran.toLocaleString('id-ID')}`;
            document.getElementById('previewSaldo').textContent = document.getElementById('saldoDisplay').textContent;
            document.getElementById('previewKeterangan').textContent = keterangan || '-';

            document.getElementById('previewSection').classList.add('show');
        }

        function hidePreview() {
            document.getElementById('previewSection').classList.remove('show');
        }

        function saveData() {
            const month = parseInt(document.getElementById('monthSelect').value);
            const year = parseInt(document.getElementById('yearSelect').value);
            const key = `${year}-${month}`;

            const day = parseInt(document.getElementById('daySelect').value);
            const totalPenjualan = parseFloat(document.getElementById('totalPenjualan').value) || 0;
            const tunai = parseFloat(document.getElementById('tunai').value) || 0;
            const qris = parseFloat(document.getElementById('qris').value) || 0;
            const edc = parseFloat(document.getElementById('edc').value) || 0;
            const transfer = parseFloat(document.getElementById('transfer').value) || 0;
            const gojek = parseFloat(document.getElementById('gojek').value) || 0;
            const grab = parseFloat(document.getElementById('grab').value) || 0;
            const pesanan = parseFloat(document.getElementById('pesanan').value) || 0;
            const belanjaPagi = parseFloat(document.getElementById('belanjaPagi').value) || 0;
            const belanjaSore = parseFloat(document.getElementById('belanjaSore').value) || 0;
            const daging = parseFloat(document.getElementById('daging').value) || 0;
            const dll = parseFloat(document.getElementById('dll').value) || 0;
            const keterangan = document.getElementById('keterangan').value;

            const totalPengeluaran = belanjaPagi + belanjaSore + daging + dll;

            if (!appData[key]) {
                appData[key] = [];
            }

            const existingIndex = appData[key].findIndex(item => item.day === day);
            if (existingIndex >= 0) {
                appData[key][existingIndex] = {
                    day, totalPenjualan, tunai, qris, edc, transfer, gojek, grab, pesanan,
                    totalPengeluaran, belanjaPagi, belanjaSore, daging, dll, keterangan, saldo: 0
                };
            } else {
                appData[key].push({
                    day, totalPenjualan, tunai, qris, edc, transfer, gojek, grab, pesanan,
                    totalPengeluaran, belanjaPagi, belanjaSore, daging, dll, keterangan, saldo: 0
                });
            }

            appData[key].sort((a, b) => a.day - b.day);

            let runningBalance = 0;
            appData[key].forEach((item) => {
                runningBalance += item.totalPenjualan + item.pesanan - item.totalPengeluaran;
                item.saldo = runningBalance;
            });

            localStorage.setItem('financialData', JSON.stringify(appData));

            showSuccessMessage(`✓ Data tanggal ${day} berhasil disimpan`);
            hidePreview();
            resetForm();
            loadDataTable();
            updateDashboard();
            updatePPNTable();
            updateRoyaltiTable();
        }

        function showSuccessMessage(message) {
            const banner = document.getElementById('successBanner');
            banner.textContent = message;
            banner.classList.add('show');
            setTimeout(() => banner.classList.remove('show'), 4000);
        }

        function resetForm() {
            document.getElementById('daySelect').value = 1;
            document.getElementById('totalPenjualan').value = '';
            document.getElementById('tunai').value = '';
            document.getElementById('qris').value = '';
            document.getElementById('edc').value = '';
            document.getElementById('transfer').value = '';
            document.getElementById('gojek').value = '';
            document.getElementById('grab').value = '';
            document.getElementById('pesanan').value = '';
            document.getElementById('belanjaPagi').value = '';
            document.getElementById('belanjaSore').value = '';
            document.getElementById('daging').value = '';
            document.getElementById('dll').value = '';
            document.getElementById('keterangan').value = '';
            currentEditDay = null;
            updateCalculations();
        }

        function editData(day) {
            const month = parseInt(document.getElementById('monthSelect').value);
            const year = parseInt(document.getElementById('yearSelect').value);
            const key = `${year}-${month}`;

            const item = appData[key]?.find(x => x.day === day);
            if (!item) return;

            document.getElementById('daySelect').value = item.day;
            document.getElementById('totalPenjualan').value = item.totalPenjualan;
            document.getElementById('tunai').value = item.tunai;
            document.getElementById('qris').value = item.qris;
            document.getElementById('edc').value = item.edc;
            document.getElementById('transfer').value = item.transfer;
            document.getElementById('gojek').value = item.gojek;
            document.getElementById('grab').value = item.grab;
            document.getElementById('pesanan').value = item.pesanan;
            document.getElementById('belanjaPagi').value = item.belanjaPagi;
            document.getElementById('belanjaSore').value = item.belanjaSore;
            document.getElementById('daging').value = item.daging;
            document.getElementById('dll').value = item.dll;
            document.getElementById('keterangan').value = item.keterangan;

            currentEditDay = day;
            updateUI();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            updateCalculations();
        }

        function deleteData(day) {
            if (!confirm(`Apakah Anda yakin ingin menghapus data tanggal ${day}?`)) return;

            const month = parseInt(document.getElementById('monthSelect').value);
            const year = parseInt(document.getElementById('yearSelect').value);
            const key = `${year}-${month}`;

            appData[key] = appData[key].filter(item => item.day !== day);
            localStorage.setItem('financialData', JSON.stringify(appData));

            showSuccessMessage(`✓ Data tanggal ${day} berhasil dihapus`);
            loadDataTable();
            updateDashboard();
            updatePPNTable();
            updateRoyaltiTable();
        }

        function loadDataTable() {
            const month = parseInt(document.getElementById('monthSelect').value);
            const year = parseInt(document.getElementById('yearSelect').value);
            const key = `${year}-${month}`;

            const data = appData[key] || [];
            const tbody = document.getElementById('dataTableBody');
            tbody.innerHTML = '';

            if (data.length === 0) {
                document.getElementById('dataSection').style.display = 'none';
                document.getElementById('dashboardSection').style.display = 'none';
                document.getElementById('ppnSection').style.display = 'none';
                document.getElementById('royaltiSection').style.display = 'none';
                document.getElementById('exportSection').style.display = 'none';
                document.getElementById('emptyState').style.display = 'block';
                return;
            }

            document.getElementById('dataSection').style.display = 'block';
            document.getElementById('dashboardSection').style.display = 'block';
            document.getElementById('ppnSection').style.display = 'block';
            document.getElementById('royaltiSection').style.display = 'block';
            document.getElementById('exportSection').style.display = 'block';
            document.getElementById('emptyState').style.display = 'none';

            data.forEach(item => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${item.day}</td>
                    <td class="currency">Rp ${item.totalPenjualan.toLocaleString('id-ID')}</td>
                    <td class="currency">Rp ${item.tunai.toLocaleString('id-ID')}</td>
                    <td class="currency">Rp ${item.totalPengeluaran.toLocaleString('id-ID')}</td>
                    <td class="currency"><strong>Rp ${item.saldo.toLocaleString('id-ID')}</strong></td>
                    <td>${item.keterangan || '-'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-primary" onclick="editData(${item.day})">Edit</button>
                            <button class="btn btn-danger" onclick="deleteData(${item.day})">Delete</button>
                        </div>
                    </td>
                `;
            });
        }

        function calculateMetrics() {
            const month = parseInt(document.getElementById('monthSelect').value);
            const year = parseInt(document.getElementById('yearSelect').value);
            const key = `${year}-${month}`;
            const data = appData[key] || [];

            if (data.length === 0) {
                return {
                    revenue: 0,
                    expense: 0,
                    profit: 0,
                    margin: 0,
                    daysWithData: 0
                };
            }

            const revenue = data.reduce((sum, item) => sum + item.totalPenjualan, 0);
            const expense = data.reduce((sum, item) => sum + item.totalPengeluaran, 0);
            const profit = data[data.length - 1].saldo || (revenue - expense);
            const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

            return {
                revenue,
                expense,
                profit,
                margin,
                daysWithData: data.length
            };
        }

        function updateDashboard() {
            const metrics = calculateMetrics();

            if (metrics.daysWithData === 0) {
                return;
            }

            document.getElementById('kpiRevenue').textContent = `Rp ${metrics.revenue.toLocaleString('id-ID')}`;
            document.getElementById('kpiExpense').textContent = `Rp ${metrics.expense.toLocaleString('id-ID')}`;
            document.getElementById('kpiProfit').textContent = `Rp ${metrics.profit.toLocaleString('id-ID')}`;
            document.getElementById('kpiMargin').textContent = `${metrics.margin.toFixed(1)}%`;

            const marginStatus = metrics.margin > 40 ? '✓ Excellent' : metrics.margin > 20 ? '✓ Good' : metrics.margin > 10 ? '⚠️ Caution' : '🔴 Low Margin!';
            document.getElementById('kpiMarginStatus').innerHTML = marginStatus;

            updateChart();
            updateTrendAlert(metrics);
        }

        function updateChart() {
            const month = parseInt(document.getElementById('monthSelect').value);
            const year = parseInt(document.getElementById('yearSelect').value);
            const monthName = months[month - 1];
            const key = `${year}-${month}`;
            const data = appData[key] || [];

            if (data.length === 0) return;

            const chartData = {
                labels: data.map(d => `Hari ${d.day}`),
                datasets: [
                    {
                        label: 'Revenue',
                        data: data.map(d => d.totalPenjualan),
                        borderColor: '#2196F3',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        type: 'bar',
                        yAxisID: 'y'
                    },
                    {
                        label: 'Expense',
                        data: data.map(d => d.totalPengeluaran),
                        borderColor: '#F44336',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        type: 'bar',
                        yAxisID: 'y'
                    },
                    {
                        label: 'Profit',
                        data: data.map(d => d.saldo),
                        borderColor: '#4CAF50',
                        backgroundColor: 'transparent',
                        borderWidth: 3,
                        type: 'line',
                        yAxisID: 'y1',
                        tension: 0.3,
                        pointRadius: 4,
                        pointBackgroundColor: '#4CAF50'
                    }
                ]
            };

            const ctx = document.getElementById('financialChart').getContext('2d');
            if (financialChart) {
                financialChart.destroy();
            }

            financialChart = new Chart(ctx, {
                type: 'bar',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Rupiah (Rp)',
                                font: { weight: 'bold' }
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Saldo (Rp)',
                                font: { weight: 'bold' }
                            },
                            grid: {
                                drawOnChartArea: false,
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                font: { size: 13, weight: 'bold' },
                                padding: 15
                            }
                        },
                        title: {
                            display: true,
                            text: `Monthly Financial Performance - ${monthName} ${year}`,
                            font: { size: 16, weight: 'bold' }
                        }
                    }
                }
            });
        }

        function updateTrendAlert(metrics) {
            const alertDiv = document.getElementById('trendAlert');
            const trendInfo = document.getElementById('trendInfo');

            if (metrics.margin < 10) {
                alertDiv.className = 'trend-alert';
                alertDiv.innerHTML = `⚠️ <strong>LOW PROFIT MARGIN!</strong> Margin hanya ${metrics.margin.toFixed(1)}% dari revenue. Cek expense control!`;
                alertDiv.style.display = 'block';
            } else if (metrics.margin < 20) {
                alertDiv.className = 'trend-alert';
                alertDiv.innerHTML = `⚠️ <strong>CAUTION:</strong> Margin ${metrics.margin.toFixed(1)}%. Monitor expense lebih ketat.`;
                alertDiv.style.display = 'block';
            } else {
                alertDiv.className = 'trend-alert success';
                alertDiv.innerHTML = `✓ <strong>HEALTHY:</strong> Margin ${metrics.margin.toFixed(1)}% - Profit sedang good performance!`;
                alertDiv.style.display = 'block';
            }

            const daysWithData = metrics.daysWithData;
            const daysInMonth = new Date(parseInt(document.getElementById('yearSelect').value), parseInt(document.getElementById('monthSelect').value), 0).getDate();
            const percentComplete = (daysWithData / daysInMonth * 100).toFixed(0);

            trendInfo.innerHTML = `<strong>📊 Trend Analysis:</strong><p style="margin-top: 10px;">Data Progress: ${daysWithData}/${daysInMonth} hari (${percentComplete}% complete) | Revenue: Rp ${metrics.revenue.toLocaleString('id-ID')} | Profit Margin: ${metrics.margin.toFixed(1)}%</p>`;
            trendInfo.style.display = 'block';
        }

        function updatePPNTable() {
            const month = parseInt(document.getElementById('monthSelect').value);
            const year = parseInt(document.getElementById('yearSelect').value);
            const key = `${year}-${month}`;
            const data = appData[key] || [];

            const tbody = document.getElementById('ppnTableBody');
            tbody.innerHTML = '';

            let totalPendapatan = 0;
            let totalPPN = 0;

            data.forEach(item => {
                const ppnAmount = item.totalPenjualan * (configSettings.ppnRate / 100);
                totalPendapatan += item.totalPenjualan;
                totalPPN += ppnAmount;

                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${item.day}</td>
                    <td class="currency">Rp ${item.totalPenjualan.toLocaleString('id-ID')}</td>
                    <td class="currency">Rp ${ppnAmount.toLocaleString('id-ID')}</td>
                `;
            });

            // Add JUMLAH row
            const jumlahRow = tbody.insertRow();
            jumlahRow.style.background = '#f0f4f7';
            jumlahRow.innerHTML = `
                <td style="font-weight: 700; color: #1a5f7a;">JUMLAH</td>
                <td class="currency" style="font-weight: 700; color: #1a5f7a;">Rp ${totalPendapatan.toLocaleString('id-ID')}</td>
                <td class="currency" style="font-weight: 700; color: #1a5f7a;">Rp ${totalPPN.toLocaleString('id-ID')}</td>
            `;

            document.getElementById('ppnRateDisplay').textContent = configSettings.ppnRate;
        }

        function updateRoyaltiTable() {
            const metrics = calculateMetrics();

            const royaltiAmount = metrics.revenue * (configSettings.royaltiRate / 100);
            const ppnOnRoyalti = royaltiAmount * (configSettings.ppnOnRoyaltiRate / 100);
            const totalRoyaltiPpn = royaltiAmount + ppnOnRoyalti;

            document.getElementById('totalPenjualanRoyalti').textContent = `Rp ${metrics.revenue.toLocaleString('id-ID')}`;
            document.getElementById('royaltiAmount').textContent = `Rp ${royaltiAmount.toLocaleString('id-ID')}`;
            document.getElementById('ppnOnRoyaltiAmount').textContent = `Rp ${ppnOnRoyalti.toLocaleString('id-ID')}`;
            document.getElementById('totalRoyaltiPpn').textContent = `Rp ${totalRoyaltiPpn.toLocaleString('id-ID')}`;

            document.getElementById('royaltiRateDisplay').textContent = configSettings.royaltiRate;
            document.getElementById('ppnOnRoyaltiDisplay').textContent = configSettings.ppnOnRoyaltiRate;
        }

        function exportGrafikDashboard() {
            const month = parseInt(document.getElementById('monthSelect').value);
            const year = parseInt(document.getElementById('yearSelect').value);
            const monthName = months[month - 1];
            const metrics = calculateMetrics();

            const wb = XLSX.utils.book_new();

            const dashboardData = [
                ['FINANCIAL DASHBOARD', '', '', ''],
                [monthName + ' ' + year, '', '', ''],
                ['', '', '', ''],
                ['KPI SUMMARY', '', '', ''],
                ['Metric', 'Value', 'Status', 'Notes'],
                ['Revenue', metrics.revenue, 'Data', 'Total Pemasukan'],
                ['Expense', metrics.expense, 'Data', 'Total Pengeluaran'],
                ['Net Profit', metrics.profit, 'Data', 'Hasil Bersih'],
                ['Profit Margin', metrics.margin.toFixed(2) + '%', metrics.margin > 40 ? 'Excellent' : 'Good', 'Efisiensi'],
                ['', '', '', ''],
            ];

            const ws1 = XLSX.utils.aoa_to_sheet(dashboardData);
            ws1['!cols'] = [{wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}];

            // Format currency
            Object.keys(ws1).forEach(cell => {
                if (cell.match(/^A[0-9]/)) return;
                if (cell === '!cols' || cell === '!rows') return;
                if (ws1[cell]?.v && typeof ws1[cell].v === 'number' && cell.match(/^B/)) {
                    ws1[cell].z = '#,##0';
                }
            });

            XLSX.utils.book_append_sheet(wb, ws1, "Dashboard");

            const fileName = `Laporan_Grafik_${monthName}_${year}.xlsx`;
            XLSX.writeFile(wb, fileName);
            showSuccessMessage(`✓ Grafik & Dashboard berhasil di-export!`);
        }

        function exportTabelData() {
            const month = parseInt(document.getElementById('monthSelect').value);
            const year = parseInt(document.getElementById('yearSelect').value);
            const monthName = months[month - 1];
            const key = `${year}-${month}`;
            const data = appData[key] || [];
            const daysInMonth = new Date(year, month, 0).getDate();

            if (data.length === 0) {
                alert('Tidak ada data untuk di-export');
                return;
            }

            const wb = XLSX.utils.book_new();

            const wsData = [
                ['LAPORAN KEUANGAN BULANAN'],
                [monthName + ' ' + year],
                [''],
                ['', 'TOTAL PENJUALAN', 'TUNAI', 'QRIS', 'EDC', 'TRANSFER', 'GOJEK', 'GRAB', 'PESANAN', 'TOTAL PENGELUARAN', 'BELANJA PAGI', 'BELANJA SORE', 'DAGING', 'DLL', 'KETERANGAN', 'SALDO']
            ];

            const dataStartRow = 5;
            const dataEndRow = 4 + data.length;

            data.forEach((item, index) => {
                const rowNum = dataStartRow + index;
                wsData.push([
                    item.day,
                    item.totalPenjualan,
                    item.tunai,
                    item.qris,
                    item.edc,
                    item.transfer,
                    item.gojek,
                    item.grab,
                    item.pesanan,
                    item.totalPengeluaran,
                    item.belanjaPagi,
                    item.belanjaSore,
                    item.daging,
                    item.dll,
                    item.keterangan,
                    item.saldo
                ]);
            });

            wsData.push(['TOTAL', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
            const totalRow = dataEndRow + 1;
            wsData.push(['TAX/SERVICE CHARGE (10%)', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
            const taxRow = totalRow + 1;
            wsData.push(['GRAND TOTAL', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            ws['!cols'] = Array(16).fill({wch: 16});

            // Format as currency (Rp)
            for (let i = dataStartRow; i <= dataEndRow + 2; i++) {
                for (let j = 1; j < 16; j++) {
                    const cellRef = XLSX.utils.encode_cell({r: i-1, c: j});
                    if (ws[cellRef]) {
                        ws[cellRef].z = '#,##0';
                    }
                }
            }

            XLSX.utils.book_append_sheet(wb, ws, "Data Harian");

            const fileName = `Laporan_${monthName}_${year}.xlsx`;
            XLSX.writeFile(wb, fileName);
            showSuccessMessage(`✓ Tabel Data berhasil di-export!`);
        }

        function exportPPNPDF() {
            const month = parseInt(document.getElementById('monthSelect').value);
            const year = parseInt(document.getElementById('yearSelect').value);
            const monthName = months[month - 1];
            const key = `${year}-${month}`;
            const data = appData[key] || [];

            if (data.length === 0) {
                alert('Tidak ada data untuk di-export');
                return;
            }

            try {
                // Create PDF with proper margins
                const jsPDF = window.jspdf.jsPDF;
                const doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const margin = 3;
                const contentWidth = pageWidth - (margin * 2);
                
                let yPosition = margin + 3;

                // Title 1 - Nama Bisnis
                doc.setFont('Arial', 'bold');
                doc.setFontSize(13);
                doc.text(configSettings.companyName, pageWidth / 2, yPosition, { align: 'center' });
                yPosition += 7;

                // Title 2 - Custom Title (PPN Report)
                doc.setFontSize(11);
                doc.text(configSettings.ppnTitle, pageWidth / 2, yPosition, { align: 'center' });
                yPosition += 6;

                // Subtitle - Month/Year
                doc.setFontSize(10);
                doc.setFont('Arial', 'normal');
                doc.text(`BULAN ${monthName.toUpperCase()} ${year}`, pageWidth / 2, yPosition, { align: 'center' });
                yPosition += 8;

                // Calculate table layout with smaller, more compact columns
                const tableWidth = 140;
                const tableStartX = (pageWidth - tableWidth) / 2;
                const col1Width = 35;   // TANGGAL
                const col2Width = 55;   // PENDAPATAN (Rp)
                const col3Width = 50;   // PPN (Rp)
                const rowHeight = 6.5;  // Compact row height

                // Table header
                doc.setDrawColor(0);
                doc.setLineWidth(0.4);
                doc.setFillColor(180, 180, 180);
                
                // Header row
                doc.rect(tableStartX, yPosition, col1Width, rowHeight, 'FD');
                doc.rect(tableStartX + col1Width, yPosition, col2Width, rowHeight, 'FD');
                doc.rect(tableStartX + col1Width + col2Width, yPosition, col3Width, rowHeight, 'FD');

                doc.setFont('Arial', 'bold');
                doc.setFontSize(8);
                doc.text('TANGGAL', tableStartX + (col1Width / 2), yPosition + 4.5, { align: 'center' });
                doc.text('PENDAPATAN (Rp)', tableStartX + col1Width + (col2Width / 2), yPosition + 4.5, { align: 'center' });
                doc.text('PPN (Rp)', tableStartX + col1Width + col2Width + (col3Width / 2), yPosition + 4.5, { align: 'center' });
                yPosition += rowHeight;

                // Table data rows
                doc.setFont('Arial', 'normal');
                doc.setFontSize(7.5);
                let totalPendapatan = 0;
                let totalPPN = 0;

                data.forEach(item => {
                    const ppnAmount = item.totalPenjualan * (configSettings.ppnRate / 100);
                    totalPendapatan += item.totalPenjualan;
                    totalPPN += ppnAmount;

                    // Draw row borders
                    doc.setLineWidth(0.3);
                    doc.rect(tableStartX, yPosition, col1Width, rowHeight);
                    doc.rect(tableStartX + col1Width, yPosition, col2Width, rowHeight);
                    doc.rect(tableStartX + col1Width + col2Width, yPosition, col3Width, rowHeight);

                    // Row data
                    doc.text(item.day.toString(), tableStartX + (col1Width / 2), yPosition + 4.5, { align: 'center' });
                    doc.text(item.totalPenjualan.toLocaleString('id-ID'), tableStartX + col1Width + col2Width - 2, yPosition + 4.5, { align: 'right' });
                    doc.text(ppnAmount.toLocaleString('id-ID'), tableStartX + col1Width + col2Width + col3Width - 2, yPosition + 4.5, { align: 'right' });

                    yPosition += rowHeight;
                });

                // Total row
                doc.setFont('Arial', 'bold');
                doc.setFillColor(200, 200, 200);
                doc.setLineWidth(0.4);
                doc.rect(tableStartX, yPosition, col1Width, rowHeight, 'FD');
                doc.rect(tableStartX + col1Width, yPosition, col2Width, rowHeight, 'FD');
                doc.rect(tableStartX + col1Width + col2Width, yPosition, col3Width, rowHeight, 'FD');

                doc.setFontSize(8);
                doc.text('JUMLAH', tableStartX + (col1Width / 2), yPosition + 4.5, { align: 'center' });
                doc.text(totalPendapatan.toLocaleString('id-ID'), tableStartX + col1Width + col2Width - 2, yPosition + 4.5, { align: 'right' });
                doc.text(totalPPN.toLocaleString('id-ID'), tableStartX + col1Width + col2Width + col3Width - 2, yPosition + 4.5, { align: 'right' });

                // Signature area - positioned dynamically AFTER table - RIGHT ALIGNED
                yPosition += rowHeight + 8;

                // Signature section - positioned to the RIGHT
                doc.setFont('Arial', 'normal');
                doc.setFontSize(9);
                const signatureRightMargin = margin + 10;
                
                doc.text(`${configSettings.location}, ${monthName.toUpperCase()} ${year}`, pageWidth - signatureRightMargin, yPosition, { align: 'right' });
                yPosition += 16;

                doc.text(configSettings.atasanName, pageWidth - signatureRightMargin, yPosition, { align: 'right' });

                // Save PDF
                const fileName = `PPN_Laporan_${monthName}_${year}.pdf`;
                doc.save(fileName);

                showSuccessMessage(`✓ PPN Laporan berhasil di-export ke PDF!`);
            } catch (error) {
                console.error('PDF Export Error:', error);
                alert('Error: ' + error.message);
            }
        }

        function exportRoyaltiPDF() {
            const month = parseInt(document.getElementById('monthSelect').value);
            const year = parseInt(document.getElementById('yearSelect').value);
            const monthName = months[month - 1];
            const metrics = calculateMetrics();

            const royaltiAmount = metrics.revenue * (configSettings.royaltiRate / 100);
            const ppnOnRoyalti = royaltiAmount * (configSettings.ppnOnRoyaltiRate / 100);
            const totalRoyaltiPpn = royaltiAmount + ppnOnRoyalti;

            try {
                // Create PDF with proper margins
                const jsPDF = window.jspdf.jsPDF;
                const doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const margin = 3;
                
                let yPosition = margin + 3;

                // Title 1 - Nama Bisnis
                doc.setFont('Arial', 'bold');
                doc.setFontSize(13);
                doc.text(configSettings.companyName, pageWidth / 2, yPosition, { align: 'center' });
                yPosition += 7;

                // Title 2 - Report Title
                doc.setFontSize(11);
                doc.text('ROYALTI & PPN BULANAN', pageWidth / 2, yPosition, { align: 'center' });
                yPosition += 6;

                // Subtitle - Month/Year
                doc.setFontSize(10);
                doc.setFont('Arial', 'normal');
                doc.text(`BULAN ${monthName.toUpperCase()} ${year}`, pageWidth / 2, yPosition, { align: 'center' });
                yPosition += 10;

                // Table with proper centering
                const tableWidth = 130;
                const tableStartX = (pageWidth - tableWidth) / 2;
                const labelWidth = 70;
                const valueWidth = 60;
                const rowHeight = 7;

                // Row 1: Total Penjualan
                doc.setFont('Arial', 'normal');
                doc.setFontSize(9);
                
                doc.setDrawColor(0);
                doc.setLineWidth(0.4);
                doc.rect(tableStartX, yPosition, labelWidth, rowHeight);
                doc.rect(tableStartX + labelWidth, yPosition, valueWidth, rowHeight);
                
                doc.text('TOTAL PENJUALAN', tableStartX + 2, yPosition + 4.5);
                doc.text(metrics.revenue.toLocaleString('id-ID'), tableStartX + labelWidth + valueWidth - 2, yPosition + 4.5, { align: 'right' });
                yPosition += rowHeight;

                // Row 2: Royalti
                doc.setFont('Arial', 'normal');
                doc.rect(tableStartX, yPosition, labelWidth, rowHeight);
                doc.rect(tableStartX + labelWidth, yPosition, valueWidth, rowHeight);
                
                doc.text(`ROYALTI ${configSettings.royaltiRate}%`, tableStartX + 2, yPosition + 4.5);
                doc.text(royaltiAmount.toLocaleString('id-ID'), tableStartX + labelWidth + valueWidth - 2, yPosition + 4.5, { align: 'right' });
                yPosition += rowHeight;

                // Row 3: PPN on Royalti
                doc.setFont('Arial', 'normal');
                doc.rect(tableStartX, yPosition, labelWidth, rowHeight);
                doc.rect(tableStartX + labelWidth, yPosition, valueWidth, rowHeight);
                
                doc.text(`PPN ${configSettings.ppnOnRoyaltiRate}%`, tableStartX + 2, yPosition + 4.5);
                doc.text(ppnOnRoyalti.toLocaleString('id-ID'), tableStartX + labelWidth + valueWidth - 2, yPosition + 4.5, { align: 'right' });
                yPosition += rowHeight;

                // Row 4: Total (bold highlight)
                doc.setFont('Arial', 'bold');
                doc.setFillColor(200, 200, 200);
                doc.setLineWidth(0.4);
                doc.rect(tableStartX, yPosition, labelWidth, rowHeight, 'FD');
                doc.rect(tableStartX + labelWidth, yPosition, valueWidth, rowHeight, 'FD');
                
                doc.setFontSize(9);
                doc.text('TOTAL ROYALTI & PPN', tableStartX + 2, yPosition + 4.5);
                doc.text(totalRoyaltiPpn.toLocaleString('id-ID'), tableStartX + labelWidth + valueWidth - 2, yPosition + 4.5, { align: 'right' });
                yPosition += rowHeight;

                // Note
                yPosition += 3;
                doc.setFont('Arial', 'italic');
                doc.setFontSize(8);
                doc.text('(Transfer ke Cakman Malang)', tableStartX, yPosition);

                // Signature area - positioned dynamically AFTER table - RIGHT ALIGNED
                yPosition += 12;

                doc.setFont('Arial', 'normal');
                doc.setFontSize(9);
                const signatureRightMargin = margin + 10;
                
                doc.text(`${configSettings.location}, ${monthName.toUpperCase()} ${year}`, pageWidth - signatureRightMargin, yPosition, { align: 'right' });
                yPosition += 16;

                doc.text(configSettings.atasanName, pageWidth - signatureRightMargin, yPosition, { align: 'right' });

                // Save PDF
                const fileName = `Royalti_PPN_${monthName}_${year}.pdf`;
                doc.save(fileName);

                showSuccessMessage(`✓ Royalti & PPN Laporan berhasil di-export ke PDF!`);
            } catch (error) {
                console.error('PDF Export Error:', error);
                alert('Error: ' + error.message);
            }
        }

        window.addEventListener('DOMContentLoaded', init);