// ============================================================
// SportSync – Shared Utilities
// API helpers, auth state, navigation, toast notifications
// ============================================================

const App = {
    user: null,

    // Initialize app
    async init() {
        await this.checkAuth();
        this.setupNavigation();
    },

    // Check if user is logged in
    async checkAuth() {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                this.user = data.user;
                return true;
            }
        } catch (e) { }
        this.user = null;
        return false;
    },

    // Setup navigation bar based on user role
    setupNavigation() {
        const nav = document.getElementById('main-nav');
        if (!nav) return;

        if (!this.user) {
            nav.innerHTML = `
        <a href="/" class="active">🏠 Home</a>
      `;
            return;
        }

        const role = this.user.role;
        let links = '';

        if (role === 'player') {
            links = `
        <a href="/dashboard" id="nav-dashboard">📊 Dashboard</a>
        <a href="/book-venue" id="nav-booking">🏟️ Book Venue</a>
        <a href="/find-match" id="nav-match">⚔️ Find Match</a>
        <a href="/leaderboard" id="nav-leaderboard">🏆 Leaderboard</a>
        <a href="/reviews" id="nav-reviews">⭐ Reviews</a>
      `;
        } else if (role === 'venue_manager') {
            links = `
        <a href="/venue-dashboard" id="nav-venue-dash">📊 Dashboard</a>
        <a href="/leaderboard" id="nav-leaderboard">🏆 Leaderboard</a>
        <a href="/reviews" id="nav-reviews">⭐ Reviews</a>
      `;
        } else if (role === 'admin') {
            links = `
        <a href="/admin" id="nav-admin">🛡️ Admin Panel</a>
        <a href="/leaderboard" id="nav-leaderboard">🏆 Leaderboard</a>
        <a href="/reviews" id="nav-reviews">⭐ Reviews</a>
      `;
        }

        nav.innerHTML = links;

        // Highlight active page
        const current = window.location.pathname;
        nav.querySelectorAll('a').forEach(a => {
            if (a.getAttribute('href') === current) {
                a.classList.add('active');
            }
        });

        // Update user section
        const userSection = document.getElementById('user-section');
        if (userSection && this.user) {
            const initials = this.user.name.split(' ').map(n => n[0]).join('').toUpperCase();
            userSection.innerHTML = `
        <span class="user-name">${this.user.name}</span>
        <div class="user-avatar">${initials}</div>
        <button class="btn btn-sm btn-secondary" onclick="App.logout()">Logout</button>
      `;
        }
    },

    // Logout
    async logout() {
        await fetch('/api/auth/logout');
        window.location.href = '/';
    },

    // API Helper
    async api(url, options = {}) {
        try {
            const res = await fetch(url, {
                headers: { 'Content-Type': 'application/json', ...options.headers },
                ...options
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Request failed');
            return data;
        } catch (err) {
            throw err;
        }
    },

    // Toast notification
    toast(message, type = 'info') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => toast.remove(), 4000);
    },

    // Get rating tier
    getRatingTier(rating) {
        if (rating >= 2000) return { name: 'Elite', class: 'tier-elite' };
        if (rating >= 1700) return { name: 'Pro', class: 'tier-pro' };
        if (rating >= 1400) return { name: 'Advanced', class: 'tier-advanced' };
        if (rating >= 1000) return { name: 'Intermediate', class: 'tier-intermediate' };
        return { name: 'Beginner', class: 'tier-beginner' };
    },

    // Format date
    formatDate(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    },

    // Format time
    formatTime(timeStr) {
        if (!timeStr) return '';
        const parts = timeStr.split(':');
        const h = parseInt(parts[0]);
        const m = parts[1];
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${m} ${ampm}`;
    },

    // Render stars
    renderStars(rating, interactive = false, containerId = '') {
        let html = '<div class="stars">';
        for (let i = 1; i <= 5; i++) {
            if (interactive) {
                html += `<span class="star ${i <= rating ? 'filled' : ''}" data-rating="${i}" onclick="setRating(${i}, '${containerId}')">★</span>`;
            } else {
                html += `<span class="star ${i <= rating ? 'filled' : ''}">★</span>`;
            }
        }
        html += '</div>';
        return html;
    },

    // Get result badge
    getResultBadge(result) {
        const badges = {
            'player1_win': '<span class="badge badge-green">P1 Win</span>',
            'player2_win': '<span class="badge badge-blue">P2 Win</span>',
            'draw': '<span class="badge badge-orange">Draw</span>',
            'pending': '<span class="badge badge-purple">Pending</span>'
        };
        return badges[result] || result;
    },

    // Get status badge
    getStatusBadge(status) {
        const badges = {
            'confirmed': '<span class="badge badge-green">Confirmed</span>',
            'cancelled': '<span class="badge badge-red">Cancelled</span>',
            'completed': '<span class="badge badge-blue">Completed</span>',
            'pending': '<span class="badge badge-orange">Pending</span>',
            'scheduled': '<span class="badge badge-cyan">Scheduled</span>',
            'in_progress': '<span class="badge badge-purple">In Progress</span>'
        };
        return badges[status] || status;
    },

    // Require auth - redirect if not logged in
    requireAuth() {
        if (!this.user) {
            window.location.href = '/';
            return false;
        }
        return true;
    }
};
