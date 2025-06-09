import puppeteer from 'puppeteer'
import { createLog } from '../controllers/logController.js'

class BrowserService {
  constructor() {
    this.activeSessions = new Map() // Map of employeeId -> browser session
  }

  async createSession(employeeId, platform, employee, io) {
    try {
      // Close existing session if any
      await this.closeSession(employeeId)

      const session = await this.launchBrowserSession(employeeId, platform, employee, io)

      // Navigate to platform and auto-login
      await this.autoLogin(employeeId, session.page, platform, employee, io)

      return session

    } catch (error) {
      throw error
    }
  }

  async createBasicSession(employeeId, platform, employee, io) {
    try {
      // Close existing session if any
      await this.closeSession(employeeId)

      const session = await this.launchBrowserSession(employeeId, platform, employee, io)

      // Navigate to platform WITHOUT auto-login
      await this.navigateToplatform(employeeId, session.page, platform, employee, io)

      return session

    } catch (error) {
      throw error
    }
  }

  async launchBrowserSession(employeeId, platform, employee, io) {
    // Launch browser with specific settings for streaming
    const browser = await puppeteer.launch({
      headless: true, // Set to true for production - no visible browser window
      defaultViewport: { width: 1280, height: 720 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    })

    const page = await browser.newPage()
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')

    // Store session info
    const session = {
      browser,
      page,
      platform,
      employee,
      startTime: new Date(),
      isLoggedIn: false
    }
    
    this.activeSessions.set(employeeId, session)

    // Set up page event listeners
    await this.setupPageListeners(employeeId, page, io)

    return session
  }

  async navigateToplatform(employeeId, page, platform, employee, io) {
    try {
      // Emit status update
      io.to(`employee_${employeeId}`).emit('login-status', {
        status: 'navigating',
        message: `Navigating to ${platform.platformName}...`
      })

      // Navigate to platform URL
      const url = platform.url.startsWith('http') ? platform.url : `https://${platform.url}`
      
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

      // Wait for page to fully load
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Log platform access with valid status (only if we have valid employee ID)
      if (employee && employee._id) {
        try {
          await createLog(
            employee._id,
            "platform_access",
            `Accessed platform "${platform.platformName}" via streaming (manual login)`,
            platform._id,
            {
              ipAddress: '127.0.0.1',
              userAgent: 'Puppeteer Browser Automation',
              sessionId: `stream_${employeeId}_${Date.now()}`,
              status: "success" // Use valid enum value
            }
          )
        } catch (logError) {
          // Continue execution even if logging fails
        }
      }

      io.to(`employee_${employeeId}`).emit('login-status', {
        status: 'success',
        message: 'Platform loaded! Please login manually and interact with the platform.'
      })

      // Start screenshot streaming for manual interaction
      await this.startScreenshots(employeeId, page, io)

    } catch (error) {
      io.to(`employee_${employeeId}`).emit('login-status', {
        status: 'error',
        message: 'Failed to load platform. Please contact support.'
      })

      throw error
    }
  }

  async setupPageListeners(employeeId, page, io) {
    // Listen for page events (but don't start screenshots yet)
    page.on('console', msg => {
      // Page console message
    })

    page.on('pageerror', error => {
      io.to(`employee_${employeeId}`).emit('page-error', error.message)
    })

    page.on('dialog', async dialog => {
      io.to(`employee_${employeeId}`).emit('page-dialog', {
        type: dialog.type(),
        message: dialog.message()
      })
      await dialog.accept()
    })
  }

  async startScreenshots(employeeId, page, io) {
    // Send screenshots periodically - only called after successful login
    const screenshotInterval = setInterval(async () => {
      try {
        const session = this.activeSessions.get(employeeId)
        if (!session || !session.page) {
          clearInterval(screenshotInterval)
          return
        }

        const screenshot = await page.screenshot({
          encoding: 'base64',
          type: 'jpeg',
          quality: 80
        })

        io.to(`employee_${employeeId}`).emit('screenshot', {
          screenshot: `data:image/jpeg;base64,${screenshot}`,
          timestamp: Date.now()
        })

      } catch (error) {
        clearInterval(screenshotInterval)
      }
    }, 1000) // Send screenshot every second

    // Store interval reference for cleanup
    const session = this.activeSessions.get(employeeId)
    if (session) {
      session.screenshotInterval = screenshotInterval
    }
  }

  async autoLogin(employeeId, page, platform, employee, io) {
    try {
      io.to(`employee_${employeeId}`).emit('login-status', {
        status: 'navigating',
        message: `Navigating to ${platform.platformName}...`
      })

      // Navigate to platform URL
      const url = platform.url.startsWith('http') ? platform.url : `https://${platform.url}`
      
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

      io.to(`employee_${employeeId}`).emit('login-status', {
        status: 'logging-in',
        message: 'Attempting automatic login...'
      })

      // Wait for page to fully load
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Try to find and fill login form
      const loginSuccess = await this.performLogin(page, platform, employeeId, io)

      // Update session status
      const session = this.activeSessions.get(employeeId)
      if (session) {
        session.isLoggedIn = loginSuccess
      }

      // Log platform access with valid status values (only if we have valid employee ID)
      if (employee && employee._id) {
        try {
          await createLog(
            employee._id,
            "platform_access",
            `Accessed platform "${platform.platformName}" via streaming`,
            platform._id,
            {
              ipAddress: '127.0.0.1',
              userAgent: 'Puppeteer Browser Automation',
              sessionId: `stream_${employeeId}_${Date.now()}`,
              status: loginSuccess ? "success" : "failed" // Use only valid enum values
            }
          )
        } catch (logError) {
          // Continue execution even if logging fails
        }
      }

      if (loginSuccess) {
        io.to(`employee_${employeeId}`).emit('login-status', {
          status: 'success',
          message: 'Successfully logged in! You can now interact with the platform.'
        })
        
        // Start screenshot streaming only after successful login
        await this.startScreenshots(employeeId, page, io)
      } else {
        io.to(`employee_${employeeId}`).emit('login-status', {
          status: 'success',
          message: 'Platform loaded! Login manually if needed or interact with the platform.'
        })
        
        // Start screenshot streaming anyway for manual login
        await this.startScreenshots(employeeId, page, io)
      }

      // Extract session cookies if login was successful
      if (loginSuccess) {
        try {
          const cookies = await page.cookies()
          // Store cookies in session for future use
          const session = this.activeSessions.get(employeeId)
          if (session) {
            session.cookies = cookies
          }
        } catch (cookieError) {
          // Could not extract cookies
        }
      }

    } catch (error) {
      io.to(`employee_${employeeId}`).emit('login-status', {
        status: 'error',
        message: 'Failed to load platform. Please contact support.'
      })

      throw error
    }
  }

  async performLogin(page, platform, employeeId, io) {
    try {
      // Wait for page to stabilize
      await page.waitForLoadState ? page.waitForLoadState('networkidle') : page.waitForNavigation({ waitUntil: 'networkidle0' }).catch((error) => {
        console.log('PAGE ERROR:', error)
      })
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Strategy 1: Try direct simple approach first (like your example)
      const directSuccess = await this.tryDirectSimpleLogin(page, platform, employeeId)
      if (directSuccess) {
        return true
      }

      // Check if page has navigated away (indicating possible success)
      try {
        const newUrl = page.url()
        if (newUrl !== page.url()) {
          return true
        }
      } catch (error) {
        if (error.message.includes('Execution context was destroyed')) {
          return true
        }
      }

      // Only try other strategies if we're still on the same page
      try {
        // Strategy 2: Try enhanced form detection
        const enhancedSuccess = await this.tryEnhancedFormLogin(page, platform)
        if (enhancedSuccess) {
          return true
        }

        // Strategy 3: Try iframe login
        const iframeSuccess = await this.tryIframeLogin(page, platform)
        if (iframeSuccess) {
          return true
        }

        // Strategy 4: Try JavaScript form manipulation
        const jsSuccess = await this.tryJavaScriptFormLogin(page, platform)
        if (jsSuccess) {
          return true
        }
      } catch (error) {
        if (error.message.includes('Execution context was destroyed') || 
            error.message.includes('detached')) {
          return true
        }
      }

      return false

    } catch (error) {
      if (error.message.includes('Execution context was destroyed') || 
          error.message.includes('Navigation timeout') ||
          error.message.includes('detached')) {
        return true
      }
      
      throw error
    }
  }

  async tryDirectSimpleLogin(page, platform, employeeId) {
    try {
      // Wait for the page to fully load
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Common direct selectors (most platforms use these)
      const emailSelectors = ['#Username', '#username', '#email', '#Email', '#user', '#login', 'input[name="email"]', 'input[name="username"]', 'input[type="email"]']
      const passwordSelectors = ['#password', '#Password', '#pass', '#Pass', 'input[name="password"]', 'input[type="password"]']
      
      let emailField = null
      let passwordField = null
      
      // Find email field
      for (const selector of emailSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 2000 })
          const field = await page.$(selector)
          if (field && await field.boundingBox()) {
            emailField = field
            break
          }
        } catch (e) {
          continue
        }
      }
      
