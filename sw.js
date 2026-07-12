self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
    // 留空：此處為 Android PWA 離線安裝規範所需的最小必要攔截器
});
```
eof

```html:WealthFlow 豐記帳 - 馬卡龍粉藍 App 版:index.html
<!DOCTYPE html>
<html lang="zh-TW" class="h-full">
<head>
    <meta charset="UTF-8">
    <!-- 行動裝置滿版設定： viewport-fit=cover 確保延伸至螢幕邊緣 -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>WealthFlow 豐記帳 - 馬卡龍粉藍手機版</title>
    
    <!-- PWA 全螢幕關鍵設定 -->
    <link rel="manifest" href="manifest.json">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="mobile-web-app-capable" content="yes">

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        theme: {
                            blue: '#E0F2FE',     // 輕甜淺藍
                            darkblue: '#0284C7', // 海洋深藍
                            pink: '#FCE7F3',     // 櫻花柔粉
                            darkpink: '#DB2777', // 莓果深粉
                            white: '#FFFFFF',
                            slate: {
                                50: '#F8FAFC',
                                100: '#F1F5F9',
                                600: '#475569'
                            }
                        }
                    }
                }
            }
        }
    </script>
    <!-- FontAwesome 圖標庫 -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Chart.js 圖表庫 -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <!-- Google GIS (Google 認證服務) -->
    <script src="https://accounts.google.com/gsi/client" async defer></script>
    <style>
        /* 隱藏手機原生滾動條，讓 App 感覺更像原生 */
        ::-webkit-scrollbar {
            display: none;
        }
        body {
            -webkit-tap-highlight-color: transparent;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #F8FAFC;
            /* 針對全螢幕手機避開劉海與底線的安全區域 */
            padding-top: env(safe-area-inset-top, 0px);
            padding-bottom: env(safe-area-inset-bottom, 0px);
        }
    </style>
