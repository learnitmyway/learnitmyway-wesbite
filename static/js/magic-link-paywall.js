// Magic Link Paywall System
// Uses Netlify Blobs + SendGrid for secure, email-verified access

(function() {
  'use strict';

  const API_BASE = '/.netlify/functions';
  const SESSION_KEY = 'paywall_session_token';
  const COURSE_KEY = 'paywall_course_id';
  
  // Check if user has access on page load
  async function checkAccessOnLoad() {
    const paywallElement = document.getElementById('paywall');
    if (!paywallElement) return; // Not a premium article
    
    const courseId = paywallElement.dataset.courseId;
    if (!courseId) return;
    
    // Check if we have a session token
    const sessionToken = localStorage.getItem(SESSION_KEY);
    if (!sessionToken) {
      console.log('No session token found');
      return;
    }
    
    console.log('Checking session...');
    
    try {
      const hasAccess = await verifySession(sessionToken, courseId);
      if (hasAccess) {
        console.log('✓ Access verified');
        unlockContent();
      } else {
        console.log('Session invalid or expired');
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(COURSE_KEY);
      }
    } catch (error) {
      console.error('Access check failed:', error);
    }
  }
  
  // Verify session token
  async function verifySession(sessionToken, courseId) {
    try {
      const response = await fetch(`${API_BASE}/verify-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionToken, courseId })
      });
      
      if (!response.ok) {
        throw new Error('Verification failed');
      }
      
      const data = await response.json();
      return data.hasAccess;
    } catch (error) {
      console.error('Verify session error:', error);
      return false;
    }
  }
  
  // Unlock premium content
  function unlockContent() {
    const paywall = document.getElementById('paywall');
    const content = document.getElementById('premium-content');
    const preview = document.querySelector('.article__content--preview');
    
    if (paywall) paywall.style.display = 'none';
    if (content) {
      content.style.display = 'block';
      content.classList.add('nested-links');
    }
    if (preview) preview.style.display = 'none';
    
    // Show success message
    showNotification('✓ Content unlocked!', 'success');
  }
  
  // Purchase course - redirects to Stripe
  window.purchaseCourse = async function(courseId, priceUSD, courseName) {
    const email = prompt('Enter your email address:');
    
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    
    // Store for later
    localStorage.setItem('pending_email', email);
    localStorage.setItem('pending_course', courseId);
    
    // Show loading state
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Creating checkout...';
    button.disabled = true;
    
    try {
      const response = await fetch(`${API_BASE}/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          courseId, 
          email, 
          priceUSD,
          courseName 
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout');
      }
      
      const data = await response.json();
      
      if (data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to start checkout. Please try again.');
      button.textContent = originalText;
      button.disabled = false;
    }
  };
  
  // Request magic link (for returning users)
  window.requestMagicLink = async function(courseId, courseName) {
    const email = prompt('Enter the email you used to purchase:');
    
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    
    // Show loading
    showNotification('Sending magic link...', 'info');
    
    try {
      const response = await fetch(`${API_BASE}/send-magic-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, courseId, courseName })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showNotification('✓ Magic link sent! Check your email.', 'success', 5000);
      } else {
        showNotification(data.error || 'Failed to send magic link', 'error');
      }
    } catch (error) {
      console.error('Magic link request error:', error);
      showNotification('Failed to send magic link. Please try again.', 'error');
    }
  };
  
  // Verify magic link token (called from verify page)
  async function verifyMagicLinkToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const courseId = urlParams.get('courseId');
    
    if (!token || !courseId) {
      return;
    }
    
    showNotification('Verifying your access...', 'info');
    
    try {
      const response = await fetch(`${API_BASE}/verify-magic-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, courseId })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Store session token
        localStorage.setItem(SESSION_KEY, data.sessionToken);
        localStorage.setItem(COURSE_KEY, courseId);
        
        showNotification('✓ Access granted! Redirecting...', 'success');
        
        // Redirect to the article after a short delay
        setTimeout(() => {
          // Find the article URL based on courseId (you may need to customize this)
          window.location.href = `/${courseId.replace('course', 'article')}`;
        }, 2000);
      } else {
        showNotification(data.error || 'Verification failed', 'error');
      }
    } catch (error) {
      console.error('Verification error:', error);
      showNotification('Verification failed. Please try again.', 'error');
    }
  }
  
  // Handle purchase success page
  function handlePurchaseSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const courseId = urlParams.get('courseId');
    
    if (!email || !courseId) {
      return;
    }
    
    // Check if we're on the success page
    if (!window.location.pathname.includes('purchase-success')) {
      return;
    }
    
    // Automatically send magic link
    showNotification('Sending your magic link...', 'info');
    
    fetch(`${API_BASE}/send-magic-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        email, 
        courseId, 
        courseName: document.title 
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        showNotification('✓ Magic link sent to ' + email, 'success', 8000);
        
        // Update page content
        const successMessage = document.querySelector('h1');
        if (successMessage) {
          successMessage.textContent = '🎉 Payment Successful!';
        }
        
        // Add helpful message
        const container = document.querySelector('.page');
        if (container && !document.getElementById('magic-link-message')) {
          const message = document.createElement('div');
          message.id = 'magic-link-message';
          message.className = 'paywall-card';
          message.style.margin = '2rem auto';
          message.style.maxWidth = '600px';
          message.innerHTML = `
            <h3>📧 Check Your Email</h3>
            <p>We've sent a magic link to <strong>${email}</strong></p>
            <p>Click the link in the email to access your premium content.</p>
            <p style="color: #666; font-size: 0.875rem; margin-top: 1rem;">
              The link expires in 15 minutes. Didn't receive it? Check your spam folder or 
              <a href="#" onclick="requestMagicLink('${courseId}', '${document.title}'); return false;">request a new one</a>.
            </p>
          `;
          container.insertBefore(message, container.firstChild);
        }
      } else {
        showNotification('Please check your email for the magic link', 'info');
      }
    })
    .catch(error => {
      console.error('Auto-send error:', error);
      showNotification('Please request a magic link manually', 'info');
    });
  }
  
  // Show notification
  function showNotification(message, type, duration = 3000) {
    // Remove existing notification
    const existing = document.querySelector('.paywall-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `paywall-notification paywall-notification--${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-remove
    setTimeout(() => {
      notification.remove();
    }, duration);
  }
  
  // For development: clear session
  window.clearSession = function() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(COURSE_KEY);
    console.log('Session cleared');
    location.reload();
  };
  
  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      checkAccessOnLoad();
      handlePurchaseSuccess();
      verifyMagicLinkToken();
    });
  } else {
    checkAccessOnLoad();
    handlePurchaseSuccess();
    verifyMagicLinkToken();
  }
})();
