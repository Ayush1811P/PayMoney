/**
 * Authentication functionality for the PayMoney application (Direct Database Auth)
 */

document.addEventListener('DOMContentLoaded', async function() {
  // Redirect if already logged in
  if (await redirectIfLoggedIn()) return;
  
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
    
    // Initialize password visibility toggles
    const toggleButtons = document.querySelectorAll('.toggle-password-btn');
    toggleButtons.forEach(btn => {
      btn.addEventListener('click', function() {
        const container = this.closest('.password-input-container');
        if (!container) return;
        
        const input = container.querySelector('input');
        const eyeOpen = this.querySelector('.eye-open');
        const eyeClosed = this.querySelector('.eye-closed');
        
        if (input && eyeOpen && eyeClosed) {
          if (input.type === 'password') {
            input.type = 'text';
            eyeOpen.style.display = 'none';
            eyeClosed.style.display = 'block';
          } else {
            input.type = 'password';
            eyeOpen.style.display = 'block';
            eyeClosed.style.display = 'none';
          }
        }
      });
    });
  }
  
  // Register form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
    
    // Initialize password toggles inside registerForm
    const toggleButtonsReg = registerForm.querySelectorAll('.toggle-password-btn');
    toggleButtonsReg.forEach(btn => {
      btn.addEventListener('click', function() {
        const container = this.closest('.password-input-container');
        if (!container) return;
        
        const input = container.querySelector('input');
        const eyeOpen = this.querySelector('.eye-open');
        const eyeClosed = this.querySelector('.eye-closed');
        
        if (input && eyeOpen && eyeClosed) {
          if (input.type === 'password') {
            input.type = 'text';
            eyeOpen.style.display = 'none';
            eyeClosed.style.display = 'block';
          } else {
            input.type = 'password';
            eyeOpen.style.display = 'block';
            eyeClosed.style.display = 'none';
          }
        }
      });
    });

    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    
    if (password && confirmPassword) {
      confirmPassword.addEventListener('input', function() {
        if (password.value !== confirmPassword.value) {
          confirmPassword.setCustomValidity('Passwords do not match');
        } else {
          confirmPassword.setCustomValidity('');
        }
      });
    }
    
    // Terms modal logic
    const termsModal = document.getElementById('termsModal');
    const viewTermsLink = document.getElementById('viewTermsLink');
    const closeTermsBtn = document.getElementById('closeTermsBtn');
    const acceptTermsBtn = document.getElementById('acceptTermsBtn');
    const termsAgreeCheckbox = document.getElementById('termsAgree');
    
    if (viewTermsLink && termsModal) {
      viewTermsLink.addEventListener('click', function(e) {
        e.preventDefault();
        termsModal.style.display = 'block';
      });
    }
    
    if (closeTermsBtn && termsModal) {
      closeTermsBtn.addEventListener('click', function() {
        termsModal.style.display = 'none';
      });
    }
    
    if (acceptTermsBtn && termsModal) {
      acceptTermsBtn.addEventListener('click', function() {
        termsModal.style.display = 'none';
        if (termsAgreeCheckbox) {
          termsAgreeCheckbox.checked = true;
        }
      });
    }
    
    // Close modal if clicking outside content
    window.addEventListener('click', function(e) {
      if (e.target === termsModal) {
        termsModal.style.display = 'none';
      }
    });
  }
});

// Handle login form submission
async function handleLogin(e) {
  e.preventDefault();
  
  const loginId = document.getElementById('loginId').value.trim(); // Phone number
  const password = document.getElementById('loginPassword').value;
  
  if (!loginId || !password) {
    showNotification('Please enter all fields', 'error');
    return;
  }
  
  if (!validatePhone(loginId)) {
    showNotification('Please enter a valid 10-digit phone number', 'error');
    return;
  }
  
  // Hash the entered password to compare with the DB
  const hashedPassword = await hashPassword(password);
  
  // Authenticate using database lookup
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('phone', loginId)
    .single();
    
  if (error || !data) {
    showNotification('Invalid phone number or password', 'error');
    return;
  }
  
  if (data.password_hash !== hashedPassword) {
    showNotification('Invalid phone number or password', 'error');
    return;
  }
  
  // Save user ID to localStorage session
  localStorage.setItem('paymoney_user_id', data.id);
  
  showNotification('Login successful! Redirecting...');
  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 1500);
}

// Handle register form submission
async function handleRegister(e) {
  e.preventDefault();
  
<<<<<<< HEAD
  try {
    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const termsAgree = document.getElementById('termsAgree').checked;
    
    if (!fullName || !phone || !password || !confirmPassword) {
      showNotification('Please fill in all fields', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }
    
    if (!validatePhone(phone)) {
      showNotification('Please enter a valid 10-digit phone number', 'error');
      return;
    }
    
    if (password.length <= 5) {
      showNotification('Password must be greater than 5 digits', 'error');
      return;
    }
    
    if (!termsAgree) {
      showNotification('Please agree to the terms and conditions', 'error');
      return;
    }
    
    // Check if phone number is already registered
    const { data: existingUser, error: checkError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();
      
    if (existingUser) {
      showNotification('This phone number is already registered', 'error');
      return;
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Insert profile data directly into profiles table
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .insert([
        { 
          full_name: fullName, 
          phone: phone,
          password_hash: hashedPassword,
          wallet_balance: 10000.00 // Default starter balance
        }
      ])
      .select();
        
    if (profileError) {
      console.error(profileError);
      showNotification('Registration failed: ' + profileError.message, 'error');
      return;
    }
    
    if (profileData && profileData[0]) {
      // Save user ID to localStorage session
      localStorage.setItem('paymoney_user_id', profileData[0].id);
      showNotification('Registration successful! Redirecting...');
      
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
    }
  } catch (error) {
    alert("Caught Error: " + error.name + " - " + error.message);
    console.error(error);
=======
  const fullName = document.getElementById('fullName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const termsAgree = document.getElementById('termsAgree').checked;
  
  if (!fullName || !phone || !password || !confirmPassword) {
    showNotification('Please fill in all fields', 'error');
    return;
  }
  
  if (password !== confirmPassword) {
    showNotification('Passwords do not match', 'error');
    return;
  }
  
  if (!validatePhone(phone)) {
    showNotification('Please enter a valid 10-digit phone number', 'error');
    return;
  }
  
  if (password.length <= 5) {
    showNotification('Password must be greater than 5 digits', 'error');
    return;
  }
  
  if (!termsAgree) {
    showNotification('Please agree to the terms and conditions', 'error');
    return;
  }
  
  // Check if phone number is already registered
  const { data: existingUser, error: checkError } = await supabaseClient
    .from('profiles')
    .select('id')
    .eq('phone', phone)
    .maybeSingle();
    
  if (existingUser) {
    showNotification('This phone number is already registered', 'error');
    return;
  }
  
  // Hash password
  const hashedPassword = await hashPassword(password);
  
  // Insert profile data directly into profiles table
  const { data: profileData, error: profileError } = await supabaseClient
    .from('profiles')
    .insert([
      { 
        full_name: fullName, 
        phone: phone,
        password_hash: hashedPassword,
        wallet_balance: 10000.00 // Default starter balance
      }
    ])
    .select();
      
  if (profileError) {
    console.error(profileError);
    showNotification('Registration failed: ' + profileError.message, 'error');
    return;
  }
  
  if (profileData && profileData[0]) {
    // Save user ID to localStorage session
    localStorage.setItem('paymoney_user_id', profileData[0].id);
    showNotification('Registration successful! Redirecting...');
    
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
>>>>>>> 4d1f15da979bd23d8c97cb541c86049cef02d499
  }
}