</head>
<body class="h-full flex justify-center items-start overflow-hidden">
    <!-- 行動裝置外殼：在桌面端呈現為手機樣式，在手機端滿版呈現 -->
    <div class="w-full max-w-md h-full bg-white flex flex-col relative overflow-hidden shadow-2xl border-x border-slate-100">
        
        <!-- App 頂部 Header -->
        <header class="bg-gradient-to-r from-theme-blue to-theme-pink p-4 pb-6 pt-6 flex justify-between items-center rounded-b-[2rem] shadow-sm shrink-0">
            <div class="flex items-center gap-2">
                <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
                    <span class="text-xl">👛</span>
                </div>
                <div>
                    <h1 class="text-lg font-black text-slate-800 tracking-wide">WealthFlow</h1>
                    <p class="text-[9px] font-bold text-slate-600 bg-white/50 px-1.5 py-0.5 rounded-full inline-block">豐記帳 App</p>
                </div>
            </div>
            
            <!-- 同步按鈕 -->
            <button onclick="openSyncModal()" class="flex items-center gap-1.5 bg-white text-theme-darkblue hover:bg-theme-blue transition-colors px-3 py-1.5 rounded-full text-xs font-bold shadow-md">
                <i class="fa-solid fa-cloud"></i>
                <span>同步</span>
            </button>
        </header>

        <!-- 主內容滾動區 -->
        <main class="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-24">
            
            <!-- 分頁 1: 儀表板 Dashboard (預設顯示) -->
            <section id="tab-dashboard" class="space-y-5">
                <!-- 總資產總覽卡片 -->
                <div class="bg-gradient-to-br from-theme-darkblue to-sky-500 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden">
                    <!-- 背景裝飾 -->
                    <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                    <p class="text-xs font-medium text-white/80">總資產淨值 (Net Worth)</p>
                    <h2 class="text-3xl font-black mt-1" id="dash-total-net">NT$ 0</h2>
                    
                    <div class="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-white/20 text-sm">
                        <div>
                            <span class="text-xs text-white/70 block">🏦 本月收入</span>
                            <span class="font-bold text-base" id="dash-month-income">NT$ 0</span>
                        </div>
                        <div>
                            <span class="text-xs text-white/70 block">💸 本月支出</span>
                            <span class="font-bold text-base" id="dash-month-expense">NT$ 0</span>
                        </div>
                    </div>
                </div>

                <!-- 預算進度卡片 -->
                <div class="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm space-y-2">
                    <div class="flex justify-between text-xs font-bold text-slate-500">
                        <span>本月預算花費上限</span>
                        <span id="budget-ratio-text">0%</span>
                    </div>
                    <div class="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
                        <div id="budget-progress-bar" class="bg-theme-darkblue h-full transition-all duration-500" style="width: 0%"></div>
                    </div>
                    <div class="flex justify-between text-xs">
                        <span class="text-slate-400">已花：<b id="budget-spent-txt">NT$ 0</b></span>
                        <span class="text-slate-500 font-bold" id="budget-total-txt">預算：NT$ 30,000</span>
                    </div>
                </div>

                <!-- 帳戶與信用卡速覽 -->
                <div class="space-y-3">
                    <h3 class="text-sm font-black text-slate-700 flex justify-between items-center">
                        <span>📱 即時資產看板</span>
                        <span class="text-[10px] text-slate-400 font-normal">資產將隨收支即時增減</span>
                    </h3>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-sky-50/50 border border-sky-100 p-3 rounded-2xl">
                            <span class="text-[10px] font-bold text-slate-400 block">存款總餘額</span>
                            <span class="text-base font-extrabold text-theme-darkblue" id="mini-bank-total">NT$ 0</span>
                        </div>
                        <div class="bg-pink-50/50 border border-pink-100 p-3 rounded-2xl">
                            <span class="text-[10px] font-bold text-slate-400 block">信用卡未繳</span>
                            <span class="text-base font-extrabold text-theme-darkpink" id="mini-credit-debt">NT$ 0</span>
                        </div>
                    </div>
                </div>

                <!-- 常用快捷操作 -->
                <div class="bg-slate-50 rounded-2xl p-3 flex justify-around items-center gap-1 border border-slate-100">
                    <button onclick="switchTab('tab-assets')" class="flex flex-col items-center gap-1 text-slate-600 hover:text-theme-darkblue transition-colors">
                        <span class="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-sm">🏦</span>
                        <span class="text-[10px] font-bold">調撥存款</span>
                    </button>
                    <button onclick="switchTab('tab-assets'); selectAssetSubTab('stocks')" class="flex flex-col items-center gap-1 text-slate-600 hover:text-theme-darkblue transition-colors">
                        <span class="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-sm">📈</span>
                        <span class="text-[10px] font-bold">投資看盤</span>
                    </button>
                    <button onclick="switchTab('tab-goals')" class="flex flex-col items-center gap-1 text-slate-600 hover:text-theme-darkblue transition-colors">
                        <span class="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-sm">🎯</span>
                        <span class="text-[10px] font-bold">目標規劃</span>
                    </button>
                    <button onclick="exportDataToCSV()" class="flex flex-col items-center gap-1 text-slate-600 hover:text-theme-darkblue transition-colors">
                        <span class="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-sm">📊</span>
                        <span class="text-[10px] font-bold">匯出 CSV</span>
                    </button>
                </div>
            </section>

            <!-- 分頁 2: 資產 Assets (包含 銀行存款 & 證券股票 子分頁) -->
            <section id="tab-assets" class="hidden space-y-5">
                <!-- 頂部馬卡龍雙軌切換開關 -->
                <div class="flex bg-slate-100 p-1 rounded-full border border-slate-200">
                    <button id="btn-sub-bank" onclick="selectAssetSubTab('bank')" class="flex-1 py-2 text-xs font-black rounded-full transition-all bg-white text-slate-800 shadow-sm">
                        🏦 銀行存款
                    </button>
                    <button id="btn-sub-stocks" onclick="selectAssetSubTab('stocks')" class="flex-1 py-2 text-xs font-black rounded-full transition-all text-slate-500 hover:text-slate-800">
                        📈 證券股票
                    </button>
                </div>

                <!-- 子分頁：銀行與信用卡 -->
                <div id="sub-asset-bank" class="space-y-5">
                    <!-- 存款帳戶管理區 -->
                    <div class="space-y-3">
                        <div class="flex justify-between items-center">
                            <h3 class="text-sm font-black text-slate-700">💰 存款帳戶清單</h3>
                            <button onclick="openBankModal()" class="text-xs bg-theme-blue text-theme-darkblue hover:bg-sky-200 transition-colors px-2.5 py-1 rounded-full font-bold">
                                + 新增帳戶
                            </button>
                        </div>
                        <div class="space-y-2" id="bank-list-container">
                            <!-- 動態渲染存款帳戶 -->
                        </div>
                    </div>

                    <!-- 信用卡管理區 -->
                    <div class="space-y-3 pt-2">
                        <div class="flex justify-between items-center">
                            <h3 class="text-sm font-black text-slate-700">💳 信用卡未繳卡費</h3>
                            <button onclick="openCreditModal()" class="text-xs bg-theme-pink text-theme-darkpink hover:bg-pink-200 transition-colors px-2.5 py-1 rounded-full font-bold">
                                + 新增卡片
                            </button>
                        </div>
                        <div class="space-y-3" id="credit-list-container">
                            <!-- 動態渲染信用卡卡片 -->
                        </div>
                    </div>
                </div>

                <!-- 子分頁：證券股票投資 -->
                <div id="sub-asset-stocks" class="hidden space-y-4">
                    <!-- 股票損益總覽卡片 -->
                    <div class="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-4 rounded-2xl shadow-md flex justify-between items-center">
                        <div>
                            <span class="text-[10px] text-emerald-100 font-bold block uppercase tracking-wider">證券資產市值</span>
                            <span class="text-2xl font-black" id="stock-total-value">NT$ 0</span>
                        </div>
                        <div class="text-right">
                            <span class="text-[10px] text-emerald-100 font-bold block uppercase tracking-wider">未實現損益</span>
                            <span class="text-base font-extrabold" id="stock-unrealized-profit">NT$ 0 (0.00%)</span>
                        </div>
                    </div>

                    <div class="flex justify-between items-center">
                        <h3 class="text-sm font-black text-slate-700">📊 持股清單明細</h3>
                        <div class="flex gap-1.5">
                            <button onclick="triggerStockSimulation()" class="text-[10px] bg-amber-50 text-amber-700 hover:bg-amber-100 px-2 py-1 rounded-full font-bold border border-amber-200">
                                <i class="fa-solid fa-rotate"></i> 模擬更新
                            </button>
                            <button onclick="openStockModal()" class="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
                                + 新增持股
                            </button>
                        </div>
                    </div>

                    <!-- 股票清單 -->
                    <div class="space-y-2.5" id="stock-list-container">
                        <!-- 動態渲染股票項目 -->
                    </div>

                    <p class="text-[9px] text-slate-400 text-center italic mt-2">
                        *提示：系統內置了虛擬股市即時行情模擬器，現價預設每過 15 秒會進行微幅隨機波動。
                    </p>
                </div>
            </section>

            <!-- 分頁 3: 目標與 AI 規劃 Goals & AI -->
            <section id="tab-goals" class="hidden space-y-5">
                <!-- 平均月收入設定 -->
                <div class="bg-gradient-to-r from-theme-blue/30 to-theme-pink/30 border border-theme-blue/80 rounded-2xl p-4 space-y-3 shadow-sm">
                    <h3 class="text-xs font-black text-slate-700 flex items-center gap-1">
                        <span>💵 月收入基礎設定</span>
                    </h3>
                    <div class="flex gap-2">
                        <div class="relative flex-1">
                            <span class="absolute left-3 top-2 text-xs font-bold text-slate-400">NT$</span>
                            <input type="number" id="user-monthly-income" value="50000" class="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-theme-darkblue">
                        </div>
                        <button onclick="triggerAiPlanning()" class="bg-gradient-to-r from-theme-darkblue to-theme-darkpink text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md hover:opacity-90 transition-opacity">
                            🤖 AI 智慧理財規劃
                        </button>
                    </div>
                </div>

                <!-- 儲蓄目標管理 -->
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <h3 class="text-sm font-black text-slate-700">🎯 理財儲蓄目標</h3>
                        <button onclick="openGoalModal()" class="text-xs bg-theme-pink text-theme-darkpink hover:bg-pink-100 transition-colors px-2.5 py-1 rounded-full font-bold">
                            + 新增目標
                        </button>
                    </div>
                    <div class="space-y-3.5" id="goal-list-container">
                        <!-- 動態渲染儲蓄目標 -->
                    </div>
                </div>

                <!-- AI 理財規劃成果呈現板 -->
                <div id="ai-planning-result-board" class="hidden bg-white border border-pink-100 rounded-3xl p-5 shadow-md space-y-4">
                    <div class="flex justify-between items-center border-b pb-2">
                        <h4 class="text-xs font-black text-theme-darkpink flex items-center gap-1.5">
                            <i class="fa-solid fa-robot"></i>
                            <span>AI 理財顧問專屬規劃</span>
                        </h4>
                        <span class="text-[9px] bg-pink-100 text-theme-darkpink font-extrabold px-1.5 py-0.5 rounded" id="ai-health-score">財務安全：- 分</span>
                    </div>

                    <!-- 安全額度看板 -->
                    <div class="bg-gradient-to-br from-pink-50 to-sky-50 p-3.5 rounded-2xl border border-pink-100 text-center">
                        <span class="text-[10px] text-slate-400 font-bold block">本月建議最高安全花費額度</span>
                        <h5 class="text-2xl font-black text-slate-800 mt-1" id="ai-safe-limit">NT$ -</h5>
                    </div>

                    <!-- AI 建議細項 -->
                    <div class="space-y-2">
                        <span class="text-[10px] text-slate-400 font-bold block">💡 專家理財攻略</span>
                        <div class="text-xs text-slate-600 space-y-2 leading-relaxed" id="ai-advice-list">
                            <!-- AI 回應清單 -->
                        </div>
                    </div>
                </div>
            </section>

            <!-- 分頁 4: 交易明細清單 Transactions -->
            <section id="tab-transactions" class="hidden space-y-4">
                <div class="flex justify-between items-center">
                    <h3 class="text-sm font-black text-slate-700">📝 記帳交易明細</h3>
                    <button onclick="switchTab('tab-dashboard')" class="text-xs text-slate-500 font-bold border border-slate-200 bg-white px-3 py-1 rounded-full shadow-sm hover:bg-slate-50">
                        返回總覽
                    </button>
                </div>

                <!-- 篩選器區塊 -->
                <div class="bg-slate-50 border border-slate-100 rounded-2xl p-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <label class="block text-[9px] text-slate-400 font-bold mb-1">月份篩選</label>
                        <input type="month" id="filter-month" onchange="renderTransactions()" class="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-[9px] text-slate-400 font-bold mb-1">收支類型</label>
                        <select id="filter-type" onchange="renderTransactions()" class="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none">
                            <option value="all">全部收支</option>
                            <option value="income">僅收入</option>
                            <option value="expense">僅支出</option>
                        </select>
                    </div>
                    <div class="col-span-2">
                        <label class="block text-[9px] text-slate-400 font-bold mb-1">關鍵字搜尋 (備註)</label>
                        <input type="text" id="filter-keyword" oninput="renderTransactions()" placeholder="請輸入備註關鍵字..." class="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none">
                    </div>
                </div>

                <!-- 明細列表 -->
                <div class="space-y-2" id="transaction-list-container">
                    <!-- 動態渲染明細項目 -->
                </div>
            </section>
        </main>

        <!-- App 底部導航欄 -->
        <nav class="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around items-center h-16 px-2 shadow-lg shrink-0 z-40">
            <!-- 儀表板 -->
            <button onclick="switchTab('tab-dashboard')" id="nav-tab-dashboard" class="flex-1 flex flex-col items-center justify-center gap-1 text-theme-darkblue font-bold">
                <i class="fa-solid fa-house text-lg"></i>
                <span class="text-[9px]">總覽</span>
            </button>
            
            <!-- 資產 -->
            <button onclick="switchTab('tab-assets')" id="nav-tab-assets" class="flex-1 flex flex-col items-center justify-center gap-1 text-slate-400 font-medium">
                <i class="fa-solid fa-wallet text-lg"></i>
                <span class="text-[9px]">資產</span>
            </button>

            <!-- 懸浮記帳按鈕 (FAB) - 啟動計算機 -->
            <div class="flex-1 flex justify-center -mt-6">
                <button onclick="openCalcModal()" class="w-14 h-14 bg-gradient-to-tr from-theme-darkblue to-cyan-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
                    <i class="fa-solid fa-plus text-xl"></i>
                </button>
            </div>

            <!-- 目標與 AI -->
            <button onclick="switchTab('tab-goals')" id="nav-tab-goals" class="flex-1 flex flex-col items-center justify-center gap-1 text-slate-400 font-medium">
                <i class="fa-solid fa-bullseye text-lg"></i>
                <span class="text-[9px]">目標/AI</span>
            </button>

            <!-- 明細 -->
            <button onclick="switchTab('tab-transactions')" id="nav-tab-transactions" class="flex-1 flex flex-col items-center justify-center gap-1 text-slate-400 font-medium">
                <i class="fa-solid fa-list-ul text-lg"></i>
                <span class="text-[9px]">明細</span>
            </button>
        </nav>

        <!-- 彈出視窗：計算機記帳 Numpad Panel (Modal) -->
        <div id="calc-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-end justify-center transition-opacity duration-300">
            <div class="bg-white w-full max-w-md rounded-t-[2.5rem] p-5 shadow-2xl space-y-4 max-h-[90%] overflow-y-auto">
                <div class="flex justify-between items-center border-b pb-2">
                    <span class="text-sm font-black text-slate-800">🧮 擬真計算機記帳</span>
                    <button onclick="closeCalcModal()" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark text-lg"></i></button>
                </div>

                <!-- 記帳大分類選擇按鈕 -->
                <div class="space-y-1.5">
                    <span class="text-[9px] text-slate-400 font-bold block">選擇消費分類</span>
                    <div class="grid grid-cols-4 gap-1.5 text-xs font-bold" id="calc-category-group">
                        <button onclick="selectCategory('food', '🍔 食物')" class="category-btn py-1.5 px-1 bg-theme-blue text-theme-darkblue border border-theme-darkblue/20 rounded-xl text-center">🍔 食物</button>
                        <button onclick="selectCategory('need', '🧼 必需品')" class="category-btn py-1.5 px-1 bg-slate-50 text-slate-600 border border-slate-100 rounded-xl text-center">🧼 必需品</button>
                        <button onclick="selectCategory('makeup', '💄 美妝保養')" class="category-btn py-1.5 px-1 bg-slate-50 text-slate-600 border border-slate-100 rounded-xl text-center">💄 美妝</button>
                        <button onclick="selectCategory('car', '🚗 車用')" class="category-btn py-1.5 px-1 bg-slate-50 text-slate-600 border border-slate-100 rounded-xl text-center">🚗 車用</button>
                        <button onclick="selectCategory('cloth', '👔 衣服')" class="category-btn py-1.5 px-1 bg-slate-50 text-slate-600 border border-slate-100 rounded-xl text-center">👔 衣服</button>
                        <button onclick="selectCategory('waste', '💸 亂買')" class="category-btn py-1.5 px-1 bg-slate-50 text-slate-600 border border-slate-100 rounded-xl text-center">💸 亂買</button>
                        <button onclick="selectCategory('other', '🏷️ 其他')" class="category-btn py-1.5 px-1 bg-slate-50 text-slate-600 border border-slate-100 rounded-xl text-center">🏷️ 其他</button>
                        <button onclick="selectCategory('income', '💰 收入')" class="category-btn py-1.5 px-1 bg-pink-50 text-theme-darkpink border border-pink-100 rounded-xl text-center">💰 收入</button>
                    </div>
                </div>

                <!-- 扣款/付款來源選擇 -->
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-[9px] text-slate-400 font-bold mb-1">付款方式 / 收儲帳戶</label>
                        <select id="calc-payment-type" onchange="updateCalcPaymentAccountOptions()" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 font-bold">
                            <option value="bank">🏦 存款帳戶扣款</option>
                            <option value="credit">💳 信用卡刷卡(欠款)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[9px] text-slate-400 font-bold mb-1">具體卡片 / 銀行選定</label>
                        <select id="calc-payment-account" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 font-bold">
                            <!-- 動態裝填 -->
                        </select>
                    </div>
                </div>

                <!-- 備註輸入 -->
                <div>
                    <input type="text" id="calc-note" placeholder="新增簡單備註（如：午餐、加油）..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-theme-darkblue">
                </div>

                <!-- 計算機顯示器 -->
                <div class="bg-slate-100 rounded-2xl p-3 flex flex-col items-end justify-center min-h-[50px]">
                    <span id="calc-history" class="text-[10px] text-slate-400 font-mono tracking-wider h-4"></span>
                    <span id="calc-display" class="text-2xl font-black text-slate-800 font-mono mt-1">0</span>
                </div>

                <!-- 計算機鍵盤 (Numpad) -->
                <div class="grid grid-cols-4 gap-2 font-mono">
                    <button onclick="pressCalcKey('7')" class="py-3 bg-slate-50 active:bg-slate-200 text-slate-800 font-black rounded-xl text-center shadow-sm">7</button>
                    <button onclick="pressCalcKey('8')" class="py-3 bg-slate-50 active:bg-slate-200 text-slate-800 font-black rounded-xl text-center shadow-sm">8</button>
                    <button onclick="pressCalcKey('9')" class="py-3 bg-slate-50 active:bg-slate-200 text-slate-800 font-black rounded-xl text-center shadow-sm">9</button>
                    <button onclick="pressCalcKey('/')" class="py-3 bg-theme-pink text-theme-darkpink font-black rounded-xl text-center shadow-sm">/</button>

                    <button onclick="pressCalcKey('4')" class="py-3 bg-slate-50 active:bg-slate-200 text-slate-800 font-black rounded-xl text-center shadow-sm">4</button>
                    <button onclick="pressCalcKey('5')" class="py-3 bg-slate-50 active:bg-slate-200 text-slate-800 font-black rounded-xl text-center shadow-sm">5</button>
                    <button onclick="pressCalcKey('6')" class="py-3 bg-slate-50 active:bg-slate-200 text-slate-800 font-black rounded-xl text-center shadow-sm">6</button>
                    <button onclick="pressCalcKey('*')" class="py-3 bg-theme-pink text-theme-darkpink font-black rounded-xl text-center shadow-sm">*</button>

                    <button onclick="pressCalcKey('1')" class="py-3 bg-slate-50 active:bg-slate-200 text-slate-800 font-black rounded-xl text-center shadow-sm">1</button>
                    <button onclick="pressCalcKey('2')" class="py-3 bg-slate-50 active:bg-slate-200 text-slate-800 font-black rounded-xl text-center shadow-sm">2</button>
                    <button onclick="pressCalcKey('3')" class="py-3 bg-slate-50 active:bg-slate-200 text-slate-800 font-black rounded-xl text-center shadow-sm">3</button>
                    <button onclick="pressCalcKey('-')" class="py-3 bg-theme-pink text-theme-darkpink font-black rounded-xl text-center shadow-sm">-</button>

                    <button onclick="pressCalcKey('0')" class="py-3 bg-slate-50 active:bg-slate-200 text-slate-800 font-black rounded-xl text-center shadow-sm">0</button>
                    <button onclick="pressCalcKey('C')" class="py-3 bg-amber-100 text-amber-700 font-black rounded-xl text-center shadow-sm">C</button>
                    <button onclick="pressCalcKey('=')" class="py-3 bg-theme-pink text-theme-darkpink font-black rounded-xl text-center shadow-sm">=</button>
                    <button onclick="pressCalcKey('+')" class="py-3 bg-theme-pink text-theme-darkpink font-black rounded-xl text-center shadow-sm">+</button>
                </div>

                <button onclick="submitCalculationRecord()" class="w-full bg-gradient-to-r from-theme-darkblue to-theme-darkpink text-white font-black py-3 rounded-2xl shadow-lg active:scale-95 transition-all text-sm tracking-widest text-center">
                    💾 確認送出並記一筆
                </button>
            </div>
        </div>

        <!-- 彈出視窗：Google 同步雲端設定 (Modal) -->
        <div id="sync-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div class="bg-white w-full max-w-sm rounded-[2rem] p-5 shadow-2xl space-y-4">
                <div class="flex justify-between items-center border-b pb-2">
                    <span class="text-sm font-black text-slate-800">☁️ Google 帳號雲端備份同步</span>
                    <button onclick="closeSyncModal()" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark text-lg"></i></button>
                </div>

                <div class="space-y-3.5 text-xs text-slate-600">
                    <!-- Client ID 輸入與說明 -->
                    <div class="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                        <label class="block text-[10px] text-slate-400 font-bold">1. 輸入您的 Google API Client ID</label>
                        <input type="text" id="g-client-id" placeholder="貼上在 Google Console 取得的 Client ID..." class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] text-slate-600 focus:outline-none focus:border-theme-darkblue">
                        
                        <!-- 解決 origin_mismatch 提示區 -->
                        <div class="p-2 bg-pink-50 rounded-lg border border-pink-100 text-[8.5px] text-slate-500 space-y-1">
                            <span class="font-extrabold text-theme-darkpink">💡 解決 400: origin_mismatch 錯誤：</span>
                            <p>請複製下方網址，貼進 Google Console 憑證的<b>「已授權的 JavaScript 來源」</b>中：</p>
                            <div class="flex items-center gap-1 mt-1">
                                <span id="g-origin-val" class="font-mono bg-white border px-1.5 py-0.5 rounded text-slate-600 select-all break-all">取得中...</span>
                            </div>
                        </div>

                        <p class="text-[8.5px] text-slate-400">
                            *首次設定需前往 Google Cloud 免費建立憑證。請參閱下方教學說明。
                        </p>
                    </div>

                    <!-- 操作按鈕 -->
                    <div class="space-y-2">
                        <button onclick="authenticateGoogleUser()" class="w-full bg-slate-800 text-white font-bold py-2 px-3 rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                            <i class="fa-brands fa-google"></i>
                            <span>連線並授權 Google 帳號</span>
                        </button>
                        
                        <div class="grid grid-cols-2 gap-2">
                            <button id="btn-cloud-upload" disabled onclick="uploadToCloud()" class="py-2 px-3 bg-theme-blue/50 text-slate-400 font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed">
                                <i class="fa-solid fa-cloud-arrow-up"></i>
                                <span>上傳備份</span>
                            </button>
                            <button id="btn-cloud-download" disabled onclick="downloadFromCloud()" class="py-2 px-3 bg-theme-blue/50 text-slate-400 font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed">
                                <i class="fa-solid fa-cloud-arrow-down"></i>
                                <span>下載還原</span>
                            </button>
                        </div>
                    </div>

                    <p class="text-[9px] text-slate-400 text-center">
                        上次同步時間：<span id="sync-last-time" class="font-mono font-bold">無紀錄</span>
                    </p>

                    <!-- 危險區域：清除本機資料 -->
                    <div class="border-t border-slate-100 pt-3 mt-3">
                        <span class="block text-[9px] text-rose-400 font-bold mb-1 uppercase tracking-wider">危險區域 (Danger Zone)</span>
                        <button id="btn-reset-data" onclick="triggerFactoryReset()" class="w-full py-1.5 px-3 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer">
                            <i class="fa-solid fa-trash-can"></i>
                            <span id="reset-btn-text">清除本機所有資料 (重設)</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 彈出視窗：新增/編輯 存款帳戶 -->
        <div id="bank-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div class="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
                <h4 class="text-sm font-black text-slate-800 border-b pb-2">🏦 存款帳戶管理</h4>
                <div class="space-y-3 text-xs">
                    <div>
                        <label class="block text-[10px] text-slate-400 font-bold mb-1">銀行或機構名稱</label>
                        <input type="text" id="bank-name" placeholder="例如：富邦銀行、台新數位戶" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-[10px] text-slate-400 font-bold mb-1">帳戶餘額 (NT$)</label>
                        <input type="number" id="bank-balance" placeholder="請輸入現有餘額" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-[10px] text-slate-400 font-bold mb-1">帳戶性質</label>
                        <select id="bank-type" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none">
                            <option value="savings">一般活存戶 (可用於計算機扣款、繳信用卡)</option>
                            <option value="fixed">定期定額/定存戶 (僅計入資產，不可記帳扣款)</option>
                        </select>
                    </div>
                </div>
                <div class="flex gap-2 pt-2">
                    <button onclick="closeBankModal()" class="flex-1 py-2 bg-slate-100 text-slate-500 font-bold rounded-xl text-xs text-center">取消</button>
                    <button onclick="saveBankObject()" class="flex-1 py-2 bg-theme-darkblue text-white font-bold rounded-xl text-xs text-center">儲存帳戶</button>
                </div>
            </div>
        </div>

        <!-- 彈出視窗：新增/編輯 信用卡卡片 -->
        <div id="credit-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div class="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3.5">
                <h4 class="text-sm font-black text-slate-800 border-b pb-2">💳 信用卡卡片設定</h4>
                <div class="space-y-2.5 text-xs">
                    <div>
                        <label class="block text-[10px] text-slate-400 font-bold mb-0.5">信用卡名稱 / 銀行</label>
                        <input type="text" id="credit-name" placeholder="例如：國泰 KOKO、中信 LINE Pay" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none">
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-[10px] text-slate-400 font-bold mb-0.5">信用額度 (NT$)</label>
                            <input type="number" id="credit-limit" placeholder="額度" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-[10px] text-slate-400 font-bold mb-0.5">目前已消費欠款</label>
                            <input type="number" id="credit-debt" placeholder="未結帳金額" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-[10px] text-slate-400 font-bold mb-0.5">應繳費截止日</label>
                            <input type="date" id="credit-due-date" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-[10px] text-slate-400 font-bold mb-0.5">最低應繳金額 (NT$)</label>
                            <input type="number" id="credit-min-due" placeholder="最低繳納額" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none">
                        </div>
                    </div>
                    <!-- 繳卡費對應之虛擬付款資訊 -->
                    <div class="p-2 bg-pink-50/50 rounded-xl border border-pink-100 space-y-2">
                        <span class="block text-[9px] text-theme-darkpink font-extrabold">🏦 設定一鍵轉帳繳款代碼</span>
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block text-[8px] text-slate-400 font-bold mb-0.5">銀行代碼 (如812)</label>
                                <input type="text" id="credit-bank-code" placeholder="如 822" class="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-[8px] text-slate-400 font-bold mb-0.5">虛擬繳費帳號</label>
                                <input type="text" id="credit-transfer-account" placeholder="轉帳卡號..." class="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex gap-2 pt-1">
                    <button onclick="closeCreditModal()" class="flex-1 py-2 bg-slate-100 text-slate-500 font-bold rounded-xl text-xs text-center">取消</button>
                    <button onclick="saveCreditCardObject()" class="flex-1 py-2 bg-theme-darkblue text-white font-bold rounded-xl text-xs text-center">儲存卡片</button>
                </div>
            </div>
        </div>

        <!-- 彈出視窗：新增/編輯 股票持股 -->
        <div id="stock-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div class="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
                <h4 class="text-sm font-black text-slate-800 border-b pb-2">📈 證券持股設定</h4>
                <div class="space-y-3 text-xs">
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-[10px] text-slate-400 font-bold mb-1">股票代號/代碼</label>
                            <input type="text" id="stock-symbol" placeholder="例如：2330、AAPL" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-[10px] text-slate-400 font-bold mb-1">股票名稱</label>
                            <input type="text" id="stock-name" placeholder="例如：台積電、蘋果" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-[10px] text-slate-400 font-bold mb-1">買入成本價 (NT$/$)</label>
                            <input type="number" id="stock-buy-price" step="0.01" placeholder="買入每股均價" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-[10px] text-slate-400 font-bold mb-1">買入股數</label>
                            <input type="number" id="stock-shares" placeholder="持股數量" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none">
                        </div>
                    </div>
                    <div>
                        <label class="block text-[10px] text-slate-400 font-bold mb-1">當前市場現價 (NT$/$)</label>
                        <input type="number" id="stock-current-price" step="0.01" placeholder="今日市價(後續會自動跳動)" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none">
                    </div>
                </div>
                <div class="flex gap-2 pt-2">
                    <button onclick="closeStockModal()" class="flex-1 py-2 bg-slate-100 text-slate-500 font-bold rounded-xl text-xs text-center">取消</button>
                    <button onclick="saveStockObject()" class="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs text-center">確認新增</button>
                </div>
            </div>
        </div>

        <!-- 彈出視窗：新增/編輯 儲蓄目標 -->
        <div id="goal-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div class="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
                <h4 class="text-sm font-black text-slate-800 border-b pb-2">🎯 理財儲蓄目標管理</h4>
                <div class="space-y-3 text-xs">
                    <div>
                        <label class="block text-[10px] text-slate-400 font-bold mb-1">儲蓄夢想目標</label>
                        <input type="text" id="goal-title" placeholder="例如：買房頭期款、日本旅遊" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none">
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-[10px] text-slate-400 font-bold mb-1">目標所需金額 (NT$)</label>
                            <input type="number" id="goal-target" placeholder="所需總額" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-[10px] text-slate-400 font-bold mb-1">目前已存金額 (NT$)</label>
                            <input type="number" id="goal-current" placeholder="現有水位" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none">
                        </div>
                    </div>
                    <div>
                        <label class="block text-[10px] text-slate-400 font-bold mb-1">預計達成日期</label>
                        <input type="date" id="goal-deadline" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none">
                    </div>
                </div>
                <div class="flex gap-2 pt-2">
                    <button onclick="closeGoalModal()" class="flex-1 py-2 bg-slate-100 text-slate-500 font-bold rounded-xl text-xs text-center">取消</button>
                    <button onclick="saveGoalObject()" class="flex-1 py-2 bg-theme-darkpink text-white font-bold rounded-xl text-xs text-center">建立目標</button>
                </div>
            </div>
        </div>

        <!-- 訊息通知小吐司 Toast Notification Container -->
        <div id="toast" class="hidden fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[11px] font-bold px-4 py-2.5 rounded-full shadow-lg z-50 text-center tracking-wide whitespace-nowrap"></div>

    </div>

    <!-- JavaScript 核心功能邏輯 -->
    <script>
        // 1. 初始化資料庫 (LocalStorage)
        const db = {
            get: (key, defaultValue) => {
                const data = localStorage.getItem('wf_app_' + key);
                return data ? JSON.parse(data) : defaultValue;
            },
            set: (key, value) => {
                localStorage.setItem('wf_app_' + key, JSON.stringify(value));
            }
        };

        // 全域狀態管理 (預設完全乾淨無任何示範數據，等待使用者自行建立)
        let state = {
            banks: [],
            credits: [],
            stocks: [],
            goals: [],
            transactions: [],
            monthlyIncome: 50000,
            activeTab: 'tab-dashboard',
            activeAssetSubTab: 'bank',
            calc: {
                display: '0',
                history: '',
                category: 'food',
                categoryLabel: '🍔 食物',
                hasCalculated: false
            },
            googleToken: null,
            editingItem: null // 正在編輯的物件
        };

        // 啟動載入
        window.onload = function() {
            state.banks = db.get('banks', []);
            state.credits = db.get('credits', []);
            state.stocks = db.get('stocks', []);
            state.goals = db.get('goals', []);
            state.transactions = db.get('transactions', []);
            state.monthlyIncome = db.get('monthlyIncome', 50000);

            // 寫入畫面
            document.getElementById('user-monthly-income').value = state.monthlyIncome;
            
            // 初始化動態顯示
            updateAllViews();
            switchTab('tab-dashboard');

            // 自動定時模擬股市
            setInterval(autoMarketTick, 15000);

            // 🌟 註冊 PWA Service Worker 確保 Android Chrome 完美啟動全螢幕 WebAPK 模式
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('sw.js')
                    .then(() => console.log('Service Worker Registered Successfully'))
                    .catch(err => console.log('Service Worker Registration Failed', err));
            }
        };

        // 彈出通知小吐司
        function showToast(message) {
            const toast = document.getElementById('toast');
            toast.innerText = message;
            toast.classList.remove('hidden');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 2500);
        }

        // 切換主頁籤 Tab
        function switchTab(tabId) {
            const tabs = ['tab-dashboard', 'tab-assets', 'tab-goals', 'tab-transactions'];
            tabs.forEach(id => {
                document.getElementById(id).classList.add('hidden');
                // 恢復導航欄按鈕顏色
                const navBtn = document.getElementById('nav-' + id);
                navBtn.classList.remove('text-theme-darkblue', 'font-bold');
                navBtn.classList.add('text-slate-400', 'font-medium');
            });

            document.getElementById(tabId).classList.remove('hidden');
            const activeNavBtn = document.getElementById('nav-' + tabId);
            activeNavBtn.classList.add('text-theme-darkblue', 'font-bold');
            activeNavBtn.classList.remove('text-slate-400', 'font-medium');

            state.activeTab = tabId;
            updateAllViews();
        }

        // 切換資產下的子頁籤 (銀行/股票)
        function selectAssetSubTab(subType) {
            state.activeAssetSubTab = subType;
            const btnBank = document.getElementById('btn-sub-bank');
            const btnStocks = document.getElementById('btn-sub-stocks');
            const secBank = document.getElementById('sub-asset-bank');
            const secStocks = document.getElementById('sub-asset-stocks');

            if (subType === 'bank') {
                btnBank.className = "flex-1 py-2 text-xs font-black rounded-full transition-all bg-white text-slate-800 shadow-sm";
                btnStocks.className = "flex-1 py-2 text-xs font-black rounded-full transition-all text-slate-500 hover:text-slate-800";
                secBank.classList.remove('hidden');
                secStocks.classList.add('hidden');
            } else {
                btnStocks.className = "flex-1 py-2 text-xs font-black rounded-full transition-all bg-white text-slate-800 shadow-sm";
                btnBank.className = "flex-1 py-2 text-xs font-black rounded-full transition-all text-slate-500 hover:text-slate-800";
                secStocks.classList.remove('hidden');
                secBank.classList.add('hidden');
            }
        }

        // 計算並刷新所有數據與卡片呈現
        function updateAllViews() {
            // 存款總和
            const totalSavings = state.banks.reduce((acc, b) => acc + Number(b.balance), 0);
            document.getElementById('mini-bank-total').innerText = 'NT$ ' + totalSavings.toLocaleString();

            // 信用卡未繳總和
            const totalCreditDebt = state.credits.reduce((acc, c) => acc + Number(c.debt), 0);
            document.getElementById('mini-credit-debt').innerText = 'NT$ ' + totalCreditDebt.toLocaleString();

            // 股票總和
            const totalStockValue = state.stocks.reduce((acc, s) => acc + (Number(s.shares) * Number(s.currentPrice)), 0);
            document.getElementById('stock-total-value').innerText = 'NT$ ' + totalStockValue.toLocaleString();

            // 股票總損益
            const totalStockCost = state.stocks.reduce((acc, s) => acc + (Number(s.shares) * Number(s.buyPrice)), 0);
            const totalStockProfit = totalStockValue - totalStockCost;
            const stockProfitRatio = totalStockCost > 0 ? (totalStockProfit / totalStockCost * 100).toFixed(2) : '0.00';
            const profitTxt = document.getElementById('stock-unrealized-profit');
            if (totalStockProfit >= 0) {
                profitTxt.innerText = `▲ NT$ ${totalStockProfit.toLocaleString()} (+${stockProfitRatio}%)`;
                profitTxt.className = "text-base font-extrabold text-emerald-100";
            } else {
                profitTxt.innerText = `▼ NT$ ${Math.abs(totalStockProfit).toLocaleString()} (${stockProfitRatio}%)`;
                profitTxt.className = "text-base font-extrabold text-rose-200";
            }

            // 總資產淨值
            const netWorth = totalSavings + totalStockValue - totalCreditDebt;
            document.getElementById('dash-total-net').innerText = 'NT$ ' + netWorth.toLocaleString();

            // 本月收入與支出明細計算 (依據 current date 篩選本月)
            const today = new Date();
            const thisYearMonth = today.toISOString().substring(0, 7); // "2026-07"
            
            let monthIncome = 0;
            let monthExpense = 0;
            state.transactions.forEach(t => {
                if (t.date && t.date.substring(0, 7) === thisYearMonth) {
                    if (t.type === 'income') monthIncome += Number(t.amount);
                    if (t.type === 'expense') monthExpense += Number(t.amount);
                }
            });

            document.getElementById('dash-month-income').innerText = 'NT$ ' + monthIncome.toLocaleString();
            document.getElementById('dash-month-expense').innerText = 'NT$ ' + monthExpense.toLocaleString();

            // 預算上限設定：預設每月 30,000 元
            const budgetMax = 30000;
            const spentRatio = Math.min((monthExpense / budgetMax) * 100, 100);
            document.getElementById('budget-ratio-text').innerText = spentRatio.toFixed(0) + '%';
            document.getElementById('budget-spent-txt').innerText = 'NT$ ' + monthExpense.toLocaleString();
            document.getElementById('budget-progress-bar').style.width = spentRatio + '%';
            if (spentRatio >= 100) {
                document.getElementById('budget-progress-bar').className = "bg-theme-darkpink h-full transition-all duration-500";
            } else if (spentRatio >= 80) {
                document.getElementById('budget-progress-bar').className = "bg-amber-400 h-full transition-all duration-500";
            } else {
                document.getElementById('budget-progress-bar').className = "bg-theme-darkblue h-full transition-all duration-500";
            }

            // 渲染各板塊列表
            renderBankList();
            renderCreditList();
            renderStockList();
            renderGoalList();
            renderTransactions();
        }

        // 渲染 存款帳戶
        function renderBankList() {
            const container = document.getElementById('bank-list-container');
            container.innerHTML = '';
            
            if (state.banks.length === 0) {
                container.innerHTML = `<p class="text-xs text-slate-400 text-center py-4 italic">目前無存款帳戶，點選上方按鈕新增 🏦</p>`;
                return;
            }

            state.banks.forEach(b => {
                const isSavings = b.type === 'savings';
                const div = document.createElement('div');
                div.className = "p-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex justify-between items-center";
                div.innerHTML = `
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-full bg-theme-blue/30 flex items-center justify-center text-sm">
                            ${isSavings ? '活' : '定'}
                        </div>
                        <div>
                            <p class="font-bold text-xs text-slate-700">${b.name}</p>
                            <span class="text-[9px] text-slate-400">${isSavings ? '可用於支付、繳費' : '定期存款（已鎖定）'}</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-black text-xs text-slate-800">NT$ ${Number(b.balance).toLocaleString()}</p>
                        <div class="flex gap-1.5 justify-end mt-1">
                            <button onclick="editBankObject('${b.id}')" class="text-[8px] text-theme-darkblue font-extrabold hover:underline">編輯</button>
                            <button onclick="deleteBankObject('${b.id}')" class="text-[8px] text-theme-darkpink font-extrabold hover:underline">刪除</button>
                        </div>
                    </div>
                `;
                container.appendChild(div);
            });
        }

        // 渲染 信用卡卡片 (帶有一鍵複製與一鍵繳費)
        function renderCreditList() {
            const container = document.getElementById('credit-list-container');
            container.innerHTML = '';

            if (state.credits.length === 0) {
                container.innerHTML = `<p class="text-xs text-slate-400 text-center py-4 italic">目前無信用卡，點選上方按鈕新增 💳</p>`;
                return;
            }

            state.credits.forEach(c => {
                const usedPercent = Math.min((Number(c.debt) / Number(c.limit)) * 100, 100);
                const hasCode = c.bankCode && c.transferAccount;
                
                const div = document.createElement('div');
                div.className = "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-4 shadow-lg space-y-3 relative overflow-hidden";
                div.innerHTML = `
                    <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-xs font-black tracking-wide">${c.name}</p>
                            <span class="text-[8px] text-slate-400">額度 NT$ ${Number(c.limit).toLocaleString()}</span>
                        </div>
                        <span class="text-[10px] font-mono text-slate-300">DUE: ${c.dueDate || '未定'}</span>
                    </div>

                    <div>
                        <span class="text-[8px] text-slate-400 block">目前累積欠款 (已刷金額)</span>
                        <div class="flex justify-between items-baseline">
                            <h4 class="text-lg font-black text-theme-pink">NT$ ${Number(c.debt).toLocaleString()}</h4>
                            <span class="text-[8px] text-slate-300">最低應繳: NT$ ${Number(c.minDue).toLocaleString()}</span>
                        </div>
                        <!-- 進度條 -->
                        <div class="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1.5">
                            <div class="bg-gradient-to-r from-theme-pink to-theme-darkpink h-full" style="width: ${usedPercent}%"></div>
                        </div>
                    </div>

                    <div class="flex justify-between items-center pt-2 border-t border-white/10">
                        <!-- 繳費帳號複製按鈕 -->
                        ${hasCode ? `
                            <button onclick="copyTransferInfo('${c.id}')" class="bg-white/10 hover:bg-white/20 transition-colors text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 text-slate-200">
                                <i class="fa-solid fa-copy"></i>
                                <span>複製轉帳繳款碼</span>
                            </button>
                        ` : `
                            <span class="text-[8.5px] text-slate-500">未設定繳費代碼</span>
                        `}

                        <div class="flex gap-2">
                            <button onclick="editCreditCardObject('${c.id}')" class="text-[9px] text-slate-300 font-extrabold hover:underline">設定</button>
                            <button onclick="quickPayCardDebt('${c.id}')" class="bg-gradient-to-r from-theme-pink to-theme-darkpink text-white font-black text-[9px] px-2.5 py-1 rounded-full hover:opacity-90 active:scale-95 transition-all">
                                💳 快速還卡費
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(div);
            });
        }

        // 一鍵複製轉帳碼 (採用 clipboard 複製與 fallback 方案)
        function copyTransferInfo(cardId) {
            const card = state.credits.find(c => c.id === cardId);
            if (!card) return;

            const textToCopy = `【WealthFlow 信用卡繳費轉帳資訊】\n轉帳銀行代碼：${card.bankCode}\n虛擬繳款帳號：${card.transferAccount}\n建議繳款金額：NT$ ${Number(card.debt).toLocaleString()}`;
            
            // 雙保險複製到剪貼簿，相容 iframe 環境
            const tempTextarea = document.createElement("textarea");
            tempTextarea.value = textToCopy;
            document.body.appendChild(tempTextarea);
            tempTextarea.select();
            try {
                document.execCommand('copy');
                showToast('📋 轉帳資訊已完美複製至剪貼簿！');
            } catch (err) {
                showToast('複製失敗，請手動複製。');
            }
            document.body.removeChild(tempTextarea);
        }

        // 一鍵繳信用卡費 (直接扣存款活期帳戶，歸零欠款)
        function quickPayCardDebt(cardId) {
            const card = state.credits.find(c => c.id === cardId);
            if (!card) return;

            if (Number(card.debt) <= 0) {
                showToast('該卡片目前無欠款，無需繳納！');
                return;
            }

            // 尋找活期存款帳戶
            const activeSavings = state.banks.filter(b => b.type === 'savings');
            if (activeSavings.length === 0) {
                showToast('❌ 請先新增至少一個活期存款帳戶！');
                return;
            }

            // 選用第一個活存帳戶
            const payBank = activeSavings[0];
            const payAmount = Number(card.debt);

            if (Number(payBank.balance) < payAmount) {
                showToast(`存款帳戶 [${payBank.name}] 餘額不足以支付 NT$ ${payAmount.toLocaleString()}`);
                return;
            }

            // 扣除銀行存款，清空卡費欠款
            payBank.balance = Number(payBank.balance) - payAmount;
            card.debt = 0;

            // 寫入明細
            const tId = 't_' + Date.now();
            const dateStr = new Date().toISOString().substring(0, 10);
            state.transactions.unshift({
                id: tId,
                date: dateStr,
                type: 'expense',
                category: 'other',
                categoryLabel: '💳 還卡費',
                amount: payAmount,
                paymentType: 'bank',
                accountId: payBank.id,
                accountName: payBank.name,
                note: `繳還 [${card.name}] 信用卡款`
            });

            // 儲存並刷新
            db.set('banks', state.banks);
            db.set('credits', state.credits);
            db.set('transactions', state.transactions);
            
            showToast(`💳 已從 [${payBank.name}] 自動轉帳支付 NT$ ${payAmount.toLocaleString()} 還卡費成功！`);
            updateAllViews();
        }

        // 渲染 證券股票持股
        function renderStockList() {
            const container = document.getElementById('stock-list-container');
            container.innerHTML = '';

            if (state.stocks.length === 0) {
                container.innerHTML = `<p class="text-xs text-slate-400 text-center py-4 italic">目前無持股，點選上方按鈕新增 📈</p>`;
                return;
            }

            state.stocks.forEach(s => {
                const totalCost = Number(s.shares) * Number(s.buyPrice);
                const totalVal = Number(s.shares) * Number(s.currentPrice);
                const profit = totalVal - totalCost;
                const profitRatio = totalCost > 0 ? (profit / totalCost * 100).toFixed(2) : '0.00';
                
                const isProfit = profit >= 0;

                const div = document.createElement('div');
                div.className = "p-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex justify-between items-center";
                div.innerHTML = `
                    <div>
                        <div class="flex items-center gap-1.5">
                            <span class="text-xs font-black text-slate-800">${s.name}</span>
                            <span class="text-[9px] font-mono bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-bold">${s.symbol}</span>
                        </div>
                        <p class="text-[9px] text-slate-400 mt-0.5">${Number(s.shares).toLocaleString()} 股 | 買入均價 $${Number(s.buyPrice).toLocaleString()}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-black text-xs text-slate-800">$${Number(s.currentPrice).toLocaleString()}</p>
                        <span class="text-[9px] font-bold ${isProfit ? 'text-emerald-600' : 'text-rose-600'}">
                            ${isProfit ? '▲' : '▼'} ${Number(profit).toFixed(0)} (${isProfit ? '+' : ''}${profitRatio}%)
                        </span>
                        <div class="flex gap-1.5 justify-end mt-0.5">
                            <button onclick="editStockObject('${s.id}')" class="text-[8px] text-slate-400 hover:underline">編輯</button>
                            <button onclick="deleteStockObject('${s.id}')" class="text-[8px] text-rose-400 hover:underline">刪除</button>
                        </div>
                    </div>
                `;
                container.appendChild(div);
            });
        }

        // 股票現價隨機模擬波動 (模擬股市交易行情，跳動現價)
        function autoMarketTick() {
            if (state.stocks.length === 0) return;
            state.stocks.forEach(s => {
                const vol = (Math.random() - 0.49) * 0.015; // 隨機正負 1.5% 內
                const newPrice = Number(s.currentPrice) * (1 + vol);
                s.currentPrice = parseFloat(newPrice.toFixed(2));
            });
            db.set('stocks', state.stocks);
            if (state.activeTab === 'tab-assets' && state.activeAssetSubTab === 'stocks') {
                updateAllViews();
            }
        }

        // 手動模擬股票更新
        function triggerStockSimulation() {
            autoMarketTick();
            showToast('📈 市場現價模擬行情已立即刷新！');
            updateAllViews();
        }

        // 渲染 理財儲蓄目標
        function renderGoalList() {
            const container = document.getElementById('goal-list-container');
            container.innerHTML = '';

            if (state.goals.length === 0) {
                container.innerHTML = `<p class="text-xs text-slate-400 text-center py-4 italic">目前無建立目標，點選上方按鈕新增 🎯</p>`;
                return;
            }

            state.goals.forEach(g => {
                const progressRatio = Math.min((Number(g.current) / Number(g.target)) * 100, 100);
                
                // 計算每月建議儲蓄提撥額度
                const monthsLeft = getRemainingMonths(g.deadline);
                const suggestedMonthlySave = monthsLeft > 0 ? Math.max((Number(g.target) - Number(g.current)) / monthsLeft, 0) : (Number(g.target) - Number(g.current));

                const div = document.createElement('div');
                div.className = "bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3";
                div.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="text-xs font-black text-slate-700">${g.title}</h4>
                            <span class="text-[9px] text-slate-400">截止日期：${g.deadline || '未定'} (剩餘 ${monthsLeft} 個月)</span>
                        </div>
                        <span class="text-xs font-black text-theme-darkpink">${progressRatio.toFixed(0)}%</span>
                    </div>

                    <!-- 雙色進度條 -->
                    <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div class="bg-gradient-to-r from-theme-pink to-theme-darkpink h-full" style="width: ${progressRatio}%"></div>
                    </div>

                    <div class="flex justify-between items-center text-[9px] text-slate-500 pt-1">
                        <span>目前水位: NT$ ${Number(g.current).toLocaleString()} / ${Number(g.target).toLocaleString()}</span>
                        <span class="bg-theme-pink/60 text-theme-darkpink font-extrabold px-1.5 py-0.5 rounded">
                            🎯 建議月存：NT$ ${Math.round(suggestedMonthlySave).toLocaleString()}
                        </span>
                    </div>

                    <div class="flex justify-end gap-2.5 border-t pt-2 border-slate-100">
                        <button onclick="editGoalObject('${g.id}')" class="text-[8px] text-slate-400 hover:underline">編輯進度</button>
                        <button onclick="deleteGoalObject('${g.id}')" class="text-[8px] text-rose-400 hover:underline">刪除目標</button>
                    </div>
                `;
                container.appendChild(div);
            });
        }

        // 日期計算剩餘月數輔助函數
        function getRemainingMonths(deadlineStr) {
            if (!deadlineStr) return 12;
            const today = new Date();
            const dl = new Date(deadlineStr);
            const yearsDiff = dl.getFullYear() - today.getFullYear();
            const monthsDiff = dl.getMonth() - today.getMonth();
            const total = (yearsDiff * 12) + monthsDiff;
            return total <= 0 ? 1 : total;
        }

        // 🤖 AI 智慧理財規劃 (Gemini 3.1 Flash LLM 串接)
        async function triggerAiPlanning() {
            // 讀取月收入
            const incVal = document.getElementById('user-monthly-income').value;
            state.monthlyIncome = Number(incVal) || 50000;
            db.set('monthlyIncome', state.monthlyIncome);

            // 準備數據庫
            const totalSavings = state.banks.reduce((acc, b) => acc + Number(b.balance), 0);
            const totalCreditDebt = state.credits.reduce((acc, c) => acc + Number(c.debt), 0);
            
            // 計算所有目標下個月需要儲蓄提撥的總合
            let totalMonthlySuggestedSavings = 0;
            state.goals.forEach(g => {
                const months = getRemainingMonths(g.deadline);
                totalMonthlySuggestedSavings += months > 0 ? (Number(g.target) - Number(g.current)) / months : 0;
            });

            // 顯示載入看板
            const board = document.getElementById('ai-planning-result-board');
            board.classList.remove('hidden');
            document.getElementById('ai-safe-limit').innerText = 'AI 思考中...';
            document.getElementById('ai-advice-list').innerHTML = '<li class="text-slate-400 italic font-medium">正在透過金融防護網進行高精密財務規劃中...</li>';

            // 本地 Backup 計算引擎 (作為 Fallback 使用，或當未輸入 Gemini 金鑰時直接高精準精算)
            const localSafeLimit = Math.max(state.monthlyIncome - totalMonthlySuggestedSavings - (totalCreditDebt * 0.1), 0);
            const localHealthScore = Math.min(Math.round(((totalSavings - totalCreditDebt) / (state.monthlyIncome || 1)) * 30 + 50), 100);

            // 構建 Prompt 給大模型
            const userPrompt = `
                請依據我提供的個人財務資訊，為我規劃本月最安全的花費上限額度、給予一個財務安全健康分數（0-100），以及提供3個量身定制的理財專家精實攻略。
                
                財務資料如下：
                - 每月平均總收入：NT$ ${state.monthlyIncome} 元
                - 目前活定存總資產：NT$ ${totalSavings} 元
                - 信用卡累計欠款債務：NT$ ${totalCreditDebt} 元
                - 所有中長期儲蓄目標預估「每月應提撥」的總金額：NT$ ${Math.round(totalMonthlySuggestedSavings)} 元
                
                請使用 json 結構回傳以下欄位：
                1. "safeLimit": 必須是數字，代表本月份合理安全花費額度 (公式參考：月收入 - 每月儲蓄目標提撥 - 部分欠款)
                2. "healthScore": 數字 0-100 分。
                3. "advices": 陣列字串，長度為3，分別代表對應這份資產與債務的關鍵財務改善攻略。
            `;

            const systemPrompt = "你是一位國際頂尖的 Fintech 個人理財與預算精算大師。請一律使用 JSON 格式回覆，不含任何額外的 Markdown 開頭與引號。";
            const apiKey = ""; // Canvas 自動注入 API Key
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

            const payload = {
                contents: [{ parts: [{ text: userPrompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            "safeLimit": { "type": "NUMBER" },
                            "healthScore": { "type": "NUMBER" },
                            "advices": {
                                "type": "ARRAY",
                                "items": { "type": "STRING" }
                            }
                        },
                        "required": ["safeLimit", "healthScore", "advices"]
                    }
                },
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                }
            };

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (!response.ok) throw new Error('API 呼叫失敗，啟用備用高精度引擎');

                const result = await response.json();
                const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
                const parsed = JSON.parse(jsonText);

                // 渲染成果
                document.getElementById('ai-safe-limit').innerText = 'NT$ ' + Math.round(parsed.safeLimit).toLocaleString();
                document.getElementById('ai-health-score').innerText = `財務安全：${parsed.healthScore} 分`;
                
                const advContainer = document.getElementById('ai-advice-list');
                advContainer.innerHTML = '';
                parsed.advices.forEach(adv => {
                    const li = document.createElement('div');
                    li.className = "p-2 bg-slate-50 border border-slate-100 rounded-xl text-[10.5px] text-slate-600 font-medium mb-1.5 flex gap-2 items-start";
                    li.innerHTML = `<span class="text-theme-darkpink mt-0.5">✦</span> <span>${adv}</span>`;
                    advContainer.appendChild(li);
                });
                
                showToast('🤖 AI 智慧理財專家已完成您的專屬預算規劃！');

            } catch (err) {
                // Fallback 本地精密計算與回應
                document.getElementById('ai-safe-limit').innerText = 'NT$ ' + Math.round(localSafeLimit).toLocaleString();
                document.getElementById('ai-health-score').innerText = `財務安全：${localHealthScore} 分 (本地精算)`;
                
                const advContainer = document.getElementById('ai-advice-list');
                advContainer.innerHTML = '';
                
                const fallbackAdvices = [
                    `您的月目標提撥總合為 NT$ ${Math.round(totalMonthlySuggestedSavings).toLocaleString()} 元，建議發薪日當天透過網銀自動提撥以實踐強迫儲蓄。`,
                    `目前信用卡有 NT$ ${totalCreditDebt.toLocaleString()} 元尚未繳納，請謹防滾入循環利息，如有需要請設定帳戶自動扣繳。`,
                    `若欲提升財務安全級別，建議儲備相當於 3-6 個月固定開銷的活期資金作為「緊急預備金」目標。`
                ];

                fallbackAdvices.forEach(adv => {
                    const li = document.createElement('div');
                    li.className = "p-2 bg-slate-50 border border-slate-100 rounded-xl text-[10.5px] text-slate-600 font-medium mb-1.5 flex gap-2 items-start";
                    li.innerHTML = `<span class="text-theme-darkpink mt-0.5">✦</span> <span>${adv}</span>`;
                    advContainer.appendChild(li);
                });

                showToast('🤖 已啟動本機智慧精密財務引擎提供理財規劃！');
            }
        }

        // 渲染 交易明細清單
        function renderTransactions() {
            const container = document.getElementById('transaction-list-container');
            container.innerHTML = '';

            // 讀取篩選條件
            const filterMonth = document.getElementById('filter-month').value; // "YYYY-MM"
            const filterType = document.getElementById('filter-type').value;   // "all", "income", "expense"
            const filterKeyword = document.getElementById('filter-keyword').value.toLowerCase();

            const filtered = state.transactions.filter(t => {
                // 月份篩選
                if (filterMonth && t.date && t.date.substring(0, 7) !== filterMonth) return false;
                // 收支類型篩選
                if (filterType !== 'all' && t.type !== filterType) return false;
                // 關鍵字篩選
                if (filterKeyword && (!t.note || !t.note.toLowerCase().includes(filterKeyword))) return false;
                return true;
            });

            if (filtered.length === 0) {
                container.innerHTML = '<p class="text-slate-400 text-xs text-center py-6 italic">目前無任何交易紀錄</p>';
                return;
            }

            filtered.forEach(t => {
                const isIncome = t.type === 'income';
                const div = document.createElement('div');
                div.className = "p-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex justify-between items-center";
                div.innerHTML = `
                    <div>
                        <div class="flex items-center gap-1.5">
                            <span class="text-xs font-bold text-slate-700">${t.categoryLabel}</span>
                            <span class="text-[8px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-mono">${t.date}</span>
                        </div>
                        <p class="text-[9px] text-slate-400 mt-1">
                            帳戶: ${t.accountName || '未指定'} | 備註: ${t.note || '無備註'}
                        </p>
                    </div>
                    <div class="text-right">
                        <span class="text-xs font-black ${isIncome ? 'text-emerald-600' : 'text-theme-darkpink'}">
                            ${isIncome ? '+' : '-'} NT$ ${Number(t.amount).toLocaleString()}
                        </span>
                        <div>
                            <button onclick="deleteTransactionObject('${t.id}')" class="text-[8px] text-rose-400 font-bold hover:underline">刪除</button>
                        </div>
                    </div>
                `;
                container.appendChild(div);
            });
        }

        // =====================================
        // 計算機記帳邏輯
        // =====================================
        function openCalcModal() {
            document.getElementById('calc-modal').classList.remove('hidden');
            
            // 重設計算機狀態
            state.calc.display = '0';
            state.calc.history = '';
            state.calc.hasCalculated = false;
            selectCategory('food', '🍔 食物');
            updateCalcDisplay();
            updateCalcPaymentAccountOptions();
        }

        function closeCalcModal() {
            document.getElementById('calc-modal').classList.add('hidden');
        }

        // 選擇分類
        function selectCategory(cat, label) {
            state.calc.category = cat;
            state.calc.categoryLabel = label;

            // 移除所有按鈕作用中樣式
            const btns = document.querySelectorAll('.category-btn');
            btns.forEach(btn => {
                btn.className = "category-btn py-1.5 px-1 bg-slate-50 text-slate-600 border border-slate-100 rounded-xl text-center";
            });

            // 尋找點選按鈕加樣式 (利用 JS 來控制較不易出錯)
            event.target.className = "category-btn py-1.5 px-1 bg-theme-blue text-theme-darkblue border border-theme-darkblue/20 rounded-xl text-center font-bold shadow-sm";

            // 如果點選收入，自動把付款方式設定為存款帳戶
            const payTypeSelect = document.getElementById('calc-payment-type');
            if (cat === 'income') {
                payTypeSelect.value = 'bank';
                updateCalcPaymentAccountOptions();
            }
        }

        // 當收支或付款來源改變，變更可選擇之活期存款/信用卡清單
        function updateCalcPaymentAccountOptions() {
            const payType = document.getElementById('calc-payment-type').value;
            const accountSelect = document.getElementById('calc-payment-account');
            accountSelect.innerHTML = '';

            if (payType === 'bank') {
                // 僅挑選活存 savings 進行收支記帳
                const savings = state.banks.filter(b => b.type === 'savings');
                savings.forEach(b => {
                    const opt = document.createElement('option');
                    opt.value = b.id;
                    opt.innerText = `🏦 ${b.name} (餘: $${b.balance.toLocaleString()})`;
                    accountSelect.appendChild(opt);
                });
            } else {
                state.credits.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.id;
                    opt.innerText = `💳 ${c.name} (欠: $${c.debt.toLocaleString()})`;
                    accountSelect.appendChild(opt);
                });
            }
        }

        // 按鍵處理
        function pressCalcKey(key) {
            let disp = state.calc.display;
            let hist = state.calc.history;

            if (key >= '0' && key <= '9') {
                if (disp === '0' || state.calc.hasCalculated) {
                    disp = key;
                    state.calc.hasCalculated = false;
                } else {
                    disp += key;
                }
            } else if (key === 'C') {
                disp = '0';
                hist = '';
                state.calc.hasCalculated = false;
            } else if (['+', '-', '*', '/'].includes(key)) {
                hist += disp + ' ' + key + ' ';
                disp = '0';
            } else if (key === '=') {
                try {
                    hist += disp;
                    // 使用安全評估
                    const result = eval(hist);
                    disp = String(Math.round(result));
                    hist = '';
                    state.calc.hasCalculated = true;
                } catch (e) {
                    disp = 'Error';
                    hist = '';
                }
            }

            state.calc.display = disp;
            state.calc.history = hist;
            updateCalcDisplay();
        }

        function updateCalcDisplay() {
            document.getElementById('calc-display').innerText = state.calc.display;
            document.getElementById('calc-history').innerText = state.calc.history;
        }

        // 確認送出計算機交易紀錄
        function submitCalculationRecord() {
            // 如果尚未運算完畢，先自動幫他做「=」運算
            if (state.calc.history !== '') {
                pressCalcKey('=');
            }

            const finalAmount = Number(state.calc.display);
            if (isNaN(finalAmount) || finalAmount <= 0) {
                showToast('❌ 請輸入大於 0 的正確金額！');
                return;
            }

            const cat = state.calc.category;
            const label = state.calc.categoryLabel;
            const payType = document.getElementById('calc-payment-type').value;
            const accountId = document.getElementById('calc-payment-account').value;
            const note = document.getElementById('calc-note').value.trim() || label;

            if (!accountId) {
                showToast('❌ 請選定有效的帳戶或卡片！');
                return;
            }

            // 判斷收支與扣款處理
            const isIncome = cat === 'income';
            
            if (payType === 'bank') {
                const bank = state.banks.find(b => b.id === accountId);
                if (!bank) return;
                
                if (isIncome) {
                    bank.balance = Number(bank.balance) + finalAmount;
                } else {
                    if (Number(bank.balance) < finalAmount) {
                        showToast(`餘額不足！帳戶[${bank.name}]尚缺 NT$ ${finalAmount - bank.balance}`);
                        return;
                    }
                    bank.balance = Number(bank.balance) - finalAmount;
                }
                
                // 新增交易
                const tId = 't_' + Date.now();
                state.transactions.unshift({
                    id: tId,
                    date: new Date().toISOString().substring(0, 10),
                    type: isIncome ? 'income' : 'expense',
                    category: cat,
                    categoryLabel: label,
                    amount: finalAmount,
                    paymentType: 'bank',
                    accountId: bank.id,
                    accountName: bank.name,
                    note: note
                });
            } else {
                // 信用卡刷卡 (信用卡不接受收入記帳)
                if (isIncome) {
                    showToast('❌ 信用卡不支援記帳收入，請選存款帳戶！');
                    return;
                }
                const credit = state.credits.find(c => c.id === accountId);
                if (!credit) return;

                // 刷卡增加欠款
                credit.debt = Number(credit.debt) + finalAmount;

                // 新增交易
                const tId = 't_' + Date.now();
                state.transactions.unshift({
                    id: tId,
                    date: new Date().toISOString().substring(0, 10),
                    type: 'expense',
                    category: cat,
                    categoryLabel: label,
                    amount: finalAmount,
                    paymentType: 'credit',
                    accountId: credit.id,
                    accountName: credit.name,
                    note: note
                });
            }

            // 儲存並關閉
            db.set('banks', state.banks);
            db.set('credits', state.credits);
            db.set('transactions', state.transactions);

            showToast('💾 記帳成功，資產已同步變更！');
            closeCalcModal();
            updateAllViews();
        }

        // =====================================
        // CRUD 資料表單處理
        // =====================================
        
        // --- 銀行帳戶 ---
        function openBankModal(editId = null) {
            state.editingItem = editId;
            if (editId) {
                const b = state.banks.find(x => x.id === editId);
                document.getElementById('bank-name').value = b.name;
                document.getElementById('bank-balance').value = b.balance;
                document.getElementById('bank-type').value = b.type;
            } else {
                document.getElementById('bank-name').value = '';
                document.getElementById('bank-balance').value = '';
                document.getElementById('bank-type').value = 'savings';
            }
            document.getElementById('bank-modal').classList.remove('hidden');
        }

        function closeBankModal() {
            document.getElementById('bank-modal').classList.add('hidden');
        }

        function saveBankObject() {
            const name = document.getElementById('bank-name').value.trim();
            const balance = Number(document.getElementById('bank-balance').value);
            const type = document.getElementById('bank-type').value;

            if (!name) {
                showToast('請填寫帳戶或銀行名稱！');
                return;
            }

            if (state.editingItem) {
                const b = state.banks.find(x => x.id === state.editingItem);
                b.name = name;
                b.balance = balance;
                b.type = type;
                showToast('🏦 帳戶已修改更新');
            } else {
                const newId = 'b_' + Date.now();
                state.banks.push({ id: newId, name, balance, type });
                showToast('🏦 成功新增全新存款帳戶');
            }

            db.set('banks', state.banks);
            closeBankModal();
            updateAllViews();
        }

        function editBankObject(id) {
            openBankModal(id);
        }

        // --- 信用卡 ---
        function openCreditModal(editId = null) {
            state.editingItem = editId;
            if (editId) {
                const c = state.credits.find(x => x.id === editId);
                document.getElementById('credit-name').value = c.name;
                document.getElementById('credit-limit').value = c.limit;
                document.getElementById('credit-debt').value = c.debt;
                document.getElementById('credit-due-date').value = c.dueDate || '';
                document.getElementById('credit-min-due').value = c.minDue || '';
                document.getElementById('credit-bank-code').value = c.bankCode || '';
                document.getElementById('credit-transfer-account').value = c.transferAccount || '';
            } else {
                document.getElementById('credit-name').value = '';
                document.getElementById('credit-limit').value = '';
                document.getElementById('credit-debt').value = '';
                document.getElementById('credit-due-date').value = '';
                document.getElementById('credit-min-due').value = '';
                document.getElementById('credit-bank-code').value = '';
                document.getElementById('credit-transfer-account').value = '';
            }
            document.getElementById('credit-modal').classList.remove('hidden');
        }

        function closeCreditModal() {
            document.getElementById('credit-modal').classList.add('hidden');
        }

        function saveCreditCardObject() {
            const name = document.getElementById('credit-name').value.trim();
            const limit = Number(document.getElementById('credit-limit').value) || 0;
            const debt = Number(document.getElementById('credit-debt').value) || 0;
            const dueDate = document.getElementById('credit-due-date').value;
            const minDue = Number(document.getElementById('credit-min-due').value) || 0;
            const bankCode = document.getElementById('credit-bank-code').value.trim();
            const transferAccount = document.getElementById('credit-transfer-account').value.trim();

            if (!name) {
                showToast('請輸入信用卡卡片名稱！');
                return;
            }

            if (state.editingItem) {
                const c = state.credits.find(x => x.id === state.editingItem);
                c.name = name;
                c.limit = limit;
                c.debt = debt;
                c.dueDate = dueDate;
                c.minDue = minDue;
                c.bankCode = bankCode;
                c.transferAccount = transferAccount;
                showToast('💳 信用卡設定已修正');
            } else {
                const newId = 'c_' + Date.now();
                state.credits.push({ id: newId, name, limit, debt, dueDate, minDue, bankCode, transferAccount });
                showToast('💳 成功新增信用卡');
            }

            db.set('credits', state.credits);
            closeCreditModal();
            updateAllViews();
        }

        function editCreditCardObject(id) {
            openCreditModal(id);
        }

        // --- 證券股票 ---
        function openStockModal(editId = null) {
            state.editingItem = editId;
            if (editId) {
                const s = state.stocks.find(x => x.id === editId);
                document.getElementById('stock-symbol').value = s.symbol;
                document.getElementById('stock-name').value = s.name;
                document.getElementById('stock-buy-price').value = s.buyPrice;
                document.getElementById('stock-shares').value = s.shares;
                document.getElementById('stock-current-price').value = s.currentPrice;
            } else {
                document.getElementById('stock-symbol').value = '';
                document.getElementById('stock-name').value = '';
                document.getElementById('stock-buy-price').value = '';
                document.getElementById('stock-shares').value = '';
                document.getElementById('stock-current-price').value = '';
            }
            document.getElementById('stock-modal').classList.remove('hidden');
        }

        function closeStockModal() {
            document.getElementById('stock-modal').classList.add('hidden');
        }

        function saveStockObject() {
            const symbol = document.getElementById('stock-symbol').value.trim().toUpperCase();
            const name = document.getElementById('stock-name').value.trim();
            const buyPrice = Number(document.getElementById('stock-buy-price').value);
            const shares = Number(document.getElementById('stock-shares').value);
            const currentPrice = Number(document.getElementById('stock-current-price').value) || buyPrice;

            if (!symbol || !name || isNaN(buyPrice) || isNaN(shares)) {
                showToast('請完整填寫股票資訊！');
                return;
            }

            if (state.editingItem) {
                const s = state.stocks.find(x => x.id === state.editingItem);
                s.symbol = symbol;
                s.name = name;
                s.buyPrice = buyPrice;
                s.shares = shares;
                s.currentPrice = currentPrice;
                showToast('📈 持股設定已更新');
            } else {
                const newId = 's_' + Date.now();
                state.stocks.push({ id: newId, symbol, name, buyPrice, shares, currentPrice });
                showToast('📈 持股成功新增至資產庫');
            }

            db.set('stocks', state.stocks);
            closeStockModal();
            updateAllViews();
        }

        function editStockObject(id) {
            openStockModal(id);
        }

        function deleteStockObject(id) {
            state.stocks = state.stocks.filter(s => s.id !== id);
            db.set('stocks', state.stocks);
            showToast('📈 持股已刪除');
            updateAllViews();
        }

        // --- 儲蓄目標 ---
        function openGoalModal(editId = null) {
            state.editingItem = editId;
            if (editId) {
                const g = state.goals.find(x => x.id === editId);
                document.getElementById('goal-title').value = g.title;
                document.getElementById('goal-target').value = g.target;
                document.getElementById('goal-current').value = g.current;
                document.getElementById('goal-deadline').value = g.deadline || '';
            } else {
                document.getElementById('goal-title').value = '';
                document.getElementById('goal-target').value = '';
                document.getElementById('goal-current').value = '0';
                document.getElementById('goal-deadline').value = '';
            }
            document.getElementById('goal-modal').classList.remove('hidden');
        }

        function closeGoalModal() {
            document.getElementById('goal-modal').classList.add('hidden');
        }

        function saveGoalObject() {
            const title = document.getElementById('goal-title').value.trim();
            const target = Number(document.getElementById('goal-target').value);
            const current = Number(document.getElementById('goal-current').value) || 0;
            const deadline = document.getElementById('goal-deadline').value;

            if (!title || !target) {
                showToast('請完整填寫目標夢想與總金額！');
                return;
            }

            if (state.editingItem) {
                const g = state.goals.find(x => x.id === state.editingItem);
                g.title = title;
                g.target = target;
                g.current = current;
                g.deadline = deadline;
                showToast('🎯 儲蓄目標已更新');
            } else {
                const newId = 'g_' + Date.now();
                state.goals.push({ id: newId, title, target, current, deadline });
                showToast('🎯 成功建立全新儲蓄目標');
            }

            db.set('goals', state.goals);
            closeGoalModal();
            updateAllViews();
        }

        function editGoalObject(id) {
            openGoalModal(id);
        }

        function deleteGoalObject(id) {
            state.goals = state.goals.filter(g => g.id !== id);
            db.set('goals', state.goals);
            showToast('🎯 目標已被移除');
            updateAllViews();
        }

        // --- 刪除交易記錄 ---
        function deleteTransactionObject(id) {
            // 由於交易刪除，理論上應該退還已扣帳款或降低信用卡欠款
            const t = state.transactions.find(x => x.id === id);
            if (t) {
                if (t.paymentType === 'bank') {
                    const bank = state.banks.find(b => b.id === t.accountId);
                    if (bank) {
                        if (t.type === 'income') {
                            bank.balance = Number(bank.balance) - Number(t.amount);
                        } else {
                            bank.balance = Number(bank.balance) + Number(t.amount);
                        }
                    }
                } else if (t.paymentType === 'credit') {
                    const credit = state.credits.find(c => c.id === t.accountId);
                    if (credit) {
                        // 移除消費降欠款
                        credit.debt = Math.max(Number(credit.debt) - Number(t.amount), 0);
                    }
                }
            }

            state.transactions = state.transactions.filter(t => t.id !== id);
            db.set('transactions', state.transactions);
            db.set('banks', state.banks);
            db.set('credits', state.credits);

            showToast('📝 交易明細已安全刪除並沖帳');
            updateAllViews();
        }

        // =====================================
        // Google Drive 備份與同步雲端功能
        // =====================================
        let tokenClient;

        function openSyncModal() {
            document.getElementById('sync-modal').classList.remove('hidden');
            const savedTime = localStorage.getItem('wf_last_sync_time');
            if (savedTime) {
                document.getElementById('sync-last-time').innerText = savedTime;
            }
            
            // 動態取得目前的 origin 並顯示在畫面上，方便使用者複製
            const currentOrigin = window.location.origin;
            document.getElementById('g-origin-val').innerText = currentOrigin === 'null' ? '本機檔案 (null)，請使用 localhost 或部署至網站' : currentOrigin;

            // 載入已儲存之 Client ID
            const savedClientId = localStorage.getItem('wf_g_client_id');
            if (savedClientId) {
                document.getElementById('g-client-id').value = savedClientId;
            }
        }

        function closeSyncModal() {
            document.getElementById('sync-modal').classList.add('hidden');
        }

        // 開始 Google Auth 流程
        function authenticateGoogleUser() {
            const clientId = document.getElementById('g-client-id').value.trim();
            if (!clientId) {
                showToast('❌ 請先輸入您從 Google Cloud 建立的 Client ID！');
                return;
            }

            // 本地儲存 Client ID 方便下次使用
            localStorage.setItem('wf_g_client_id', clientId);

            try {
                tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: clientId,
                    scope: 'https://www.googleapis.com/auth/drive.file',
                    callback: (response) => {
                        if (response.error) {
                            showToast('🚫 授權失敗：' + response.error);
                            return;
                        }
                        state.googleToken = response.access_token;
                        showToast('🔑 成功授權 Google 帳號！上傳與下載已啟用。');
                        
                        // 啟用上下載按鈕
                        document.getElementById('btn-cloud-upload').disabled = false;
                        document.getElementById('btn-cloud-upload').className = "py-2 px-3 bg-gradient-to-r from-theme-darkblue to-sky-600 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md cursor-pointer";
                        document.getElementById('btn-cloud-download').disabled = false;
                        document.getElementById('btn-cloud-download').className = "py-2 px-3 bg-gradient-to-r from-theme-darkpink to-pink-600 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md cursor-pointer";
                    }
                });
                tokenClient.requestAccessToken();
            } catch (err) {
                showToast('⚠️ 初始化登入客戶端失敗，請確認 Client ID 格式！');
            }
        }

        // 搜尋雲端上的備份檔案
        async function findBackupFileOnDrive() {
            const response = await fetch('https://www.googleapis.com/drive/v3/files?q=name%3D%27wealthflow_backup.json%27+and+trashed%3Dfalse', {
                headers: { 'Authorization': 'Bearer ' + state.googleToken }
            });
            const result = await response.json();
            return result.files && result.files.length > 0 ? result.files[0] : null;
        }

        // 上傳備份到 Google Drive (手動 multipart/related 封裝)
        async function uploadToCloud() {
            if (!state.googleToken) return;
            showToast('☁️ 正在上傳資料至 Google 雲端硬碟...');

            const payloadData = {
                banks: state.banks,
                credits: state.credits,
                stocks: state.stocks,
                goals: state.goals,
                transactions: state.transactions,
                monthlyIncome: state.monthlyIncome
            };

            const metadata = {
                name: 'wealthflow_backup.json',
                mimeType: 'application/json'
            };

            try {
                const existingFile = await findBackupFileOnDrive();
                let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
                let method = 'POST';

                if (existingFile) {
                    url = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`;
                    method = 'PATCH';
                }

                // 手動構造 multipart/related 的 Body 避免 FormData 自動添加邊界导致 400 錯誤
                const boundary = 'wealthflow_sync_boundary_999';
                const delimiter = "\r\n--" + boundary + "\r\n";
                const close_delim = "\r\n--" + boundary + "--";

                const fileContent = JSON.stringify(payloadData, null, 2);
                
                const multipartRequestBody = 
                    "--" + boundary + "\r\n" +
                    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
                    JSON.stringify(metadata) +
                    delimiter +
                    "Content-Type: application/json\r\n\r\n" +
                    fileContent +
                    close_delim;

                const uploadResponse = await fetch(url, {
                    method: method,
                    headers: { 
                        'Authorization': 'Bearer ' + state.googleToken,
                        'Content-Type': 'multipart/related; boundary=' + boundary
                    },
                    body: multipartRequestBody
                });

                if (uploadResponse.ok) {
                    const nowStr = new Date().toLocaleString();
                    localStorage.setItem('wf_last_sync_time', nowStr);
                    document.getElementById('sync-last-time').innerText = nowStr;
                    showToast('🎉 資料成功上傳並安全儲存至您的 Google 雲端硬碟！');
                } else {
                    const errorDetails = await uploadResponse.text();
                    console.error('Google Upload Error Details:', errorDetails);
                    showToast('❌ 備份失敗，請確認 JavaScript 來源設定！');
                }
            } catch (e) {
                console.error(e);
                showToast('發生未預期錯誤，請重新登入授權再試。');
            }
        }

        // 下載並還原雲端硬碟的備份資料
        async function downloadFromCloud() {
            if (!state.googleToken) return;
            showToast('☁️ 正在從 Google 雲端取得最新備份檔案...');

            try {
                const existingFile = await findBackupFileOnDrive();
                if (!existingFile) {
                    showToast('📌 未在您的雲端硬碟中找到備份檔案 (wealthflow_backup.json)！');
                    return;
                }

                const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`, {
                    headers: { 'Authorization': 'Bearer ' + state.googleToken }
                });

                if (fileResponse.ok) {
                    const data = await fileResponse.json();
                    
                    // 還原資料
                    state.banks = data.banks || [];
                    state.credits = data.credits || [];
                    state.stocks = data.stocks || [];
                    state.goals = data.goals || [];
                    state.transactions = data.transactions || [];
                    state.monthlyIncome = data.monthlyIncome || 50000;

                    // 寫入本地存檔
                    db.set('banks', state.banks);
                    db.set('credits', state.credits);
                    db.set('stocks', state.stocks);
                    db.set('goals', state.goals);
                    db.set('transactions', state.transactions);
                    db.set('monthlyIncome', state.monthlyIncome);

                    showToast('🎉 雲端備份已完美下載還原！正在載入新資產帳本。');
                    updateAllViews();
                    closeSyncModal();
                } else {
                    showToast('❌ 下載失敗，請稍候重試。');
                }
            } catch (e) {
                showToast('發生錯誤，請重試或重新登入。');
            }
        }

        // =====================================
        // 資料匯出 CSV
        // =====================================
        function exportDataToCSV() {
            if (state.transactions.length === 0) {
                showToast('目前無任何帳目可以匯出！');
                return;
            }

            // UTF-8 BOM 避免 Excel 開氣亂碼
            let csvContent = "\uFEFF";
            csvContent += "日期,收支類型,消費大分類,金額,付款帳戶/信用卡,備註\n";

            state.transactions.forEach(t => {
                const row = [
                    t.date,
                    t.type === 'income' ? '收入' : '支出',
                    t.categoryLabel,
                    t.amount,
                    t.accountName,
                    `"${(t.note || '').replace(/"/g, '""')}"`
                ];
                csvContent += row.join(",") + "\n";
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `WealthFlow_記帳匯出_${new Date().toISOString().substring(0,10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('📊 一鍵匯出 CSV 成功 (相容 Excel)！');
        }

        // =====================================
        // 恢復原廠設定與清除資料邏輯
        // =====================================
        let resetConfirmTimeout = null;
        let isResetConfirming = false;

        function triggerFactoryReset() {
            const btnText = document.getElementById('reset-btn-text');
            const btn = document.getElementById('btn-reset-data');

            if (!isResetConfirming) {
                isResetConfirming = true;
                btnText.innerText = "⚠️ 確定要清除？再次點選確認！";
                btn.className = "w-full py-1.5 px-3 bg-rose-600 text-white hover:bg-rose-700 transition-colors text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer";
                
                resetConfirmTimeout = setTimeout(() => {
                    isResetConfirming = false;
                    btnText.innerText = "清除本機所有資料 (重設)";
                    btn.className = "w-full py-1.5 px-3 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer";
                }, 4000); // 4秒後自動取消確認狀態
            } else {
                clearTimeout(resetConfirmTimeout);
                isResetConfirming = false;
                
                // 清除 LocalStorage 數據
                const keysToClear = ['banks', 'credits', 'stocks', 'goals', 'transactions', 'monthlyIncome', 'last_sync_time'];
                keysToClear.forEach(key => {
                    localStorage.removeItem('wf_app_' + key);
                });
                
                // 重設記憶體 State
                state.banks = [];
                state.credits = [];
                state.stocks = [];
                state.goals = [];
                state.transactions = [];
                state.monthlyIncome = 50000;
                
                // 寫入空數據庫
                db.set('banks', []);
                db.set('credits', []);
                db.set('stocks', []);
                db.set('goals', []);
                db.set('transactions', []);
                db.set('monthlyIncome', 50000);
                
                // 刷新介面
                updateAllViews();
                
                // 恢復按鈕預設樣式
                btnText.innerText = "清除本機所有資料 (重設)";
                btn.className = "w-full py-1.5 px-3 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer";
                
                showToast("🗑️ 本機所有記帳與資產資料已成功歸零清空！");
                closeSyncModal();
            }
        }
    </script>
</body>
</html>
```
eof

### 📲 重新上傳 GitHub 並享受 PWA 全螢幕吧！

請您完成以下這一步，就能在手機上將其當作 100% 獨立的全螢幕 App 執行囉：

1. **上傳新檔案**：將新產生的 **`sw.js`** 檔案上傳到您的 GitHub Pages 專案，同時將更新後的 **`index.html`** 也上傳覆蓋。
2. **清除瀏覽器快取**：在手機瀏覽器中打開您的網址 `https://yunnycoort.github.io/wealthflow/`，並按「重新整理」以載入最新檔案。
3. **刪除舊捷徑、重新加入**：
   * 由於您之前可能已經建立過網頁捷徑，**請先將手機桌面上舊的 WealthFlow 圖示刪除**。
   * 回到瀏覽器，點擊選單 ➜ 點選 **「新增至主畫面」**（Android Chrome 通常也會顯示 **「安裝應用程式」**）。
   * 重新命名並確認新增。
4. **點開全新圖示**：回到手機桌面，點選剛剛新生成的 `👛 WealthFlow` 圖示——**恭喜您！所有的瀏覽器網址列、底部的導航列和功能鍵全部都會消失，100% 全螢幕的純淨手機記帳 App 已完美誕生！**
