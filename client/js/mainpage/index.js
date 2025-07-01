// Mute Toggle Script: Toggles background video sound and updates icon
function toggleMute() {
  const video = document.getElementById('bgVideo');
  const icon = document.getElementById('muteIcon');
  video.muted = !video.muted;
  icon.className = video.muted ? 'bi bi-volume-mute-fill' : 'bi bi-volume-up-fill';
}

// Password Visibility Toggle: Toggles input type and eye icon for password fields
function togglePassword(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  const isHidden = input.type === "password";
  input.type = isHidden ? "text" : "password";
  icon.classList.toggle("bi-eye", !isHidden);
  icon.classList.toggle("bi-eye-slash", isHidden);
}

// Show Login Modal: Displays the login modal and overlay
document.getElementById("showLoginBtn").addEventListener("click", () => {
  document.getElementById("loginContainer").style.display = "flex";
  document.getElementById("overlay").style.display = "block";
  document.body.style.overflow = "hidden"; // Prevents background scrolling

  // Show login box and hide signup box
  document.getElementById("loginBox").classList.add("show");
  document.getElementById("signupBox").classList.remove("show");
  document.getElementById("signupBox").style.display = "none";
  document.getElementById("loginBox").style.display = "block";
});

// Switch to Sign Up: Animates to show the sign-up box
document.getElementById("toSignup").addEventListener("click", () => {
  document.getElementById("loginBox").classList.remove("show");
  document.getElementById("signupBox").classList.add("show");
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("signupBox").style.display = "block";
});

// Switch to Login: Animates to show the login box
document.getElementById("toLogin").addEventListener("click", () => {
  document.getElementById("signupBox").classList.remove("show");
  document.getElementById("loginBox").classList.add("show");
  document.getElementById("signupBox").style.display = "none";
  document.getElementById("loginBox").style.display = "block";
});

// Close Modal: Hides both login and signup modals and the overlay
function closeModal() {
  document.getElementById("loginContainer").style.display = "none";
  document.getElementById("overlay").style.display = "none";

  // Hide all modals
  const modals = ["loginBox", "signupBox", "otpBox"];
  modals.forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove("show");
    el.style.display = "none";
  });

  document.body.style.overflow = ""; // Restore scroll
}

// DOM Loaded: Runs after HTML is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // SIGNUP FORM VALIDATION
  const signupForm = document.getElementById("signupForm");

  if (signupForm) {
    signupForm.addEventListener("submit", function (e) {
      const name = document.getElementById("signupName").value.trim();
      const email = document.getElementById("signupEmail").value.trim();
      const birthday = document.getElementById("signupBirthday").value.trim();
      const password = document.getElementById("signupPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      const passwordInput = document.getElementById("signupPassword");
      const confirmInput = document.getElementById("confirmPassword");

      // Check if any field is empty
      if (!name || !email || !birthday || !password || !confirmPassword) {
        e.preventDefault();
        alert("Please fill in all fields.");
        return;
      }

      // Check if passwords match
      if (password !== confirmPassword) {
        e.preventDefault();
        alert("Passwords do not match!");
        passwordInput.classList.add("is-invalid");
        confirmInput.classList.add("is-invalid");
        return;
      }

      // On success, reset error states and close modal
      passwordInput.classList.remove("is-invalid");
      confirmInput.classList.remove("is-invalid");
      alert("Signup successful!");
      closeModal();
    });

    // Remove red border when editing confirm password
    document.getElementById("confirmPassword").addEventListener("input", function () {
      this.classList.remove("is-invalid");
    });
  }

  // LIVE PASSWORD MATCH FEEDBACK
  const confirmInput = document.getElementById('confirmPassword');
  if (confirmInput) {
    confirmInput.addEventListener('input', function () {
      const password = document.getElementById('signupPassword').value;
      // Add red border if mismatch
      if (this.value !== password) {
        this.classList.add('is-invalid');
      } else {
        this.classList.remove('is-invalid');
      }
    });
  }
});

// CONNECT FRONTEND WITH BACKEND

// handle login form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    console.log("Login response:", data);

    if (res.ok && data.message === "OTP sent to email") {
      sessionStorage.setItem('pendingEmail', email);
      document.getElementById("loginBox").classList.remove("show");
      document.getElementById("loginBox").style.display = "none";

      const otpBox = document.getElementById("otpBox");
      otpBox.style.display = "block";
      setTimeout(() => otpBox.classList.add("show"), 50);
    } else {
      alert(data.message || 'Invalid login.');
    }

  } catch (err) {
    console.error('Login error:', err);
    alert('Network error.');
  }
});

// handle OTP form submission
document.getElementById('otpForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = sessionStorage.getItem('pendingEmail');
  const otp = document.getElementById('otpCode').value.trim();

  try {
    const res = await fetch('http://localhost:3000/auth/verify-login-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, otp })
    });

    const data = await res.json();

    if (res.ok && data.user && data.token) {
      localStorage.setItem('token', data.token);
      closeModal();

      const role = data.user.role;
      if (role === 'admin') {
        window.location.href = '/client/pages/admin/client.html';
      } else if (role === 'editor') {
        window.location.href = '/client/pages/editor/about.html';
      } else if (role === 'superadmin') {
        window.location.href = '/client/pages/superadmin/superadmin.html';
      } else if (role === 'client') {
        window.location.href = '/client/pages/studentApplication/studentApplication.html';
      }
    } else {
      alert(data.message || 'OTP verification failed.');
    }

  } catch (err) {
    console.error('OTP error:', err);
    alert('Network error.');
  }
});

// handle signup form submission
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const full_name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const birthdate = document.getElementById('signupBirthday').value;
  const password = document.getElementById('signupPassword').value;
  const confirm = document.getElementById('confirmPassword').value;

  if (password !== confirm) {
    alert('Passwords do not match.');
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name, email, birthdate, password })
    });

    const text = await res.text(); // 👈 Fetch plain text first
    let data;

    try {
      data = JSON.parse(text); // 👈 Try converting to JSON
    } catch {
      throw new Error('Invalid JSON response from server.');
    }

    if (res.ok) {
      alert(data.message || 'Signup successful!');
    } else {
      alert(data.error || data.message || 'Signup failed.');
    }
  } catch (err) {
    console.error('Fetch error:', err); // 👀 See details in browser console
    alert('Network or server error.');
  }
});

