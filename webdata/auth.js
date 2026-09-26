/**
 * auth.js — HaUI HomeFinder Authentication System
 * Hỗ trợ Đăng nhập / Đăng ký / 1-Click Demo Login cho Sinh viên, Chủ trọ, Admin
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'haui_auth_user';
  const TOKEN_KEY = 'haui_auth_token';

  // State
  let currentUser = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) currentUser = JSON.parse(raw);
  } catch (e) {
    currentUser = null;
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // STYLES CHO MODAL & USER DROPDOWN
  // ═════════════════════════════════════════════════════════════════════════════
  const authStyles = `
    /* Auth Modal Backdrop */
    .auth-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.25s ease, visibility 0.25s ease;
    }
    .auth-modal-backdrop.open {
      opacity: 1;
      visibility: visible;
    }
    
    /* Modal Card */
    .auth-modal-card {
      background: #ffffff;
      width: 100%;
      max-width: 460px;
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8);
      overflow: hidden;
      transform: scale(0.95) translateY(10px);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }
    .auth-modal-backdrop.open .auth-modal-card {
      transform: scale(1) translateY(0);
    }

    /* Modal Header */
    .auth-modal-header {
      padding: 1.5rem 1.5rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #f1f5f9;
      position: relative;
    }
    .auth-brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .auth-modal-close {
      background: #f1f5f9;
      border: none;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #64748b;
      transition: all 0.15s ease;
    }
    .auth-modal-close:hover {
      background: #e2e8f0;
      color: #0f172a;
      transform: rotate(90deg);
    }

    /* Quick Demo Login Section */
    .auth-quick-demo {
      background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
      padding: 0.85rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .auth-quick-title {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #1e40af;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .auth-quick-buttons {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }
    .btn-quick-role {
      border: 1px solid #cbd5e1;
      background: #ffffff;
      padding: 0.45rem 0.25rem;
      border-radius: 10px;
      font-size: 0.72rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
      transition: all 0.15s ease;
    }
    .btn-quick-role:hover {
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);
    }

    /* Modal Body & Tabs */
    .auth-modal-body {
      padding: 1.25rem 1.5rem 1.5rem;
      overflow-y: auto;
    }
    .auth-tabs {
      display: flex;
      background: #f1f5f9;
      padding: 4px;
      border-radius: 12px;
      margin-bottom: 1.25rem;
    }
    .auth-tab-btn {
      flex: 1;
      border: none;
      background: transparent;
      padding: 0.6rem 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .auth-tab-btn.active {
      background: #ffffff;
      color: #0f172a;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    }

    /* Forms */
    .auth-form-group {
      margin-bottom: 1rem;
    }
    .auth-label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 0.4rem;
    }
    .auth-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .auth-input {
      width: 100%;
      padding: 0.7rem 0.9rem;
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.9rem;
      color: #0f172a;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .auth-input:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }
    .auth-input-eye {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 1rem;
    }

    .auth-radio-group {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.25rem;
    }
    .auth-radio-btn {
      flex: 1;
      padding: 0.6rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      background: #f8fafc;
      font-size: 0.8rem;
      font-weight: 600;
      text-align: center;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .auth-radio-btn.selected {
      border-color: #2563eb;
      background: #eff6ff;
      color: #1d4ed8;
    }

    .btn-auth-submit {
      width: 100%;
      padding: 0.8rem;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #ffffff;
      border: none;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      margin-top: 0.5rem;
    }
    .btn-auth-submit:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
    }
    .btn-auth-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    /* Auth Toast Alert */
    .auth-toast {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 100000;
      background: #0f172a;
      color: white;
      padding: 0.85rem 1.25rem;
      border-radius: 12px;
      font-size: 0.88rem;
      font-weight: 500;
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      gap: 0.6rem;
      transform: translateY(-20px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
    }
    .auth-toast.show {
      transform: translateY(0);
      opacity: 1;
      pointer-events: auto;
    }
    .auth-toast.success {
      background: #065f46;
      border-left: 4px solid #10b981;
    }
    .auth-toast.error {
      background: #991b1b;
      border-left: 4px solid #ef4444;
    }

    /* User Profile Pill in Navbar */
    .user-nav-profile {
      position: relative;
      display: inline-block;
    }
    .user-profile-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      padding: 0.35rem 0.75rem 0.35rem 0.4rem;
      border-radius: 9999px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .user-profile-btn:hover {
      border-color: #cbd5e1;
      background: #f8fafc;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .user-avatar-img {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #e2e8f0;
      object-fit: cover;
    }
    .user-info-text {
      text-align: left;
      line-height: 1.2;
    }
    .user-display-name {
      font-size: 0.82rem;
      font-weight: 600;
      color: #0f172a;
      max-width: 130px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-role-tag {
      font-size: 0.68rem;
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .user-role-tag.admin { color: #dc2626; }
    .user-role-tag.landlord { color: #059669; }

    /* User Dropdown Menu */
    .user-dropdown-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 250px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.15);
      padding: 0.5rem;
      z-index: 9999;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-8px);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .user-dropdown-menu.open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    .user-dropdown-header {
      padding: 0.75rem 0.75rem 0.5rem;
      border-bottom: 1px solid #f1f5f9;
      margin-bottom: 0.35rem;
    }
    .user-dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.6rem 0.75rem;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 500;
      color: #334155;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.15s;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
    }
    .user-dropdown-item:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .user-dropdown-item.danger {
      color: #dc2626;
    }
    .user-dropdown-item.danger:hover {
      background: #fef2f2;
    }
  `;

  // Thêm styles vào <head>
  const styleEl = document.createElement('style');
  styleEl.innerHTML = authStyles;
  document.head.appendChild(styleEl);

  // ═════════════════════════════════════════════════════════════════════════════
  // TOAST NOTIFICATION
  // ═════════════════════════════════════════════════════════════════════════════
  function showToast(msg, type = 'info') {
    let toast = document.getElementById('auth-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'auth-toast';
      toast.className = 'auth-toast';
      document.body.appendChild(toast);
    }
    toast.className = `auth-toast ${type} show`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span>${msg}</span>
    `;
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // MODAL CREATION & CONTROLS
  // ═════════════════════════════════════════════════════════════════════════════
  let activeTab = 'login';
  let registerRole = 'student';

  function createModal() {
    if (document.getElementById('auth-modal-root')) return;

    const modalWrap = document.createElement('div');
    modalWrap.id = 'auth-modal-root';
    modalWrap.className = 'auth-modal-backdrop';
    modalWrap.innerHTML = `
      <div class="auth-modal-card" id="auth-modal-card" onclick="event.stopPropagation()">
        <!-- Header -->
        <div class="auth-modal-header">
          <div class="auth-brand-badge">
            <img src="logo.png" onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Haui_logo.png/200px-Haui_logo.png'" style="width:28px;height:28px;border-radius:6px;object-fit:cover;" />
            <div>
              <div style="font-weight:700;font-size:0.95rem;color:#0f172a;line-height:1.2;">HaUI HomeFinder</div>
              <div style="font-size:0.75rem;color:#64748b;">Đăng nhập hệ thống nhà trọ</div>
            </div>
          </div>
          <button class="auth-modal-close" id="btn-close-auth" title="Đóng">&times;</button>
        </div>

        <!-- 1-Click Fast Demo Login -->
        <div class="auth-quick-demo">
          <div class="auth-quick-title">⚡ Đăng nhập thử nghiệm 1-Click:</div>
          <div class="auth-quick-buttons">
            <button class="btn-quick-role" id="demo-student-btn" title="Đăng nhập Sinh viên thử nghiệm">
              <span>🎓</span>
              <span>Sinh viên</span>
            </button>
            <button class="btn-quick-role" id="demo-host-btn" title="Đăng nhập Chủ trọ thử nghiệm">
              <span>🏠</span>
              <span>Chủ trọ</span>
            </button>
            <button class="btn-quick-role" id="demo-admin-btn" title="Đăng nhập Quản trị viên thử nghiệm">
              <span>🛡️</span>
              <span>Admin</span>
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="auth-modal-body">
          <!-- Tabs -->
          <div class="auth-tabs">
            <button class="auth-tab-btn active" id="tab-login-btn">Đăng nhập</button>
            <button class="auth-tab-btn" id="tab-register-btn">Đăng ký mới</button>
          </div>

          <!-- LOGIN FORM -->
          <form id="auth-login-form" onsubmit="return false;">
            <div class="auth-form-group">
              <label class="auth-label">Email hoặc Số điện thoại</label>
              <div class="auth-input-wrap">
                <input type="text" class="auth-input" id="login-identifier" placeholder="vd: student@haui.edu.vn hoặc 0912..." required />
              </div>
            </div>

            <div class="auth-form-group">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">
                <label class="auth-label" style="margin:0;">Mật khẩu</label>
                <a href="#" id="auth-forgot-pass" style="font-size:0.75rem;color:#2563eb;text-decoration:none;">Quên mật khẩu?</a>
              </div>
              <div class="auth-input-wrap">
                <input type="password" class="auth-input" id="login-password" placeholder="Nhập mật khẩu" required />
                <button type="button" class="auth-input-eye" id="toggle-login-pass">👁️</button>
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1.25rem;">
              <input type="checkbox" id="login-remember" checked style="accent-color:#2563eb;width:15px;height:15px;" />
              <label for="login-remember" style="font-size:0.8rem;color:#64748b;cursor:pointer;">Ghi nhớ đăng nhập trên thiết bị này</label>
            </div>

            <button type="submit" class="btn-auth-submit" id="btn-submit-login">
              Đăng nhập ngay
            </button>
          </form>

          <!-- REGISTER FORM -->
          <form id="auth-register-form" style="display:none;" onsubmit="return false;">
            <div class="auth-form-group">
              <label class="auth-label">Bạn là:</label>
              <div class="auth-radio-group">
                <div class="auth-radio-btn selected" id="role-select-student">🎓 Sinh viên HaUI</div>
                <div class="auth-radio-btn" id="role-select-landlord">🏠 Chủ trọ / Cho thuê</div>
              </div>
            </div>

            <div class="auth-form-group">
              <label class="auth-label">Họ và tên</label>
              <input type="text" class="auth-input" id="reg-name" placeholder="Nguyễn Văn A" required />
            </div>

            <div class="auth-form-group" id="reg-studentid-group">
              <label class="auth-label">Mã sinh viên & Cơ sở</label>
              <div style="display:flex;gap:0.5rem;">
                <input type="text" class="auth-input" id="reg-studentid" placeholder="Mã SV (vd: 202360...)" style="flex:1;" />
                <select class="auth-input" id="reg-campus" style="width:110px;">
                  <option value="CS1">CS1 (Nhổn)</option>
                  <option value="CS2">CS2 (Tây Tựu)</option>
                  <option value="CS3">CS3 (Hà Nam)</option>
                </select>
              </div>
            </div>

            <div class="auth-form-group">
              <label class="auth-label">Email</label>
              <input type="email" class="auth-input" id="reg-email" placeholder="example@haui.edu.vn" required />
            </div>

            <div class="auth-form-group">
              <label class="auth-label">Số điện thoại</label>
              <input type="tel" class="auth-input" id="reg-phone" placeholder="0987654321" required />
            </div>

            <div class="auth-form-group">
              <label class="auth-label">Mật khẩu</label>
              <input type="password" class="auth-input" id="reg-password" placeholder="Tối thiểu 6 ký tự" required />
            </div>

            <button type="submit" class="btn-auth-submit" id="btn-submit-register">
              Tạo tài khoản
            </button>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modalWrap);

    // Event Listeners bên trong Modal
    modalWrap.addEventListener('click', closeAuthModal);
    document.getElementById('btn-close-auth').addEventListener('click', closeAuthModal);

    // Toggle Password Visibility
    document.getElementById('toggle-login-pass').addEventListener('click', () => {
      const inp = document.getElementById('login-password');
      inp.type = inp.type === 'password' ? 'text' : 'password';
    });

    // Tab switching
    const tabLogin = document.getElementById('tab-login-btn');
    const tabReg = document.getElementById('tab-register-btn');
    const formLogin = document.getElementById('auth-login-form');
    const formReg = document.getElementById('auth-register-form');

    tabLogin.addEventListener('click', () => {
      activeTab = 'login';
      tabLogin.classList.add('active');
      tabReg.classList.remove('active');
      formLogin.style.display = 'block';
      formReg.style.display = 'none';
    });

    tabReg.addEventListener('click', () => {
      activeTab = 'register';
      tabReg.classList.add('active');
      tabLogin.classList.remove('active');
      formLogin.style.display = 'none';
      formReg.style.display = 'block';
    });

    // Role selection in Register
    const roleStu = document.getElementById('role-select-student');
    const roleHost = document.getElementById('role-select-landlord');
    const stuGroup = document.getElementById('reg-studentid-group');

    roleStu.addEventListener('click', () => {
      registerRole = 'student';
      roleStu.classList.add('selected');
      roleHost.classList.remove('selected');
      stuGroup.style.display = 'block';
    });

    roleHost.addEventListener('click', () => {
      registerRole = 'landlord';
      roleHost.classList.add('selected');
      roleStu.classList.remove('selected');
      stuGroup.style.display = 'none';
    });

    // 1-Click Fast Demo Login Buttons
    document.getElementById('demo-student-btn').addEventListener('click', () => {
      quickLogin('student@haui.edu.vn', '123');
    });
    document.getElementById('demo-host-btn').addEventListener('click', () => {
      quickLogin('chutro@gmail.com', '123');
    });
    document.getElementById('demo-admin-btn').addEventListener('click', () => {
      quickLogin('admin@haui.edu.vn', 'admin');
    });

    // Forgot password
    document.getElementById('auth-forgot-pass').addEventListener('click', (e) => {
      e.preventDefault();
      alert('Vui lòng liên hệ Văn phòng Đoàn Thanh niên / Quản trị viên hệ thống (admin@haui.edu.vn) để khôi phục mật khẩu tài khoản trường HaUI.');
    });

    // Form Submit Handlers
    formLogin.addEventListener('submit', handleLoginSubmit);
    formReg.addEventListener('submit', handleRegisterSubmit);
  }

  function openAuthModal() {
    createModal();
    const modal = document.getElementById('auth-modal-root');
    if (modal) modal.classList.add('open');
    setTimeout(() => {
      const inp = document.getElementById('login-identifier');
      if (inp) inp.focus();
    }, 200);
  }

  function closeAuthModal() {
    const modal = document.getElementById('auth-modal-root');
    if (modal) modal.classList.remove('open');
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // LOGIN / REGISTER API LOGIC
  // ═════════════════════════════════════════════════════════════════════════════
  async function quickLogin(identifier, password) {
    const btn = document.getElementById('btn-submit-login');
    if (btn) btn.disabled = true;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại.');

      loginSuccess(data.user, data.token);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    const idVal = document.getElementById('login-identifier').value.trim();
    const passVal = document.getElementById('login-password').value;
    const btn = document.getElementById('btn-submit-login');

    if (!idVal || !passVal) {
      showToast('Vui lòng điền đủ thông tin đăng nhập', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Đang xác thực...';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: idVal, password: passVal })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại.');

      loginSuccess(data.user, data.token);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Đăng nhập ngay';
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;
    const studentId = document.getElementById('reg-studentid').value.trim();
    const campus = document.getElementById('reg-campus').value;
    const btn = document.getElementById('btn-submit-register');

    if (!name || !email || !password) {
      showToast('Vui lòng điền các thông tin bắt buộc', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Đang khởi tạo tài khoản...';

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, phone, password,
          role: registerRole,
          campus, studentId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Đăng ký thất bại.');

      loginSuccess(data.user, data.token);
      showToast('Đăng ký tài khoản thành công!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Tạo tài khoản';
    }
  }

  function loginSuccess(user, token) {
    currentUser = user;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    if (token) localStorage.setItem(TOKEN_KEY, token);

    closeAuthModal();
    showToast(`Đăng nhập thành công! Xin chào ${user.name}`, 'success');

    // Cập nhật giao diện thanh điều hướng
    updateNavbarUI();

    // Phát custom event cho các module khác
    window.dispatchEvent(new CustomEvent('haui_auth_change', { detail: { user } }));
  }

  function logout() {
    currentUser = null;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);

    updateNavbarUI();
    showToast('Đã đăng xuất tài khoản.', 'info');

    window.dispatchEvent(new CustomEvent('haui_auth_change', { detail: { user: null } }));
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // UPDATE NAVBAR UI & PHÂN QUYỀN HIỂN THỊ
  // ═════════════════════════════════════════════════════════════════════════════
  function updateNavbarUI() {
    const isAdmin = currentUser && currentUser.role === 'admin';
    const isLandlord = currentUser && currentUser.role === 'landlord';

    // 1. PHÂN QUYỀN ADMIN: Chỉ Quản trị viên mới được nhìn thấy link Quản trị Admin
    document.querySelectorAll('a[href="admin.html"]').forEach(link => {
      if (isAdmin) {
        link.style.removeProperty('display');
      } else {
        link.style.setProperty('display', 'none', 'important');
      }
    });

    const loginButtons = document.querySelectorAll('.btn-login');

    if (!currentUser) {
      // Trạng thái: Chưa đăng nhập
      loginButtons.forEach(btn => {
        btn.style.display = '';
        btn.onclick = (e) => {
          e.preventDefault();
          openAuthModal();
        };
      });

      // Xóa dropdown nếu có
      const existingProfiles = document.querySelectorAll('.user-nav-profile');
      existingProfiles.forEach(p => p.remove());
      return;
    }

    // Trạng thái: Đã đăng nhập
    loginButtons.forEach(btn => {
      btn.style.display = 'none';

      // Kiểm tra xem đã có profile container kế bên chưa
      let parent = btn.parentNode;
      let existing = parent.querySelector('.user-nav-profile');
      if (existing) existing.remove();

      const roleClass = currentUser.role === 'admin' ? 'admin' : (currentUser.role === 'landlord' ? 'landlord' : 'student');
      const roleText = currentUser.roleLabel || (currentUser.role === 'admin' ? 'Admin' : (currentUser.role === 'landlord' ? 'Chủ trọ' : 'Sinh viên'));

      const profileWrap = document.createElement('div');
      profileWrap.className = 'user-nav-profile';
      profileWrap.innerHTML = `
        <button class="user-profile-btn" id="user-menu-btn" title="Tài khoản: ${currentUser.name}">
          <img src="${currentUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(currentUser.name)}" class="user-avatar-img" alt="${currentUser.name}" />
          <div class="user-info-text">
            <div class="user-display-name">${currentUser.name}</div>
            <div class="user-role-tag ${roleClass}">${roleText}</div>
          </div>
          <span style="font-size:0.75rem;color:#64748b;margin-left:2px;">▼</span>
        </button>

        <div class="user-dropdown-menu" id="user-dropdown-menu">
          <div class="user-dropdown-header">
            <div style="font-weight:700;font-size:0.88rem;color:#0f172a;">${currentUser.name}</div>
            <div style="font-size:0.75rem;color:#64748b;">${currentUser.email || currentUser.phone || ''}</div>
          </div>

          <button class="user-dropdown-item" id="menu-view-profile">
            <span>👤</span> Thông tin tài khoản
          </button>

          <button class="user-dropdown-item" id="menu-view-saved">
            <span>❤️</span> Phòng đã lưu <span style="margin-left:auto;background:#e2e8f0;border-radius:10px;padding:1px 6px;font-size:0.7rem;">0</span>
          </button>

          ${isLandlord ? `
            <a href="landlord.html" class="user-dropdown-item" style="color:#059669;font-weight:700;">
              <span>🏠</span> Kênh Chủ trọ & Đăng tin
            </a>
          ` : ''}

          ${isAdmin ? `
            <a href="admin.html" class="user-dropdown-item" style="color:#dc2626;font-weight:700;">
              <span>🛡️</span> Bảng Quản trị Admin
            </a>
          ` : ''}

          <div style="border-top:1px solid #f1f5f9;margin:0.35rem 0;"></div>

          <button class="user-dropdown-item danger" id="menu-logout-btn">
            <span>🚪</span> Đăng xuất
          </button>
        </div>
      `;

      parent.appendChild(profileWrap);

      // Event toggle dropdown
      const menuBtn = profileWrap.querySelector('#user-menu-btn');
      const menu = profileWrap.querySelector('#user-dropdown-menu');

      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('open');
      });

      // Logout handler
      profileWrap.querySelector('#menu-logout-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.remove('open');
        logout();
      });

      // View Profile Info
      profileWrap.querySelector('#menu-view-profile').addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.remove('open');
        showUserProfileModal(currentUser);
      });

      // View Saved
      profileWrap.querySelector('#menu-view-saved').addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.remove('open');
        showToast('Chức năng danh sách phòng yêu thích đã sẵn sàng!', 'info');
      });

      // Landlord Post Room
      const postBtn = profileWrap.querySelector('#menu-landlord-post');
      if (postBtn) {
        postBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          menu.classList.remove('open');
          openLandlordPostModal();
        });
      }
    });
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // MODAL ĐĂNG PHÒNG TRỌ DÀNH RIÊNG CHO CHỦ TRỌ
  // ═════════════════════════════════════════════════════════════════════════════
  function createLandlordPostModal() {
    if (document.getElementById('landlord-post-modal-root')) return;

    const modalWrap = document.createElement('div');
    modalWrap.id = 'landlord-post-modal-root';
    modalWrap.className = 'auth-modal-backdrop';
    modalWrap.innerHTML = `
      <div class="auth-modal-card" style="max-width:520px;" onclick="event.stopPropagation()">
        <div class="auth-modal-header" style="background:#f0fdf4;">
          <div class="auth-brand-badge">
            <span style="font-size:1.5rem;">🏠</span>
            <div>
              <div style="font-weight:700;font-size:1rem;color:#065f46;">Đăng tin phòng trọ mới</div>
              <div style="font-size:0.75rem;color:#047857;">Dành riêng cho Chủ trọ đã xác thực</div>
            </div>
          </div>
          <button class="auth-modal-close" id="btn-close-landlord-post">&times;</button>
        </div>

        <form id="landlord-post-form" style="padding:1.25rem 1.5rem 1.5rem;overflow-y:auto;max-height:75vh;" onsubmit="return false;">
          <div class="auth-form-group">
            <label class="auth-label">Tiêu đề tin đăng (*)</label>
            <input type="text" class="auth-input" id="lp-title" placeholder="VD: Phòng khép kín full đồ ban công gần HaUI CS1" required />
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
            <div class="auth-form-group">
              <label class="auth-label">Giá thuê (VNĐ/tháng) (*)</label>
              <input type="number" class="auth-input" id="lp-price" placeholder="VD: 2500000" required />
            </div>
            <div class="auth-form-group">
              <label class="auth-label">Diện tích (m²)</label>
              <input type="number" class="auth-input" id="lp-area" placeholder="VD: 25" />
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
            <div class="auth-form-group">
              <label class="auth-label">Gần cơ sở HaUI (*)</label>
              <select class="auth-input" id="lp-campus">
                <option value="CS1">CS1 (Minh Khai - Nhổn)</option>
                <option value="CS2">CS2 (Tây Tựu)</option>
                <option value="CS3">CS3 (Hà Nam)</option>
              </select>
            </div>
            <div class="auth-form-group">
              <label class="auth-label">Số điện thoại liên hệ (*)</label>
              <input type="tel" class="auth-input" id="lp-phone" placeholder="098..." required />
            </div>
          </div>

          <div class="auth-form-group">
            <label class="auth-label">Địa chỉ chi tiết (*)</label>
            <input type="text" class="auth-input" id="lp-address" placeholder="VD: Ngõ 136 Cầu Diễn, Phường Minh Khai, Bắc Từ Liêm" required />
          </div>

          <div class="auth-form-group">
            <label class="auth-label">Mô tả phòng & Tiện ích</label>
            <textarea class="auth-input" id="lp-desc" rows="3" placeholder="Điều hòa, nóng lạnh, giờ giấc tự do, không chung chủ..."></textarea>
          </div>

          <button type="submit" class="btn-auth-submit" id="btn-submit-landlord-post" style="background:linear-gradient(135deg, #059669 0%, #047857 100%);">
            Đăng tin ngay
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(modalWrap);

    modalWrap.addEventListener('click', closeLandlordPostModal);
    document.getElementById('btn-close-landlord-post').addEventListener('click', closeLandlordPostModal);
    document.getElementById('landlord-post-form').addEventListener('submit', handleLandlordPostSubmit);
  }

  function openLandlordPostModal() {
    if (!currentUser || currentUser.role !== 'landlord') {
      showToast('Chỉ tài khoản Chủ trọ mới có quyền đăng tin phòng trọ!', 'error');
      openAuthModal();
      return;
    }
    createLandlordPostModal();
    const modal = document.getElementById('landlord-post-modal-root');
    if (modal) {
      modal.classList.add('open');
      if (currentUser.phone && document.getElementById('lp-phone')) {
        document.getElementById('lp-phone').value = currentUser.phone;
      }
    }
  }

  function closeLandlordPostModal() {
    const modal = document.getElementById('landlord-post-modal-root');
    if (modal) modal.classList.remove('open');
  }

  async function handleLandlordPostSubmit(e) {
    e.preventDefault();
    if (!currentUser || currentUser.role !== 'landlord') {
      showToast('Chỉ tài khoản Chủ trọ mới có quyền đăng tin phòng trọ!', 'error');
      return;
    }

    const tieu_de = document.getElementById('lp-title')?.value?.trim();
    const gia = document.getElementById('lp-price')?.value;
    const dien_tich = document.getElementById('lp-area')?.value;
    const co_so_gan_nhat = document.getElementById('lp-campus')?.value;
    const so_dien_thoai = document.getElementById('lp-phone')?.value?.trim() || currentUser.phone;
    const dia_chi = document.getElementById('lp-address')?.value?.trim();
    const mo_ta = document.getElementById('lp-desc')?.value?.trim();
    const btn = document.getElementById('btn-submit-landlord-post');

    if (!tieu_de || !gia || !dia_chi) {
      showToast('Vui lòng điền đủ Tiêu đề, Giá thuê và Địa chỉ!', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Đang đăng tin...';

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser.role
        },
        body: JSON.stringify({
          userRole: currentUser.role,
          ten_chu: currentUser.name,
          tieu_de,
          gia: Number(gia),
          dien_tich: Number(dien_tich) || 20,
          co_so_gan_nhat,
          so_dien_thoai,
          dia_chi,
          mo_ta
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể đăng phòng');

      showToast('Đăng tin phòng trọ mới thành công!', 'success');
      closeLandlordPostModal();
      document.getElementById('landlord-post-form').reset();

      // Nếu đang ở trang chủ, reload lại danh sách
      if (typeof loadRooms === 'function') loadRooms();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Đăng tin ngay';
    }
  }

  // Đóng dropdown khi click ra ngoài
  document.addEventListener('click', () => {
    document.querySelectorAll('.user-dropdown-menu.open').forEach(m => m.classList.remove('open'));
  });

  // Modal xem thông tin tài khoản
  function showUserProfileModal(user) {
    alert(`THÔNG TIN TÀI KHOẢN:\n\n• Họ tên: ${user.name}\n• Vai trò: ${user.roleLabel || user.role}\n• Email: ${user.email || 'Chưa cập nhật'}\n• Số điện thoại: ${user.phone || 'Chưa cập nhật'}${user.studentId ? '\n• Mã sinh viên: ' + user.studentId : ''}${user.campus ? '\n• Cơ sở: ' + user.campus : ''}`);
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═════════════════════════════════════════════════════════════════════════════
  function init() {
    createModal();
    updateNavbarUI();

    // Event delegation: Đảm bảo bất kỳ nút nào có class .btn-login được bấm đều mở Modal
    document.addEventListener('click', (e) => {
      const loginBtn = e.target.closest('.btn-login');
      if (loginBtn) {
        e.preventDefault();
        openAuthModal();
      }
    });

    // Đồng bộ giữa các tab trình duyệt
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        try {
          currentUser = e.newValue ? JSON.parse(e.newValue) : null;
          updateNavbarUI();
        } catch (_) {}
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose global methods
  window.HaUIAuth = {
    openModal: openAuthModal,
    closeModal: closeAuthModal,
    getCurrentUser: () => currentUser,
    logout: logout,
    quickLogin: quickLogin,
    openLandlordModal: openLandlordPostModal
  };
})();
