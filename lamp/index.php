<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HR Department Portal (LAMP Clone)</title>
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                        display: ['Space Grotesk', 'sans-serif'],
                        mono: ['JetBrains Mono', 'monospace'],
                    }
                }
            }
        }
    </script>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #fcfcfd; }
    </style>
</head>
<body class="text-gray-900 min-h-screen flex flex-col bg-gray-50/50">

    <!-- App State Container (JS managed) -->
    <div id="auth-view" class="flex-1 flex items-center justify-center p-4">
        <!-- Login Card -->
        <div class="w-full max-w-xl bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div class="bg-gray-900 px-6 py-6 text-white border-b border-gray-800">
                <h1 class="font-display text-xl font-bold tracking-tight">HR Associate Manager (LAMP App)</h1>
                <p class="text-xs text-gray-400 mt-1 font-sans">Corporate candidate, grievance incident & scheduling pipeline.</p>
            </div>
            
            <!-- Auth Navigation tabs -->
            <div class="flex border-b border-gray-200 bg-gray-50 font-semibold text-xs text-center text-gray-550">
                <button onclick="toggleAuthTab('login')" id="auth-btn-login" class="flex-1 py-3 px-4 border-b-2 border-gray-900 bg-white text-gray-900">Sign In</button>
                <button onclick="toggleAuthTab('register')" id="auth-btn-register" class="flex-1 py-3 px-4 border-b-2 border-transparent hover:bg-white hover:text-gray-900 transition-colors">Register Account</button>
                <button onclick="toggleAuthTab('careers')" id="auth-btn-careers" class="flex-1 py-3 px-4 border-b-2 border-transparent hover:bg-white hover:text-gray-900 transition-colors">Careers / Prospective</button>
            </div>

            <div class="p-6 md:p-8 space-y-4">
                <!-- Alerts feedback -->
                <div id="auth-alert" class="hidden p-3.5 rounded-xl text-xs border"></div>

                <!-- FORM: SIGN IN -->
                <form id="form-login" onsubmit="submitLogin(event)" class="space-y-4">
                    <div class="space-y-1 text-left">
                        <label class="text-xs font-semibold text-gray-700 uppercase block">Registered Email</label>
                        <input type="email" id="login-email" required placeholder="e.g. manishakamal1994@gmail.com" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none">
                    </div>
                    <div class="space-y-1 text-left">
                        <label class="text-xs font-semibold text-gray-700 uppercase block">Password</label>
                        <input type="password" id="login-password" required placeholder="••••••••" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none">
                    </div>
                    <button type="submit" class="w-full py-2.5 bg-gray-950 hover:bg-gray-900 text-white font-medium text-sm rounded-xl">Secure Login</button>
                    
                    <div class="pt-4 border-t border-gray-100 text-center text-[10px] text-gray-400">
                        Admin: <span class="font-mono">manishakamal1994@gmail.com</span> / Password: <span class="font-mono">Admin123!</span>
                    </div>
                </form>

                <!-- FORM: REGISTER -->
                <form id="form-register" onsubmit="submitRegister(event)" class="hidden space-y-4">
                    <div class="space-y-1 text-left">
                        <label class="text-xs font-semibold text-gray-700 uppercase block">Full Name</label>
                        <input type="text" id="reg-name" required placeholder="Jane Doe" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none">
                    </div>
                    <div class="space-y-1 text-left">
                        <label class="text-xs font-semibold text-gray-700 uppercase block">Work Environment Email</label>
                        <input type="email" id="reg-email" required placeholder="jane@company.com" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none">
                    </div>
                    <div class="space-y-1 text-left">
                        <label class="text-xs font-semibold text-gray-700 uppercase block">Target Clearance Role</label>
                        <select id="reg-role" class="w-full text-sm px-3.5 py-2.5 border border-gray-200 bg-white rounded-xl outline-none">
                            <option value="Employee">Employee (Read-Only access)</option>
                            <option value="HR">HR Manager (High privilege access)</option>
                            <option value="Director">Director (High privilege oversight)</option>
                            <option value="CEO">CEO (Ultimate administrator)</option>
                        </select>
                    </div>
                    <div class="space-y-1 text-left">
                        <label class="text-xs font-semibold text-gray-700 uppercase block">Security Password</label>
                        <input type="password" id="reg-password" required placeholder="••••••••" class="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-200 outline-none">
                    </div>
                    <button type="submit" class="w-full py-2.5 bg-gray-950 hover:bg-gray-900 text-white font-medium text-sm rounded-xl">Apply Registration Access</button>
                </form>

                <!-- FORM: CANDIDATE CAREERS -->
                <form id="form-careers" onsubmit="submitProspect(event)" class="hidden space-y-4">
                    <p class="text-xs text-gray-400 text-left">Potential candidates can submit their details and motivations below to register in our databases.</p>
                    <div class="grid grid-cols-2 gap-3 text-left">
                        <div>
                            <label class="text-[10px] font-bold text-gray-500 uppercase block">Name</label>
                            <input type="text" id="cand-name" required placeholder="Alan Turing" class="w-full text-xs px-2.5 py-2 rounded-lg border border-gray-200 outline-none">
                        </div>
                        <div>
                            <label class="text-[10px] font-bold text-gray-500 uppercase block">Email</label>
                            <input type="email" id="cand-email" required placeholder="alan@turing.com" class="w-full text-xs px-2.5 py-2 rounded-lg border border-gray-200 outline-none">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3 text-left">
                        <div>
                            <label class="text-[10px] font-bold text-gray-500 uppercase block">Phone</label>
                            <input type="text" id="cand-phone" placeholder="+1-555-0100" class="w-full text-xs px-2.5 py-2 rounded-lg border border-gray-200 outline-none">
                        </div>
                        <div>
                            <label class="text-[10px] font-bold text-gray-500 uppercase block">Position</label>
                            <input type="text" id="cand-role" required placeholder="UI Craftsman" class="w-full text-xs px-2.5 py-2 rounded-lg border border-gray-200 outline-none">
                        </div>
                    </div>
                    <div class="text-left">
                        <label class="text-[10px] font-bold text-gray-500 uppercase block">Motivational CV Bio Summary</label>
                        <textarea id="cand-cv" required rows="3" placeholder="Explain your professional experience..." class="w-full text-xs px-2.5 py-2 rounded-lg border border-gray-200 outline-none resize-none"></textarea>
                    </div>
                    <button type="submit" class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg">Submit Talent Application</button>
                </form>
            </div>
        </div>
    </div>


    <!-- Active App Console (Hidden initially) -->
    <div id="app-view" class="hidden flex-1 flex flex-col">
        <!-- Navigation Header -->
        <header class="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <span class="p-2 bg-gray-900 text-emerald-400 rounded-xl font-bold font-display text-sm">HR</span>
                    <div class="text-left">
                        <h1 class="font-display font-medium text-xs text-gray-950 uppercase tracking-widest">Department Manager</h1>
                        <p class="text-[9px] text-gray-400 uppercase font-bold tracking-wider">LAMP Deployment</p>
                    </div>
                </div>

                <!-- User identity -->
                <div class="flex items-center gap-3">
                    <div class="text-right text-xs">
                        <span id="header-user-name" class="font-bold text-gray-800">Manisha Kamal</span>
                        <span id="header-user-role" class="block text-[10px] text-emerald-600 font-extrabold uppercase">CEO</span>
                    </div>
                    <button onclick="handleLogout()" class="p-2 px-3 text-red-650 hover:bg-red-50 border border-transparent rounded-xl text-xs font-bold transition-all">Sign out</button>
                </div>
            </div>
        </header>

        <!-- Main Body Workspaces -->
        <main class="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">
            
            <!-- Tabs Navbar Selector -->
            <div class="flex bg-white p-1 rounded-xl border border-gray-200 max-w-lg mb-4 text-xs font-semibold">
                <button onclick="switchAppTab('recruiting')" id="tab-btn-recruiting" class="flex-1 py-2 px-4 rounded-lg bg-gray-950 text-white font-bold">Recruiting</button>
                <button onclick="switchAppTab('grievance')" id="tab-btn-grievance" class="flex-1 py-2 px-4 rounded-lg text-gray-500">Grievances</button>
                <button onclick="switchAppTab('scheduler')" id="tab-btn-scheduler" class="flex-1 py-2 px-4 rounded-lg text-gray-500">Scheduler</button>
                <button onclick="switchAppTab('admin')" id="tab-btn-admin" class="hidden flex-1 py-2 px-4 rounded-lg text-gray-500">Admin Cockpit</button>
            </div>

            <!-- Workspace panels viewport -->
            <div id="panel-recruiting" class="space-y-4">
                <p class="text-xs text-gray-400 text-left">Active Candidate sourcing pipeline database. Communication available inside backend channels.</p>
                <div class="flex flex-col lg:flex-row gap-6 text-left">
                    <div class="flex-1 bg-white p-4 border border-gray-200 rounded-xl min-h-[400px]">
                        <h3 class="font-display font-medium text-sm text-gray-900 border-b border-gray-100 pb-2 mb-3">Sourced Talents</h3>
                        <div id="candidates-list" class="space-y-3"></div>
                    </div>
                </div>
            </div>

            <div id="panel-grievance" class="hidden text-left space-y-4">
                <h2 class="font-display font-bold text-sm text-gray-900">Incident Grievance ticketing channels</h2>
            </div>

            <div id="panel-scheduler" class="hidden text-left space-y-4">
                <h2 class="font-display font-bold text-sm text-gray-900">Daily, Weekly & Monthly Calendars</h2>
            </div>

            <div id="panel-admin" class="hidden text-left space-y-4">
                <h2 class="font-display font-bold text-sm text-gray-900">Personnel Roster Administrations</h2>
            </div>

        </main>
    </div>

    <!-- Script states -->
    <script>
        let currentSessionUser = null;
        let activeAuthTab = 'login';
        let activeAppTab = 'recruiting';

        function toggleAuthTab(tab) {
            activeAuthTab = tab;
            document.getElementById('form-login').classList.add('hidden');
            document.getElementById('form-register').classList.add('hidden');
            document.getElementById('form-careers').classList.add('hidden');
            
            document.getElementById('auth-btn-login').className = "flex-1 py-3 px-4 border-b-2 hover:bg-white text-gray-550 border-transparent";
            document.getElementById('auth-btn-register').className = "flex-1 py-3 px-4 border-b-2 hover:bg-white text-gray-550 border-transparent";
            document.getElementById('auth-btn-careers').className = "flex-1 py-3 px-4 border-b-2 hover:bg-white text-gray-550 border-transparent";

            if (tab === 'login') {
                document.getElementById('form-login').classList.remove('hidden');
                document.getElementById('auth-btn-login').className = "flex-1 py-3 px-4 border-b-2 border-gray-900 bg-white text-gray-900 font-bold";
            } else if (tab === 'register') {
                document.getElementById('form-register').classList.remove('hidden');
                document.getElementById('auth-btn-register').className = "flex-1 py-3 px-4 border-b-2 border-gray-900 bg-white text-gray-900 font-bold";
            } else {
                document.getElementById('form-careers').classList.remove('hidden');
                document.getElementById('auth-btn-careers').className = "flex-1 py-3 px-4 border-b-2 border-gray-900 bg-white text-gray-900 font-bold";
            }
        }

        async function submitLogin(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const alertBox = document.getElementById('auth-alert');

            alertBox.classList.add('hidden');

            try {
                const res = await fetch('auth.php?action=login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Verification issue.");
                
                currentSessionUser = data.user;
                initializeDashboard();
            } catch (err) {
                alertBox.textContent = err.message;
                alertBox.className = "p-3.5 rounded-xl text-xs bg-red-50 text-red-700 border border-red-100";
                alertBox.classList.remove('hidden');
            }
        }

        async function submitRegister(e) {
            e.preventDefault();
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const role = document.getElementById('reg-role').value;
            const password = document.getElementById('reg-password').value;
            const alertBox = document.getElementById('auth-alert');

            try {
                const res = await fetch('auth.php?action=register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, role, password })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "System issue");

                alertBox.textContent = data.message;
                alertBox.className = "p-3.5 rounded-xl text-xs bg-emerald-50 text-emerald-800 border border-emerald-100";
                alertBox.classList.remove('hidden');
                toggleAuthTab('login');
            } catch (err) {
                alertBox.textContent = err.message;
                alertBox.className = "p-3.5 rounded-xl text-xs bg-red-50 text-red-700 border border-red-100";
                alertBox.classList.remove('hidden');
            }
        }

        async function submitProspect(e) {
            e.preventDefault();
            const name = document.getElementById('cand-name').value;
            const email = document.getElementById('cand-email').value;
            const phone = document.getElementById('cand-phone').value;
            const roleApplied = document.getElementById('cand-role').value;
            const cvSummary = document.getElementById('cand-cv').value;
            const alertBox = document.getElementById('auth-alert');

            try {
                const res = await fetch('api.php?endpoint=prospects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-auth-bypass': '1' },
                    body: JSON.stringify({ name, email, phone, roleApplied, cvSummary })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Submission issue");

                alertBox.textContent = "Talent registered as a prospect candidate. Communications will follow under your email.";
                alertBox.className = "p-3.5 rounded-xl text-xs bg-emerald-50 text-emerald-800 border border-emerald-100";
                alertBox.classList.remove('hidden');
            } catch (err) {
                alertBox.textContent = err.message;
                alertBox.className = "p-3.5 rounded-xl text-xs bg-red-50 text-red-700 border border-red-100";
                alertBox.classList.remove('hidden');
            }
        }

        function initializeDashboard() {
            document.getElementById('auth-view').classList.add('hidden');
            document.getElementById('app-view').classList.remove('hidden');
            document.getElementById('header-user-name').textContent = currentSessionUser.name;
            document.getElementById('header-user-role').textContent = currentSessionUser.role;

            const isPrivileged = (currentSessionUser.role === 'CEO' || currentSessionUser.role === 'HR' || currentSessionUser.role === 'Director');
            if (isPrivileged) {
                document.getElementById('tab-btn-admin').classList.remove('hidden');
            }
            switchAppTab('recruiting');
        }

        function switchAppTab(tab) {
            activeAppTab = tab;
            document.getElementById('panel-recruiting').classList.add('hidden');
            document.getElementById('panel-grievance').classList.add('hidden');
            document.getElementById('panel-scheduler').classList.add('hidden');
            document.getElementById('panel-admin').classList.add('hidden');

            document.getElementById('tab-btn-recruiting').className = "flex-1 py-2 px-4 rounded-lg text-gray-500 hover:text-gray-900";
            document.getElementById('tab-btn-grievance').className = "flex-1 py-2 px-4 rounded-lg text-gray-500 hover:text-gray-900";
            document.getElementById('tab-btn-scheduler').className = "flex-1 py-2 px-4 rounded-lg text-gray-500 hover:text-gray-900";
            document.getElementById('tab-btn-admin').className = "flex-1 py-2 px-4 rounded-lg text-gray-500 hover:text-gray-900";

            if (tab === 'recruiting') {
                document.getElementById('panel-recruiting').classList.remove('hidden');
                document.getElementById('tab-btn-recruiting').className = "flex-1 py-2 px-4 rounded-lg bg-gray-950 text-white font-bold";
            } else if (tab === 'grievance') {
                document.getElementById('panel-grievance').classList.remove('hidden');
                document.getElementById('tab-btn-grievance').className = "flex-1 py-2 px-4 rounded-lg bg-gray-950 text-white font-bold";
            } else if (tab === 'scheduler') {
                document.getElementById('panel-scheduler').classList.remove('hidden');
                document.getElementById('tab-btn-scheduler').className = "flex-1 py-2 px-4 rounded-lg bg-gray-950 text-white font-bold";
            } else {
                document.getElementById('panel-admin').classList.remove('hidden');
                document.getElementById('tab-btn-admin').className = "flex-1 py-2 px-4 rounded-lg bg-gray-950 text-white font-bold";
            }
        }

        async function handleLogout() {
            await fetch('auth.php?action=logout');
            currentSessionUser = null;
            document.getElementById('app-view').classList.add('hidden');
            document.getElementById('auth-view').classList.remove('hidden');
        }
    </script>
</body>
</html>
