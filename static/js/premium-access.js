/**
 * Premium Content Access Control
 * 
 * Reads the access cookie, verifies the token with the backend,
 * and shows/hides premium content accordingly.
 */

(function() {
  'use strict';

  function getCookie(name) {
    // Example: `"typescript-part-2=abc123; cookie2=value2; cookie3=value3"`
    const allCookies = document.cookie;
    // value = "; typescript-part-2=my-token; other=value"
    const value = `; ${allCookies}`;

    // parts = ["", "my-token; other=value"]
    const parts = value.split(`; ${name}=`);
    const cookieFound = parts.length === 2;
    if (cookieFound) {
      // "my-token; other=value"
      const popped = parts.pop();
      // ["my-token", " other=value"]
      const splitted = popped.split(';');
      // "my-token"
      return splitted.shift();
    }
    return null;
  }

  async function verifyToken(articleSlug, token) {
    try {
      const response = await fetch('/.netlify/functions/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleSlug: articleSlug,
          token: token,
        }),
      });

      if (!response.ok) {
        console.error('Token verification failed:', response.status);
        return { valid: false };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error verifying token:', error);
      return { valid: false };
    }
  }

  function grantAccess() {
    const premiumContent = document.querySelectorAll('.premium-content');
    const paywall = document.querySelector('.paywall');

    premiumContent.forEach(function(element) {
      element.style.display = '';
      element.classList.remove('premium-hidden');
    });

    if (paywall) {
      paywall.style.display = 'none';
    }
  }

  function denyAccess() {
    const premiumContent = document.querySelectorAll('.premium-content');
    const paywall = document.querySelector('.paywall');

    premiumContent.forEach(function(element) {
      element.style.display = 'none';
      element.classList.add('premium-hidden');
    });

    if (paywall) {
      paywall.style.display = '';
    }
  }

  async function initPremiumAccess() {
    const articleElement = document.querySelector('[data-article-slug]');
    if (!articleElement) {
      return;
    }

    const articleSlug = articleElement.getAttribute('data-article-slug');
    if (!articleSlug) {
      return;
    }

    const isPremium = articleElement.hasAttribute('data-premium-article');
    if (!isPremium) {
      grantAccess();
      return;
    }

    const premiumContent = document.querySelectorAll('.premium-content');
    premiumContent.forEach(function(element) {
      element.style.display = 'none';
      element.classList.add('premium-hidden');
    });

    const token = getCookie(articleSlug);
    
    if (!token) {
      console.log('No access token found');
      denyAccess();
      return;
    }

    const verification = await verifyToken(articleSlug, token);
    
    if (verification.valid) {
      console.log('Access granted');
      grantAccess();
    } else {
      console.log('Access denied');
      denyAccess();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPremiumAccess);
  } else {
    initPremiumAccess();
  }
})();
