// Simple Stripe-based paywall
// No JWT, no database - just queries Stripe directly

(function() {
  'use strict';

  const API_BASE = '/.netlify/functions';
  const STORAGE_KEY = 'user_email';
  
  // Check if user has access on page load
  async function checkAccessOnLoad() {
    const paywallElement = document.getElementById('paywall');
    if (!paywallElement) return; // Not a premium article
    
    const courseId = paywallElement.dataset.courseId;
    if (!courseId) return;
    
    // Check if we have a stored email
    const email = localStorage.getItem(STORAGE_KEY);
    if (!email) {
      console.log('No email found in storage');
      return;
    }
    
    console.log('Checking access for:', email);
    
    try {
      const hasAccess = await verifyPurchase(email, courseId);
      if (hasAccess) {
        console.log('✓ Access verified');
        unlockContent();
      } else {
        console.log('No purchase found for this email');
      }
    } catch (error) {
      console.error('Access check failed:', error);
    }
  }
  
  // Verify purchase with Stripe
  async function verifyPurchase(email, courseId) {
    try {
      const response = await fetch(`${API_BASE}/verify-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, courseId })
      });
      
      if (!response.ok) {
        throw new Error('Verification failed');
      }
      
      const data = await response.json();
      return data.hasAccess;
    } catch (error) {
      console.error('Verify purchase error:', error);
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
    
    // Store email for later verification
    localStorage.setItem(STORAGE_KEY, email);
    
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
  
  // Verify access with email (for returning users on new device)
  window.verifyAccess = async function(courseId) {
    const email = prompt('Enter the email you used to purchase:');
    
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    
    // Show loading
    showNotification('Verifying purchase...', 'info');
    
    try {
      const hasAccess = await verifyPurchase(email, courseId);
      
      if (hasAccess) {
        // Store email and unlock
        localStorage.setItem(STORAGE_KEY, email);
        unlockContent();
      } else {
        showNotification('No purchase found for this email. Please check your email or purchase the course.', 'error');
      }
    } catch (error) {
      console.error('Verification error:', error);
      showNotification('Verification failed. Please try again.', 'error');
    }
  };
  
  // Show notification
  function showNotification(message, type) {
    // Remove existing notification
    const existing = document.querySelector('.paywall-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `paywall-notification paywall-notification--${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
  
  // For development: clear stored email
  window.clearEmail = function() {
    localStorage.removeItem(STORAGE_KEY);
    console.log('Email cleared');
    location.reload();
  };
  
  // Check URL for success redirect from Stripe
  function checkPurchaseSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
      showNotification('✓ Purchase successful! Verifying access...', 'success');
      
      // Verify access after a short delay
      setTimeout(() => {
        checkAccessOnLoad();
      }, 1000);
    }
  }
  
  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      checkAccessOnLoad();
      checkPurchaseSuccess();
    });
  } else {
    checkAccessOnLoad();
    checkPurchaseSuccess();
  }
})();