      // Find password field
      for (const selector of passwordSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 2000 })
          const field = await page.$(selector)
          if (field && await field.boundingBox()) {
            passwordField = field
            break
          }
        } catch (e) {
          continue
        }
      }
      
      if (!emailField || !passwordField) {
        return false
      }
      
      // Fill fields (clear first, then type)
      await this.clearAndFillField(page, emailField, platform.email, 'email')
      await this.clearAndFillField(page, passwordField, platform.password, 'password')
      
      // Try to submit (multiple approaches)
      const submitted = await page.evaluate(() => {
        // Try button with value="login" (like your example)
        let button = document.querySelector('button[value="login"]')
        if (button && button.offsetParent !== null) {
          button.click()
          return true
        }
        
        // Try common submit buttons
        const submitSelectors = [
          'button[type="submit"]',
          'input[type="submit"]',
          'button[class*="login"]',
          'button[class*="submit"]',
          '#login-button',
          '#submit-button',
          '.login-btn',
          '.submit-btn'
        ]
        
        for (const selector of submitSelectors) {
          button = document.querySelector(selector)
          if (button && button.offsetParent !== null) {
            button.click()
            return true
          }
        }
        
        // Try form submission
        const form = document.querySelector('form')
        if (form) {
          form.submit()
          return true
        }
        
        return false
      })
      
      if (!submitted) {
        // Fallback: Press Enter on password field
        await passwordField.press('Enter')
      }
      
      // Wait for submission to process and potential navigation
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      return true
      
    } catch (error) {
      return false
    }
  }

  async tryEnhancedFormLogin(page, platform) {
    // Use the existing tryDirectFormLogin logic but simplified
    return await this.tryDirectFormLogin(page, platform)
  }

  async tryDirectFormLogin(page, platform) {
    // Enhanced selectors based on common patterns
    const emailSelectors = [
      // Standard email/username selectors
      'input[type="email"]',
      'input[name="email"]',
      'input[name="username"]',
      'input[name="user"]',
      'input[name="login"]',
      'input[name="Email"]',
      'input[name="Username"]',
      
      // ID-based selectors
      'input[id="email"]',
      'input[id="username"]', 
      'input[id="user"]',
      'input[id="login"]',
      'input[id="Email"]',
      'input[id="Username"]',
      '#email',
      '#username',
      '#user',
      
      // Class-based selectors
      'input.email',
      'input.username',
      'input[class*="email"]',
      'input[class*="username"]',
      'input[class*="user"]',
      
      // Attribute-based selectors
      'input[placeholder*="email" i]',
      'input[placeholder*="username" i]',
      'input[placeholder*="Email"]',
      'input[aria-label*="email" i]',
      'input[aria-label*="username" i]',
      
      // Form context selectors
      'form input[type="text"]:first-of-type',
      '.login-form input[type="text"]',
      '.signin-form input[type="text"]',
      '[class*="login"] input[type="text"]'
    ]

    const passwordSelectors = [
      // Standard password selectors
      'input[type="password"]',
      'input[name="password"]',
      'input[name="pass"]',
      'input[name="Password"]',
      
      // ID-based selectors  
      'input[id="password"]',
      'input[id="pass"]',
      'input[id="Password"]',
      '#password',
      '#pass',
      
      // Class-based selectors
      'input.password',
      'input[class*="password"]',
      'input[class*="pass"]',
      
      // Attribute-based selectors
      'input[placeholder*="password" i]',
      'input[placeholder*="Password"]',
      'input[aria-label*="password" i]'
    ]

    const submitSelectors = [
      // Button types
      'button[type="submit"]',
      'input[type="submit"]',
      
      // Class and ID selectors
      'button[class*="login"]',
      'button[class*="submit"]',
      'button[class*="signin"]',
      'button[id*="login"]',
      'button[id*="submit"]',
      '.login-btn',
      '.submit-btn',
      '.signin-btn',
      '#login-btn',
      '#submit-btn',
      
      // Form context
      'form button:last-of-type',
      'form button',
      '.login-form button',
      '.signin-form button'
    ]

    // Find email field
    let emailField = null
    let emailSelector = null
    for (const selector of emailSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 })
        const elements = await page.$$(selector)
        for (const element of elements) {
          if (await element.boundingBox()) {
            emailField = element
            emailSelector = selector
            break
          }
        }
        if (emailField) break
      } catch (e) {
        continue
      }
    }

    // Find password field
    let passwordField = null
    let passwordSelector = null
    for (const selector of passwordSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 })
        const elements = await page.$$(selector)
        for (const element of elements) {
          if (await element.boundingBox()) {
            passwordField = element
            passwordSelector = selector
            break
          }
        }
        if (passwordField) break
      } catch (e) {
        continue
      }
    }

    if (!emailField || !passwordField) {
      return false
    }

    // Fill email field with multiple methods
    await this.fillFieldSecurely(emailField, platform.email, page)

    // Fill password field
    await this.fillFieldSecurely(passwordField, platform.password, page)

    // Find and click submit button
    let submitButton = null
    for (const selector of submitSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 1000 })
        const elements = await page.$$(selector)
        for (const element of elements) {
          if (await element.boundingBox()) {
            submitButton = element
            break
          }
        }
        if (submitButton) break
      } catch (e) {
        continue
      }
    }

    if (submitButton) {
      await submitButton.click()
    } else {
      // Try to find button by text content
      const buttonFound = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'))
        const submitTexts = ['sign in', 'log in', 'login', 'submit', 'enter']
        
        for (const button of buttons) {
          const text = button.textContent || button.value || ''
          if (submitTexts.some(t => text.toLowerCase().includes(t))) {
            button.click()
            return true
          }
        }
        return false
      })
      
      if (buttonFound) {
      } else {
        await passwordField.press('Enter')
      }
    }

    return true
  }

  async fillFieldSecurely(field, value, page) {
    try {
      // Validate inputs
      if (!field || !value) {
        return
      }

      // Method 1: Click and clear then type
      await field.click()
      
      // Use correct Puppeteer keyboard API
      await page.keyboard.down('Control')
      await page.keyboard.press('KeyA')
      await page.keyboard.up('Control')
      await new Promise(resolve => setTimeout(resolve, 100))
      await field.type(value, { delay: 50 })
      
      // Verify the field was filled
      const currentValue = await field.evaluate(el => el.value)
      if (currentValue !== value) {
        await field.focus()
        
        // Clear field using JS
        await page.evaluate((el) => {
          el.value = ''
          el.focus()
          el.dispatchEvent(new Event('input', { bubbles: true }))
          el.dispatchEvent(new Event('change', { bubbles: true }))
        }, field)
        
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Type character by character with longer delays
        for (const char of value) {
          await page.keyboard.type(char)
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }
    } catch (error) {
      // Don't throw error, continue execution
    }
  }

  async tryIframeLogin(page, platform) {
    const iframes = await page.$$('iframe')
    
    for (let i = 0; i < iframes.length; i++) {
      try {
        const iframe = iframes[i]
        const frame = await iframe.contentFrame()
        
        if (frame) {
          // Look for login form in iframe
          const emailField = await frame.$('input[type="email"], input[name="email"], input[name="username"]')
          const passwordField = await frame.$('input[type="password"]')
          
          if (emailField && passwordField) {
            await emailField.type(platform.email)
            await passwordField.type(platform.password)
            
            const submitButton = await frame.$('button[type="submit"], input[type="submit"]')
            if (submitButton) {
              await submitButton.click()
            } else {
              await passwordField.press('Enter')
            }
            
            return true
          }
        }
      } catch (error) {
      }
    }
    
    return false
  }

  async tryJavaScriptFormLogin(page, platform) {
    try {
      // Wait for any dynamic forms to load
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Try to fill using JavaScript evaluation
      const result = await page.evaluate((email, password) => {
        // Find email/username field
        const emailSelectors = [
          'input[type="email"]',
          'input[name="email"]', 
          'input[name="username"]',
          'input[placeholder*="email" i]',
          'input[placeholder*="username" i]'
        ]
        
        let emailField = null
        for (const selector of emailSelectors) {
          emailField = document.querySelector(selector)
          if (emailField && emailField.offsetParent !== null) break
        }
        
        // Find password field
        const passwordField = document.querySelector('input[type="password"]')
        
        if (emailField && passwordField) {
          // Fill fields using JavaScript
          emailField.value = email
          emailField.dispatchEvent(new Event('input', { bubbles: true }))
          emailField.dispatchEvent(new Event('change', { bubbles: true }))
          
          passwordField.value = password
          passwordField.dispatchEvent(new Event('input', { bubbles: true }))
          passwordField.dispatchEvent(new Event('change', { bubbles: true }))
          
          // Try to submit
          const submitButton = document.querySelector('button[type="submit"], input[type="submit"]')
          if (submitButton) {
            submitButton.click()
          } else {
            passwordField.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
          }
          
          return true
        }
        
        return false
      }, platform.email, platform.password)
      
      return result
    } catch (error) {
      return false
    }
  }

  async handleUserInteraction(employeeId, interaction) {
    const session = this.activeSessions.get(employeeId)
    if (!session || !session.page) {
      throw new Error('No active session found')
    }

    const { page } = session

    try {
      switch (interaction.type) {
        case 'click':
          await page.mouse.click(interaction.x, interaction.y)
          break

        case 'type':
          await page.keyboard.type(interaction.text, { delay: 50 })
          break

        case 'keypress':
          await page.keyboard.press(interaction.key)
          break

        case 'scroll':
          await page.mouse.wheel({ deltaY: interaction.deltaY })
          break

        default:
      }

      // Small delay to let the interaction take effect
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      throw error
    }
  }

  async closeSession(employeeId) {
    const session = this.activeSessions.get(employeeId)
    if (session) {
      try {
        // Clear screenshot interval
        if (session.screenshotInterval) {
          clearInterval(session.screenshotInterval)
        }

        // Close browser
        if (session.browser) {
          await session.browser.close()
        }

      } catch (error) {
      }

      this.activeSessions.delete(employeeId)
    }
  }

  async closeAllSessions() {
    const employeeIds = Array.from(this.activeSessions.keys())
    await Promise.all(employeeIds.map(id => this.closeSession(id)))
  }

  getActiveSessionsCount() {
    return this.activeSessions.size
  }

  getSessionInfo(employeeId) {
    const session = this.activeSessions.get(employeeId)
    if (!session) return null

    return {
      platform: session.platform.platformName,
      employee: session.employee.fullName,
      startTime: session.startTime,
      isLoggedIn: session.isLoggedIn
    }
  }

  async clearAndFillField(page, field, value, fieldType) {
    try {
      // Validate inputs
      if (!field || !value) {
        return
      }

      // Method 1: Triple-click to select all, then type
      await field.focus()
      await field.click({ clickCount: 3 })
      await new Promise(resolve => setTimeout(resolve, 100))
      await field.type(value, { delay: 50 })
      
      // Verify the field was filled correctly
      const currentValue = await field.evaluate(el => el.value)
      
      if (currentValue !== value) {
        // Method 2: Clear field completely and type character by character
        await field.focus()
        
        // Clear field using JS
        await page.evaluate((el) => {
          el.value = ''
          el.focus()
          el.dispatchEvent(new Event('input', { bubbles: true }))
        }, field)
        
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Type character by character with longer delays
        for (const char of value) {
          await page.keyboard.type(char)
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }
    } catch (error) {
      // Continue execution even if field filling fails
    }
  }
}

// Export singleton instance
export default new BrowserService()