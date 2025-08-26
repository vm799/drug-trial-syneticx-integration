// End-to-end test for complete authentication flow
import { test, expect, type Page } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')
  })

  test.describe('User Registration', () => {
    test('should complete successful registration flow', async ({ page }) => {
      // Navigate to registration page
      await page.click('[data-testid="register-button"]')
      await expect(page).toHaveURL('/register')

      // Fill registration form
      await page.fill('[data-testid="email-input"]', 'newuser@example.com')
      await page.fill('[data-testid="password-input"]', 'SecurePass123!')
      await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!')
      await page.fill('[data-testid="first-name-input"]', 'Jane')
      await page.fill('[data-testid="last-name-input"]', 'Doe')
      await page.fill('[data-testid="organization-input"]', 'Test University')
      
      // Select specializations
      await page.click('[data-testid="specialization-dropdown"]')
      await page.click('[data-testid="specialization-oncology"]')
      await page.click('[data-testid="specialization-immunology"]')
      
      // Accept terms
      await page.check('[data-testid="terms-checkbox"]')

      // Submit registration
      await page.click('[data-testid="register-submit"]')

      // Should redirect to dashboard after successful registration
      await expect(page).toHaveURL('/dashboard')
      
      // Should show welcome message
      await expect(page.locator('[data-testid="welcome-message"]')).toContainText('Welcome, Jane!')
      
      // Should show user info in header
      await expect(page.locator('[data-testid="user-menu"]')).toContainText('Jane Doe')
    })

    test('should show validation errors for invalid input', async ({ page }) => {
      await page.click('[data-testid="register-button"]')

      // Try to submit with invalid data
      await page.fill('[data-testid="email-input"]', 'invalid-email')
      await page.fill('[data-testid="password-input"]', '123')  // Too short
      await page.click('[data-testid="register-submit"]')

      // Should show validation errors
      await expect(page.locator('[data-testid="email-error"]')).toContainText('Valid email is required')
      await expect(page.locator('[data-testid="password-error"]')).toContainText('Password must be at least 8 characters')
      
      // Should stay on registration page
      await expect(page).toHaveURL('/register')
    })

    test('should handle duplicate email registration', async ({ page }) => {
      await page.click('[data-testid="register-button"]')

      // Fill form with existing email
      await page.fill('[data-testid="email-input"]', 'existing@example.com')
      await page.fill('[data-testid="password-input"]', 'SecurePass123!')
      await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123!')
      await page.fill('[data-testid="first-name-input"]', 'Jane')
      await page.fill('[data-testid="last-name-input"]', 'Doe')
      await page.check('[data-testid="terms-checkbox"]')
      
      await page.click('[data-testid="register-submit"]')

      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Email already registered')
      
      // Should suggest login instead
      await expect(page.locator('[data-testid="login-suggestion"]')).toBeVisible()
      await page.click('[data-testid="login-suggestion-link"]')
      await expect(page).toHaveURL('/login')
    })

    test('should validate password confirmation', async ({ page }) => {
      await page.click('[data-testid="register-button"]')

      await page.fill('[data-testid="password-input"]', 'SecurePass123!')
      await page.fill('[data-testid="confirm-password-input"]', 'DifferentPass123!')
      
      // Should show error when passwords don't match
      await expect(page.locator('[data-testid="confirm-password-error"]')).toContainText('Passwords do not match')
    })
  })

  test.describe('User Login', () => {
    test('should complete successful login flow', async ({ page }) => {
      // Navigate to login page
      await page.click('[data-testid="login-button"]')
      await expect(page).toHaveURL('/login')

      // Fill login form
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.fill('[data-testid="password-input"]', 'SecurePass123!')
      
      // Check remember me
      await page.check('[data-testid="remember-me-checkbox"]')

      // Submit login
      await page.click('[data-testid="login-submit"]')

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard')
      
      // Should show user-specific content
      await expect(page.locator('[data-testid="user-dashboard"]')).toBeVisible()
      await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible()
    })

    test('should handle invalid credentials', async ({ page }) => {
      await page.click('[data-testid="login-button"]')

      // Fill with wrong credentials
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.fill('[data-testid="password-input"]', 'wrongpassword')
      await page.click('[data-testid="login-submit"]')

      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid email or password')
      
      // Should stay on login page
      await expect(page).toHaveURL('/login')
    })

    test('should handle account lockout', async ({ page }) => {
      await page.click('[data-testid="login-button"]')

      // Simulate multiple failed attempts
      for (let i = 0; i < 5; i++) {
        await page.fill('[data-testid="email-input"]', 'locked@example.com')
        await page.fill('[data-testid="password-input"]', 'wrongpassword')
        await page.click('[data-testid="login-submit"]')
        
        if (i < 4) {
          await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid email or password')
        }
      }

      // Should show lockout message
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Account temporarily locked')
      
      // Should show countdown timer
      await expect(page.locator('[data-testid="lockout-timer"]')).toBeVisible()
    })

    test('should redirect to intended page after login', async ({ page }) => {
      // Try to access protected page without authentication
      await page.goto('/research/papers')
      
      // Should redirect to login with returnUrl
      await expect(page).toHaveURL('/login?returnUrl=%2Fresearch%2Fpapers')
      
      // Login
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.fill('[data-testid="password-input"]', 'SecurePass123!')
      await page.click('[data-testid="login-submit"]')

      // Should redirect to originally intended page
      await expect(page).toHaveURL('/research/papers')
    })
  })

  test.describe('Session Management', () => {
    test('should maintain session across page reloads', async ({ page }) => {
      // Login first
      await loginUser(page, 'test@example.com', 'SecurePass123!')

      // Reload page
      await page.reload()

      // Should still be authenticated
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
      await expect(page).toHaveURL('/dashboard')
    })

    test('should handle expired session gracefully', async ({ page }) => {
      // Login with expired token scenario
      await page.goto('/dashboard')
      
      // Mock expired session
      await page.evaluate(() => {
        localStorage.setItem('authToken', 'expired-token-12345')
      })

      await page.reload()

      // Should redirect to login
      await expect(page).toHaveURL('/login')
      await expect(page.locator('[data-testid="session-expired-message"]')).toContainText('Your session has expired')
    })

    test('should auto-refresh token before expiration', async ({ page }) => {
      await loginUser(page, 'test@example.com', 'SecurePass123!')

      // Mock token near expiration
      await page.evaluate(() => {
        // Set token that expires in 5 minutes
        const nearExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString()
        localStorage.setItem('tokenExpiry', nearExpiry)
      })

      // Wait for auto-refresh (should happen before expiry)
      await page.waitForTimeout(1000)

      // Should still be authenticated
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    })
  })

  test.describe('Logout Flow', () => {
    test('should complete successful logout', async ({ page }) => {
      await loginUser(page, 'test@example.com', 'SecurePass123!')

      // Open user menu and logout
      await page.click('[data-testid="user-menu"]')
      await page.click('[data-testid="logout-button"]')

      // Should redirect to home page
      await expect(page).toHaveURL('/')
      
      // Should show login/register buttons
      await expect(page.locator('[data-testid="login-button"]')).toBeVisible()
      await expect(page.locator('[data-testid="register-button"]')).toBeVisible()
    })

    test('should clear all session data on logout', async ({ page }) => {
      await loginUser(page, 'test@example.com', 'SecurePass123!')

      // Logout
      await page.click('[data-testid="user-menu"]')
      await page.click('[data-testid="logout-button"]')

      // Check that localStorage is cleared
      const token = await page.evaluate(() => localStorage.getItem('authToken'))
      expect(token).toBeNull()

      // Try to access protected page
      await page.goto('/dashboard')
      await expect(page).toHaveURL('/login')
    })

    test('should show logout confirmation for important actions', async ({ page }) => {
      await loginUser(page, 'test@example.com', 'SecurePass123!')
      
      // Start some work (e.g., unsaved chat session)
      await page.goto('/chat')
      await page.fill('[data-testid="message-input"]', 'Important unsaved message...')

      // Try to logout
      await page.click('[data-testid="user-menu"]')
      await page.click('[data-testid="logout-button"]')

      // Should show confirmation dialog
      await expect(page.locator('[data-testid="logout-confirmation"]')).toContainText('You have unsaved changes')
      
      // Cancel logout
      await page.click('[data-testid="cancel-logout"]')
      await expect(page).toHaveURL('/chat')
      await expect(page.locator('[data-testid="message-input"]')).toHaveValue('Important unsaved message...')

      // Confirm logout
      await page.click('[data-testid="user-menu"]')
      await page.click('[data-testid="logout-button"]')
      await page.click('[data-testid="confirm-logout"]')
      await expect(page).toHaveURL('/')
    })
  })

  test.describe('Password Reset Flow', () => {
    test('should complete password reset request', async ({ page }) => {
      await page.click('[data-testid="login-button"]')
      await page.click('[data-testid="forgot-password-link"]')
      
      await expect(page).toHaveURL('/forgot-password')

      // Fill email
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.click('[data-testid="reset-password-submit"]')

      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Password reset email sent')
      await expect(page.locator('[data-testid="check-email-message"]')).toBeVisible()
    })

    test('should handle invalid email for password reset', async ({ page }) => {
      await page.goto('/forgot-password')

      await page.fill('[data-testid="email-input"]', 'nonexistent@example.com')
      await page.click('[data-testid="reset-password-submit"]')

      await expect(page.locator('[data-testid="error-message"]')).toContainText('Email not found')
    })

    test('should complete password reset with valid token', async ({ page }) => {
      // Navigate to reset page with valid token
      await page.goto('/reset-password?token=valid-reset-token-123')

      // Fill new password
      await page.fill('[data-testid="new-password-input"]', 'NewSecurePass456!')
      await page.fill('[data-testid="confirm-password-input"]', 'NewSecurePass456!')
      await page.click('[data-testid="reset-password-submit"]')

      // Should redirect to login with success message
      await expect(page).toHaveURL('/login')
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Password reset successful')

      // Should be able to login with new password
      await page.fill('[data-testid="email-input"]', 'test@example.com')
      await page.fill('[data-testid="password-input"]', 'NewSecurePass456!')
      await page.click('[data-testid="login-submit"]')

      await expect(page).toHaveURL('/dashboard')
    })
  })

  test.describe('Two-Factor Authentication', () => {
    test('should enable 2FA in user settings', async ({ page }) => {
      await loginUser(page, 'test@example.com', 'SecurePass123!')

      // Navigate to security settings
      await page.click('[data-testid="user-menu"]')
      await page.click('[data-testid="settings-link"]')
      await page.click('[data-testid="security-tab"]')

      // Enable 2FA
      await page.click('[data-testid="enable-2fa-button"]')

      // Should show QR code and backup codes
      await expect(page.locator('[data-testid="qr-code"]')).toBeVisible()
      await expect(page.locator('[data-testid="backup-codes"]')).toBeVisible()

      // Enter verification code
      await page.fill('[data-testid="2fa-code-input"]', '123456')
      await page.click('[data-testid="verify-2fa-button"]')

      // Should show success message
      await expect(page.locator('[data-testid="2fa-enabled-message"]')).toContainText('Two-factor authentication enabled')
    })

    test('should require 2FA code during login', async ({ page }) => {
      await page.click('[data-testid="login-button"]')

      // Login with 2FA-enabled account
      await page.fill('[data-testid="email-input"]', '2fa-user@example.com')
      await page.fill('[data-testid="password-input"]', 'SecurePass123!')
      await page.click('[data-testid="login-submit"]')

      // Should show 2FA verification step
      await expect(page.locator('[data-testid="2fa-verification"]')).toBeVisible()
      await expect(page.locator('[data-testid="2fa-prompt"]')).toContainText('Enter verification code')

      // Enter 2FA code
      await page.fill('[data-testid="2fa-code-input"]', '123456')
      await page.click('[data-testid="verify-2fa-button"]')

      // Should complete login
      await expect(page).toHaveURL('/dashboard')
    })

    test('should allow backup code usage', async ({ page }) => {
      await page.click('[data-testid="login-button"]')
      
      await page.fill('[data-testid="email-input"]', '2fa-user@example.com')
      await page.fill('[data-testid="password-input"]', 'SecurePass123!')
      await page.click('[data-testid="login-submit"]')

      // Click "Use backup code" link
      await page.click('[data-testid="use-backup-code-link"]')
      
      // Should show backup code input
      await expect(page.locator('[data-testid="backup-code-input"]')).toBeVisible()
      
      await page.fill('[data-testid="backup-code-input"]', 'backup-code-123')
      await page.click('[data-testid="verify-backup-code-button"]')

      await expect(page).toHaveURL('/dashboard')
    })
  })

  test.describe('Social Authentication', () => {
    test('should initiate Google OAuth flow', async ({ page }) => {
      await page.click('[data-testid="login-button"]')
      
      // Click Google login
      const googlePromise = page.waitForEvent('popup')
      await page.click('[data-testid="google-login-button"]')
      const googlePage = await googlePromise

      // Should redirect to Google OAuth
      expect(googlePage.url()).toContain('accounts.google.com')
      await googlePage.close()
    })

    test('should complete OAuth callback', async ({ page }) => {
      // Simulate OAuth callback with success
      await page.goto('/auth/callback?provider=google&code=success-code-123')

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard')
      await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible()
    })

    test('should handle OAuth errors', async ({ page }) => {
      // Simulate OAuth callback with error
      await page.goto('/auth/callback?provider=google&error=access_denied')

      // Should redirect to login with error message
      await expect(page).toHaveURL('/login')
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Authentication cancelled')
    })
  })

  test.describe('Accessibility', () => {
    test('should be accessible via keyboard navigation', async ({ page }) => {
      await page.click('[data-testid="login-button"]')

      // Tab through form elements
      await page.keyboard.press('Tab') // Email input
      expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe('email-input')

      await page.keyboard.press('Tab') // Password input  
      expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe('password-input')

      await page.keyboard.press('Tab') // Remember me checkbox
      expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe('remember-me-checkbox')

      await page.keyboard.press('Tab') // Submit button
      expect(await page.evaluate(() => document.activeElement?.getAttribute('data-testid'))).toBe('login-submit')
    })

    test('should have proper ARIA labels', async ({ page }) => {
      await page.click('[data-testid="login-button"]')

      // Check ARIA labels
      await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('aria-label', 'Email address')
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('aria-label', 'Password')
      
      // Check error announcements
      await page.fill('[data-testid="email-input"]', 'invalid')
      await page.click('[data-testid="login-submit"]')
      
      await expect(page.locator('[aria-live="polite"]')).toContainText('Invalid email format')
    })

    test('should work with screen readers', async ({ page }) => {
      await page.click('[data-testid="register-button"]')

      // Check form has proper structure
      await expect(page.locator('form')).toHaveAttribute('role', 'form')
      await expect(page.locator('h1')).toContainText('Create Account')
      
      // Check fieldsets and legends
      await expect(page.locator('fieldset legend')).toContainText('Account Information')
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.click('[data-testid="login-button"]')

      // Should show mobile-optimized layout
      await expect(page.locator('[data-testid="mobile-login-form"]')).toBeVisible()
      
      // Touch-friendly button sizes
      const buttonSize = await page.locator('[data-testid="login-submit"]').boundingBox()
      expect(buttonSize?.height).toBeGreaterThan(44) // Minimum touch target size
    })

    test('should handle mobile keyboard interactions', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.click('[data-testid="login-button"]')

      // Focus on email input should show email keyboard
      await page.focus('[data-testid="email-input"]')
      
      // Check input type
      await expect(page.locator('[data-testid="email-input"]')).toHaveAttribute('type', 'email')
      
      // Password input should be secure
      await expect(page.locator('[data-testid="password-input"]')).toHaveAttribute('type', 'password')
    })
  })
})

// Helper function for login
async function loginUser(page: Page, email: string, password: string) {
  await page.click('[data-testid="login-button"]')
  await page.fill('[data-testid="email-input"]', email)
  await page.fill('[data-testid="password-input"]', password)
  await page.click('[data-testid="login-submit"]')
  await expect(page).toHaveURL('/dashboard')
}