/**
 * Magic Link Paywall Script
 * Handles paywall display, access checks, and resend flow
 */

(function() {
  'use strict';

  // Configuration
  const API_BASE = '/.netlify/functions';
  const CHECK_ACCESS_ENDPOINT = `${API_BASE}/check-access`;
  const RESEND_LINK_ENDPOINT = `${API_BASE}/resend-magic-link`;
  const CREATE_CHECKOUT_ENDPOINT = `${API_BASE}/create-checkout-session`;

  // Get article slug from current URL
  function getArticleSlug() {
    const path = window.location.pathname;
    // Extract slug from /post/article-slug/ or /article-slug/
    const match = path.match(/\/(?:post\/)?([^\/]+)\/?$/);
    return match ? match[1] : null;
  }

  // Check if user has access
  async function checkAccess() {
    const articleSlug = getArticleSlug();
    if (!articleSlug) {
      console.error('Could not determine article slug');
      return false;
    }

    try {
      const response = await fetch(`${CHECK_ACCESS_ENDPOINT}?articleSlug=${encodeURIComponent(articleSlug)}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Failed to check access:', response.status);
        return false;
      }

      const data = await response.json();
      
      // If token was renewed, update localStorage
      if (data.tokenRenewed) {
        // Token is now in cookie, we don't need to store it separately
        // But we can set a flag to indicate access
        localStorage.setItem(`paywall_access_${articleSlug}`, 'true');
      }

      return data.hasAccess === true;
    } catch (error) {
      console.error('Error checking access:', error);
      return false;
    }
  }

  // Show paywall overlay
  function showPaywall(articleSlug, priceId) {
    const articleContent = document.querySelector('.article__content');
    if (!articleContent) return;

    // Create paywall overlay
    const overlay = document.createElement('div');
    overlay.id = 'paywall-overlay';
    overlay.className = 'paywall-overlay';
    overlay.innerHTML = `
      <div class="paywall-content">
        <h2>Premium Content</h2>
        <p>This article is available to premium subscribers.</p>
        <button id="paywall-purchase-btn" class="paywall-button paywall-button-primary">
          Purchase Access
        </button>
        <div class="paywall-divider">
          <span>or</span>
        </div>
        <button id="paywall-resend-btn" class="paywall-button paywall-button-secondary">
          Already paid? Get your access link
        </button>
        <div id="paywall-resend-form" class="paywall-resend-form" style="display: none;">
          <input type="email" id="paywall-email-input" placeholder="Enter your email" required>
          <button id="paywall-resend-submit-btn" class="paywall-button paywall-button-primary">
            Send Access Link
          </button>
          <div id="paywall-resend-message" class="paywall-message"></div>
        </div>
      </div>
    `;

    // Insert overlay before article content
    articleContent.parentNode.insertBefore(overlay, articleContent);

    // Hide article content
    articleContent.style.display = 'none';

    // Add event listeners
    document.getElementById('paywall-purchase-btn').addEventListener('click', () => {
      purchaseAccess(articleSlug, priceId);
    });

    document.getElementById('paywall-resend-btn').addEventListener('click', () => {
      const form = document.getElementById('paywall-resend-form');
      form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('paywall-resend-submit-btn').addEventListener('click', () => {
      const email = document.getElementById('paywall-email-input').value.trim();
      if (email) {
        resendMagicLink(email, articleSlug);
      }
    });
  }

  // Hide paywall and show content
  function hidePaywall() {
    const overlay = document.getElementById('paywall-overlay');
    const articleContent = document.querySelector('.article__content');
    
    if (overlay) {
      overlay.remove();
    }
    
    if (articleContent) {
      articleContent.style.display = '';
    }
  }

  // Purchase access
  async function purchaseAccess(articleSlug, priceId) {
    if (!priceId) {
      console.error('Price ID not configured');
      alert('Payment configuration error. Please contact support.');
      return;
    }

    try {
      const response = await fetch(CREATE_CHECKOUT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceId,
          articleSlug: articleSlug,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      // Redirect to checkout
      const location = response.headers.get('Location');
      if (location) {
        window.location.href = location;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    }
  }

  // Resend magic link
  async function resendMagicLink(email, articleSlug) {
    const messageDiv = document.getElementById('paywall-resend-message');
    const submitBtn = document.getElementById('paywall-resend-submit-btn');
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    messageDiv.textContent = '';
    messageDiv.className = 'paywall-message';

    try {
      const response = await fetch(RESEND_LINK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          articleSlug: articleSlug,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        messageDiv.textContent = 'Access link sent! Please check your email.';
        messageDiv.className = 'paywall-message paywall-message-success';
        document.getElementById('paywall-email-input').value = '';
      } else {
        messageDiv.textContent = data.message || 'If a payment record exists, a link has been sent.';
        messageDiv.className = 'paywall-message paywall-message-info';
      }
    } catch (error) {
      console.error('Error resending magic link:', error);
      messageDiv.textContent = 'An error occurred. Please try again.';
      messageDiv.className = 'paywall-message paywall-message-error';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Access Link';
    }
  }

  // Initialize paywall
  async function init() {
    const articleSlug = getArticleSlug();
    if (!articleSlug) {
      return; // Not an article page
    }

    // Check if this is a premium article
    // This will be set by the template
    const isPremium = document.body.dataset.premium === 'true';
    if (!isPremium) {
      return; // Not a premium article
    }

    // Get price ID from data attribute
    const priceId = document.body.dataset.priceId;

    // Check access
    const hasAccess = await checkAccess();

    if (hasAccess) {
      // User has access, ensure content is visible
      hidePaywall();
      localStorage.setItem(`paywall_access_${articleSlug}`, 'true');
    } else {
      // Show paywall
      showPaywall(articleSlug, priceId);
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

