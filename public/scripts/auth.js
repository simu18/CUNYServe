// public/scripts/auth.js

document.addEventListener('DOMContentLoaded', () => {
  // ====== REQUEST SIGNUP FORM (STEP 1) ======
  const requestSignupForm = document.getElementById('request-signup-form');
  if (requestSignupForm) {
      requestSignupForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('email')?.value;
          const messageContainer = document.getElementById('message-container');

          try {
              const res = await fetch('/api/auth/request-signup', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email })
              });
              const data = await res.json();

              const messageClass = res.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
              if (messageContainer) {
                  messageContainer.innerHTML = `<div class="${messageClass} p-4 rounded">${data.msg}</div>`;
                  messageContainer.classList.remove('hidden');
              } else {
                  alert(data.msg);
              }

              if (res.ok) requestSignupForm.style.display = 'none';
          } catch (err) {
              if (messageContainer) {
                  messageContainer.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded">An error occurred. Please try again.</div>`;
                  messageContainer.classList.remove('hidden');
              } else {
                  alert('An error occurred. Please try again.');
              }
          }
      });
  }

//   

// ====== SIGNUP FORM (STEP 2) ======
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    const initializeStep2 = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        // Get references to the new UI elements
        const loader = document.querySelector('.text-center'); // Updated reference
        const mainContent = document.querySelector('#signup-form').parentElement;
        const messageContainer = document.createElement('div'); // We'll create a message container

        if (!token) {
            if (loader) {
                loader.innerHTML = '<p class="text-red-500 p-4 bg-red-100 rounded-lg">Error: No verification token found. Please start over.</p>';
            }
            return;
        }

        try {
            const res = await fetch('/api/auth/verify-signup-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            const data = await res.json();

            if (!res.ok) {
                if (loader) {
                    loader.innerHTML = `<p class="text-red-500 p-4 bg-red-100 rounded-lg">Error: ${data.msg}</p>`;
                }
                return;
            }

            // Prefill form
            const emailField = document.getElementById('email');
            const tokenField = document.getElementById('signup-token');
            if (emailField) emailField.value = data.email;
            if (tokenField) tokenField.value = token;
            
            // Hide loader and show form
            if (loader) loader.classList.add('hidden');
            if (mainContent) mainContent.classList.remove('hidden');
        } catch (err) {
            if (loader) {
                loader.innerHTML = '<p class="text-red-500 p-4 bg-red-100 rounded-lg">An error occurred. Please refresh and try again.</p>';
            }
        }
    };

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Create message container if it doesn't exist
        let messageContainer = document.getElementById('message-container');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'message-container';
            signupForm.parentNode.insertBefore(messageContainer, signupForm);
        }

        // Get campus value - handle "Other" option
        let campusValue = document.getElementById('campus').value;
        if (campusValue === 'Other') {
            campusValue = document.getElementById('other-campus').value;
        }

        const formData = {
            name: document.getElementById('name')?.value,
            password: document.getElementById('password')?.value,
            campus: campusValue,
            email: document.getElementById('email')?.value,
            token: document.getElementById('signup-token')?.value
        };

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (res.ok) {
                window.location.href = '/onboarding-orientation.html';
            } else {
                if (messageContainer) {
                    messageContainer.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded-lg mb-4">${data.msg}</div>`;
                    messageContainer.classList.remove('hidden');
                    
                    // Scroll to message
                    messageContainer.scrollIntoView({ behavior: 'smooth' });
                } else {
                    alert(data.msg);
                }
            }
        } catch (err) {
            if (messageContainer) {
                messageContainer.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded-lg mb-4">An error occurred. Please try again.</div>`;
                messageContainer.classList.remove('hidden');
            } else {
                alert('An error occurred. Please try again.');
            }
        }
    });

    // Add event listener for campus selection change
    document.getElementById('campus').addEventListener('change', function() {
        const otherCampusDiv = document.getElementById('otherCampusDiv');
        if (this.value === 'Other') {
            otherCampusDiv.classList.remove('hidden');
            document.getElementById('other-campus').setAttribute('required', 'true');
        } else {
            otherCampusDiv.classList.add('hidden');
            document.getElementById('other-campus').removeAttribute('required');
        }
    });

    // Password toggle functionality
    function togglePassword() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.querySelector('.password-toggle i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        } else {
            passwordInput.type = 'password';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        }
    }
    
    // Attach the toggle function to the eye icon
    const passwordToggle = document.querySelector('.password-toggle');
    if (passwordToggle) {
        passwordToggle.addEventListener('click', togglePassword);
    }

    initializeStep2();
}

  // ====== LOGIN FORM ======
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('email')?.value;
          const password = document.getElementById('password')?.value;
          const loginError = document.getElementById('loginError');

          try {
              const res = await fetch('/api/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, password })
              });
              const data = await res.json();

              if (res.ok) {
                  window.location.href = '/dashboard.html';
              } else {
                  const msg = data.msg || 'Login failed.';
                  if (loginError) {
                      loginError.textContent = msg;
                      loginError.classList.remove('hidden');
                  } else {
                      alert(msg);
                  }
              }
          } catch (err) {
              if (loginError) {
                  loginError.textContent = 'An error occurred. Please try again.';
                  loginError.classList.remove('hidden');
              } else {
                  alert('An error occurred. Please try again.');
              }
          }
      });
  }

  // ====== FORGOT PASSWORD FORM ======
  const forgotPasswordForm = document.getElementById('forgot-password-form');
  if (forgotPasswordForm) {
      forgotPasswordForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('email')?.value;
          const messageContainer = document.getElementById('message-container');

          try {
              const res = await fetch('/api/auth/forgotpassword', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email })
              });
              const data = await res.json();

              if (messageContainer) {
                  messageContainer.innerHTML = `<div class="bg-green-100 text-green-700 p-4 rounded">${data.msg}</div>`;
                  messageContainer.classList.remove('hidden');
              } else {
                  alert(data.msg);
              }
              forgotPasswordForm.reset();
          } catch (err) {
              if (messageContainer) {
                  messageContainer.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded">An error occurred. Please try again.</div>`;
                  messageContainer.classList.remove('hidden');
              } else {
                  alert('An error occurred. Please try again.');
              }
          }
      });
  }

  // ====== RESET PASSWORD FORM ======
  const resetPasswordForm = document.getElementById('reset-password-form');
  if (resetPasswordForm) {
      resetPasswordForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const password = document.getElementById('password')?.value;
          const confirmPassword = document.getElementById('confirmPassword')?.value;
          const messageContainer = document.getElementById('message-container');

          if (password !== confirmPassword) {
              if (messageContainer) {
                  messageContainer.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded">Passwords do not match.</div>`;
                  messageContainer.classList.remove('hidden');
              } else {
                  alert('Passwords do not match.');
              }
              return;
          }

          const urlParams = new URLSearchParams(window.location.search);
          const token = urlParams.get('token');
          if (!token) {
              if (messageContainer) {
                  messageContainer.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded">Invalid or missing reset token.</div>`;
                  messageContainer.classList.remove('hidden');
              } else {
                  alert('Invalid or missing reset token.');
              }
              return;
          }

          try {
              const res = await fetch(`/api/auth/resetpassword/${token}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ password })
              });
              const data = await res.json();

              if (res.ok) {
                  if (messageContainer) {
                      messageContainer.innerHTML = `<div class="bg-green-100 text-green-700 p-4 rounded">${data.msg}</div>`;
                      messageContainer.classList.remove('hidden');
                  } else {
                      alert(data.msg);
                  }
                  resetPasswordForm.style.display = 'none';
                  setTimeout(() => { window.location.href = '/login.html'; }, 3000);
              } else {
                  if (messageContainer) {
                      messageContainer.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded">${data.msg}</div>`;
                      messageContainer.classList.remove('hidden');
                  } else {
                      alert(data.msg);
                  }
              }
          } catch (err) {
              if (messageContainer) {
                  messageContainer.innerHTML = `<div class="bg-red-100 text-red-700 p-4 rounded">An error occurred. Please try again.</div>`;
                  messageContainer.classList.remove('hidden');
              } else {
                  alert('An error occurred. Please try again.');
              }
          }
      });
  }
});
