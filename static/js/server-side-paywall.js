// Server-side premium content system
// This version fetches content from Netlify Functions instead of unhiding

const API_BASE = '/.netlify/functions';
const SESSION_KEY = 'premium_session_token';

// Check access on page load
window.addEventListener('DOMContentLoaded', () => {
  const paywallElement = document.querySelector('.paywall');
  if (!paywallElement) return;
  
  const courseId = paywallElement.dataset.courseId;
  if (!courseId) return;
  
  checkAccessOnLoad(courseId);
});

async function checkAccessOnLoad(courseId) {
  const sessionToken = localStorage.getItem(SESSION_KEY);
  
  if (sessionToken) {
    const hasAccess = await verifySession(sessionToken, courseId);
    if (hasAccess) {
      await unlockContent(courseId);
    }
  }
}

async function verifySession(sessionToken, courseId) {
  try {
    const response = await fetch(`${API_BASE}/verify-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken, courseId })
    });
    
    const data = await response.json();
    return data.hasAccess;
  } catch (error) {
    console.error('Session verification failed:', error);
    return false;
  }
}

async function unlockContent(courseId) {
  const sessionToken = localStorage.getItem(SESSION_KEY);
  const premiumContentDiv = document.getElementById('premium-content');
  const paywallDiv = document.querySelector('.paywall');
  
  if (!premiumContentDiv || !sessionToken) return;
  
  // Show loading state
  premiumContentDiv.innerHTML = '<div class="loading">🔓 Unlocking premium content...</div>';
  premiumContentDiv.style.display = 'block';
  
  try {
    const response = await fetch(`${API_BASE}/get-premium-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken, courseId })
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch premium content');
    }
    
    const data = await response.json();
    
    // Inject the premium content
    premiumContentDiv.innerHTML = data.content;
    
    // Hide paywall
    if (paywallDiv) {
      paywallDiv.style.display = 'none';
    }
    
    showNotification('✅ Premium content unlocked!', 'success');
  } catch (error) {
    console.error('Error unlocking content:', error);
    premiumContentDiv.innerHTML = '<div class="error">Failed to load premium content. Please try again.</div>';
    showNotification('❌ Failed to unlock content', 'error');
  }
}

// Shortcut: Grant access with magic word
async function unlockWithMagicWord(courseId) {
  const magicWord = 'unlock-premium';
  
  try {
    const response = await fetch(`${API_BASE}/grant-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'demo@example.com',
        courseId,
        magicWord
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store session token
      localStorage.setItem(SESSION_KEY, data.sessionToken);
      
      // Unlock content
      await unlockContent(courseId);
      
      showNotification('✅ Access granted!', 'success');
    } else {
      showNotification('❌ Access denied', 'error');
    }
  } catch (error) {
    console.error('Error granting access:', error);
    showNotification('❌ Error granting access', 'error');
  }
}

function showNotification(message, type = 'info') {
  // Simple toast notification
  const notification = document.createElement('div');
  notification.className = `notification notification--${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-size: 14px;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add CSS animations
if (!document.getElementById('notification-styles')) {
  const style = document.createElement('style');
  style.id = 'notification-styles';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
    .loading {
      text-align: center;
      padding: 40px;
      font-size: 18px;
      color: #6366f1;
    }
    .error {
      text-align: center;
      padding: 40px;
      font-size: 16px;
      color: #ef4444;
      background: #fee;
      border-radius: 8px;
      margin: 20px 0;
    }
  `;
  document.head.appendChild(style);
}
