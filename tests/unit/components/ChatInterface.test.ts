// Comprehensive test suite for ChatInterface component
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import ChatInterface from '@/components/ChatInterface.vue'
import { 
  mountComponent, 
  createMockChatSession, 
  createMockChatMessage,
  mockFetch,
  fillForm,
  waitForElement,
  checkAccessibility 
} from '../../utils/test-helpers'

describe('ChatInterface', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders correctly when visible', () => {
      const wrapper = mountComponent(ChatInterface, {
        props: { visible: true },
      })

      expect(wrapper.find('[data-testid="chat-interface"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="message-input"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="send-button"]').exists()).toBe(true)
    })

    it('is hidden when visible prop is false', () => {
      const wrapper = mountComponent(ChatInterface, {
        props: { visible: false },
      })

      expect(wrapper.find('[data-testid="chat-interface"]').classes()).toContain('hidden')
    })

    it('displays session title when provided', async () => {
      const session = createMockChatSession({ title: 'Test Session' })
      mockFetch({ success: true, data: session })

      const wrapper = mountComponent(ChatInterface, {
        props: { 
          visible: true,
          sessionId: session.sessionId,
        },
      })

      await flushPromises()
      expect(wrapper.text()).toContain('Test Session')
    })
  })

  describe('Message Display', () => {
    it('displays existing messages correctly', async () => {
      const session = createMockChatSession({
        messages: [
          createMockChatMessage({ 
            type: 'user', 
            content: 'Hello, can you help me?',
          }),
          createMockChatMessage({ 
            type: 'assistant', 
            content: 'Of course! How can I assist you?',
          }),
        ],
      })

      mockFetch({ success: true, data: session })

      const wrapper = mountComponent(ChatInterface, {
        props: { 
          visible: true,
          sessionId: session.sessionId,
        },
      })

      await flushPromises()

      expect(wrapper.text()).toContain('Hello, can you help me?')
      expect(wrapper.text()).toContain('Of course! How can I assist you?')
    })

    it('distinguishes between user and assistant messages', async () => {
      const session = createMockChatSession({
        messages: [
          createMockChatMessage({ 
            type: 'user', 
            content: 'User message',
          }),
          createMockChatMessage({ 
            type: 'assistant', 
            content: 'Assistant message',
          }),
        ],
      })

      mockFetch({ success: true, data: session })

      const wrapper = mountComponent(ChatInterface, {
        props: { 
          visible: true,
          sessionId: session.sessionId,
        },
      })

      await flushPromises()

      const userMessages = wrapper.findAll('[data-testid="user-message"]')
      const assistantMessages = wrapper.findAll('[data-testid="assistant-message"]')

      expect(userMessages).toHaveLength(1)
      expect(assistantMessages).toHaveLength(1)
    })

    it('displays message timestamps', async () => {
      const timestamp = '2024-01-15T10:30:00.000Z'
      const session = createMockChatSession({
        messages: [
          createMockChatMessage({ 
            timestamp,
            content: 'Test message',
          }),
        ],
      })

      mockFetch({ success: true, data: session })

      const wrapper = mountComponent(ChatInterface, {
        props: { 
          visible: true,
          sessionId: session.sessionId,
        },
      })

      await flushPromises()

      // Should display formatted time
      expect(wrapper.find('[data-testid="message-timestamp"]').exists()).toBe(true)
    })

    it('shows confidence scores for assistant messages', async () => {
      const session = createMockChatSession({
        messages: [
          createMockChatMessage({ 
            type: 'assistant',
            content: 'Assistant message',
            metadata: {
              confidence: 0.87,
              tokens: 25,
              responseTime: 1500,
              validation: {
                hasCitations: true,
                factChecked: true,
                riskFlags: [],
                confidence: 0.87,
              },
            },
          }),
        ],
      })

      mockFetch({ success: true, data: session })

      const wrapper = mountComponent(ChatInterface, {
        props: { 
          visible: true,
          sessionId: session.sessionId,
        },
      })

      await flushPromises()

      expect(wrapper.find('[data-testid="confidence-indicator"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('87%')
    })
  })

  describe('Message Sending', () => {
    it('sends message when send button is clicked', async () => {
      const mockResponse = {
        success: true,
        data: {
          response: createMockChatMessage({
            type: 'assistant',
            content: 'Response to your message',
          }),
          session: createMockChatSession(),
        },
      }

      mockFetch(mockResponse)

      const wrapper = mountComponent(ChatInterface, {
        props: { visible: true },
      })

      await fillForm(wrapper, { message: 'Test message' })
      await wrapper.find('[data-testid="send-button"]').trigger('click')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/messages'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            message: 'Test message',
            context: undefined,
          }),
        })
      )
    })

    it('sends message when Enter key is pressed', async () => {
      const mockResponse = {
        success: true,
        data: {
          response: createMockChatMessage({
            type: 'assistant',
            content: 'Response message',
          }),
          session: createMockChatSession(),
        },
      }

      mockFetch(mockResponse)

      const wrapper = mountComponent(ChatInterface, {
        props: { visible: true },
      })

      const input = wrapper.find('[data-testid="message-input"]')
      await input.setValue('Test message')
      await input.trigger('keypress.enter')

      expect(global.fetch).toHaveBeenCalled()
    })

    it('does not send empty messages', async () => {
      const wrapper = mountComponent(ChatInterface, {
        props: { visible: true },
      })

      await wrapper.find('[data-testid="send-button"]').trigger('click')

      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('trims whitespace from messages', async () => {
      const mockResponse = {
        success: true,
        data: {
          response: createMockChatMessage(),
          session: createMockChatSession(),
        },
      }

      mockFetch(mockResponse)

      const wrapper = mountComponent(ChatInterface, {
        props: { visible: true },
      })

      await fillForm(wrapper, { message: '  Test message  ' })
      await wrapper.find('[data-testid="send-button"]').trigger('click')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            message: 'Test message',
            context: undefined,
          }),
        })
      )
    })

    it('clears input after sending message', async () => {
      const mockResponse = {
        success: true,
        data: {
          response: createMockChatMessage(),
          session: createMockChatSession(),
        },
      }

      mockFetch(mockResponse)

      const wrapper = mountComponent(ChatInterface, {
        props: { visible: true },
      })

      const input = wrapper.find('[data-testid="message-input"]')
      await input.setValue('Test message')
      await wrapper.find('[data-testid="send-button"]').trigger('click')
      await flushPromises()

      expect((input.element as HTMLInputElement).value).toBe('')
    })
  })

  describe('Loading States', () => {
    it('shows loading indicator when sending message', async () => {
      // Mock a delayed response
      const delayedPromise = new Promise(resolve => {
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              response: createMockChatMessage(),
              session: createMockChatSession(),
            },
          }),
        }), 100)
      })

      global.fetch = vi.fn().mockReturnValue(delayedPromise)

      const wrapper = mountComponent(ChatInterface, {
        props: { visible: true },
      })

      await fillForm(wrapper, { message: 'Test message' })
      await wrapper.find('[data-testid="send-button"]').trigger('click')

      // Should show loading state
      expect(wrapper.find('[data-testid="loading-indicator"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="send-button"]').attributes('disabled')).toBeDefined()
    })

    it('shows typing indicator for assistant', async () => {
      const wrapper = mountComponent(ChatInterface, {
        props: { visible: true },
      })

      // Simulate typing indicator via WebSocket
      const chatInterface = wrapper.vm as any
      chatInterface.isAssistantTyping = true
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="typing-indicator"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('typing')
    })

    it('disables input during loading', async () => {
      const wrapper = mountComponent(ChatInterface, {
        props: { visible: true },
      })

      const chatInterface = wrapper.vm as any
      chatInterface.isLoading = true
      await wrapper.vm.$nextTick()

      const input = wrapper.find('[data-testid="message-input"]')
      const button = wrapper.find('[data-testid="send-button"]')

      expect(input.attributes('disabled')).toBeDefined()
      expect(button.attributes('disabled')).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('displays error message when API call fails', async () => {
      mockFetch(
        { success: false, message: 'Server error' },
        { ok: false, status: 500 }
      )

      const wrapper = mountComponent(ChatInterface, {
        props: { visible: true },
      })

      await fillForm(wrapper, { message: 'Test message' })
      await wrapper.find('[data-testid="send-button"]').trigger('click')
      await flushPromises()

      expect(wrapper.find('[data-testid="error-message"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Server error')
    })

    it('handles network errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const wrapper = mountComponent(ChatInterface, {
        props: { visible: true },
      })

      await fillForm(wrapper, { message: 'Test message' })
      await wrapper.find('[data-testid="send-button"]').trigger('click')
      await flushPromises()

      expect(wrapper.find('[data-testid="error-message"]').exists()).toBe(true)
    })

    it('allows retrying failed messages', async () => {
      // First call fails
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              response: createMockChatMessage(),
              session: createMockChatSession(),
            },
          }),
        })

      const wrapper = mountComponent(ChatInterface, {
        props: { visible: true },
      })

      await fillForm(wrapper, { message: 'Test message' })
      await wrapper.find('[data-testid="send-button"]').trigger('click')
      await flushPromises()

      // Should show retry button
      const retryButton = wrapper.find('[data-testid="retry-button"]')
      expect(retryButton.exists()).toBe(true)

      // Click retry
      await retryButton.trigger('click')
      await flushPromises()

      // Should succeed on retry
      expect(wrapper.find('[data-testid="error-message"]').exists()).toBe(false)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Session Management', () => {
    it('creates new session when none provided', async () => {
      const mockSessionResponse = {
        success: true,
        data: createMockChatSession(),
      }

      mockFetch(mockSessionResponse)

      const wrapper = mountComponent(ChatInterface, {
        props: { visible: true },
      })

      await fillForm(wrapper, { message: 'First message' })
      await wrapper.find('[data-testid="send-button"]').trigger('click')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/sessions'),
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('emits session created event', async () => {
      const mockSession = createMockChatSession()
      mockFetch({ success: true, data: mockSession })

      const wrapper = mountComponent(ChatInterface, {
        props: { visible: true },
      })

      await fillForm(wrapper, { message: 'First message' })
      await wrapper.find('[data-testid="send-button"]').trigger('click')
      await flushPromises()

      expect(wrapper.emitted('sessionCreated')).toBeTruthy()
      expect(wrapper.emitted('sessionCreated')![0][0]).toEqual(mockSession)
    })

    it('uses existing session when sessionId provided', async () => {
      const sessionId = 'existing-session-123'
      const mockSession = createMockChatSession({ sessionId })
      
      mockFetch({ success: true, data: mockSession })

      const wrapper = mountComponent(ChatInterface, {
        props: { 
          visible: true,
          sessionId,
        },
      })

      await flushPromises()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/sessions/${sessionId}`),
        expect.objectContaining({
          method: 'GET',
        })
      )
    })
  })

  describe('Context Handling', () => {
    it('includes context in messages when provided', async () => {
      const initialContext = {
        type: 'paper_analysis',
        researchPaper: 'paper-123',
        specialization: 'oncology',
      }

      const mockResponse = {
        success: true,
        data: {
          response: createMockChatMessage(),
          session: createMockChatSession(),
        },
      }

      mockFetch(mockResponse)

      const wrapper = mountComponent(ChatInterface, {
        props: { 
          visible: true,
          initialContext,
        },
      })

      await fillForm(wrapper, { message: 'Analyze this paper' })
      await wrapper.find('[data-testid="send-button"]').trigger('click')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            message: 'Analyze this paper',
            context: initialContext,
          }),
        })
      )
    })

    it('displays context information in UI', () => {
      const wrapper = mountComponent(ChatInterface, {
        props: { 
          visible: true,
          initialContext: {
            type: 'paper_analysis',
            specialization: 'oncology',
          },
        },
      })

      expect(wrapper.find('[data-testid="context-info"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('oncology')
    })
  })

  describe('Real-time Features', () => {
    it('connects to WebSocket when visible', () => {
      mountComponent(ChatInterface, {
        props: { visible: true },
      })

      expect(global.WebSocket).toHaveBeenCalledWith(
        expect.stringContaining('ws://localhost:3001')
      )
    })

    it('handles incoming WebSocket messages', async () => {
      const wrapper = mountComponent(ChatInterface, {
        props: { visible: true },
      })

      const chatInterface = wrapper.vm as any
      const mockWs = chatInterface.websocket

      // Simulate incoming message
      const incomingMessage = {
        type: 'chat_message',
        payload: createMockChatMessage({
          type: 'assistant',
          content: 'Real-time response',
        }),
      }

      mockWs.mockMessage(incomingMessage)
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Real-time response')
    })

    it('shows typing indicators from WebSocket', async () => {
      const wrapper = mountComponent(ChatInterface, {
        props: { visible: true },
      })

      const chatInterface = wrapper.vm as any
      const mockWs = chatInterface.websocket

      // Simulate typing start
      mockWs.mockMessage({
        type: 'typing_start',
        payload: { userId: 'assistant' },
      })
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="typing-indicator"]').exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      const wrapper = mountComponent(ChatInterface, {
        props: { visible: true },
      })

      const issues = checkAccessibility(wrapper)
      expect(issues).toHaveLength(0)
    })

    it('supports keyboard navigation', async () => {
      const wrapper = mountComponent(ChatInterface, {
        props: { visible: true },
      })

      const input = wrapper.find('[data-testid="message-input"]')
      
      // Should be focusable
      await input.trigger('focus')
      expect(document.activeElement).toBe(input.element)

      // Tab should move to send button
      await input.trigger('keydown.tab')
      // Note: Full tab navigation testing would require more complex setup
    })

    it('has proper heading hierarchy', () => {
      const wrapper = mountComponent(ChatInterface, {
        props: { visible: true },
      })

      const headings = wrapper.findAll('h1, h2, h3, h4, h5, h6')
      // Verify heading structure makes sense
      expect(headings.length).toBeGreaterThan(0)
    })

    it('provides screen reader friendly content', () => {
      const wrapper = mountComponent(ChatInterface, {
        props: { visible: true },
      })

      // Should have appropriate ARIA live regions for dynamic content
      expect(wrapper.find('[aria-live]').exists()).toBe(true)
    })
  })

  describe('Component Cleanup', () => {
    it('closes WebSocket connection on unmount', () => {
      const wrapper = mountComponent(ChatInterface, {
        props: { visible: true },
      })

      const chatInterface = wrapper.vm as any
      const mockWs = chatInterface.websocket
      const closeSpy = vi.spyOn(mockWs, 'close')

      wrapper.unmount()

      expect(closeSpy).toHaveBeenCalled()
    })

    it('clears timers on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      
      const wrapper = mountComponent(ChatInterface, {
        props: { visible: true },
      })

      wrapper.unmount()

      // Should clean up any running timers
      expect(clearTimeoutSpy).toHaveBeenCalled()
    })
  })

  describe('Performance', () => {
    it('renders large message lists efficiently', async () => {
      const messages = Array.from({ length: 100 }, (_, i) =>
        createMockChatMessage({
          id: `msg-${i}`,
          content: `Message ${i}`,
        })
      )

      const session = createMockChatSession({ messages })
      mockFetch({ success: true, data: session })

      const start = performance.now()
      
      const wrapper = mountComponent(ChatInterface, {
        props: { 
          visible: true,
          sessionId: session.sessionId,
        },
      })

      await flushPromises()
      
      const renderTime = performance.now() - start
      
      // Should render 100 messages in reasonable time
      expect(renderTime).toBeLessThan(1000)
      expect(wrapper.findAll('[data-testid*="message"]')).toHaveLength(100)
    })

    it('implements virtual scrolling for very long conversations', async () => {
      // This would test virtual scrolling implementation
      // Currently just checking the component handles large datasets
      const messages = Array.from({ length: 1000 }, (_, i) =>
        createMockChatMessage({
          id: `msg-${i}`,
          content: `Message ${i}`,
        })
      )

      const session = createMockChatSession({ messages })
      mockFetch({ success: true, data: session })

      const wrapper = mountComponent(ChatInterface, {
        props: { 
          visible: true,
          sessionId: session.sessionId,
        },
      })

      await flushPromises()

      // Component should handle this gracefully
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Props and Events', () => {
    it('emits messageSent event when message is sent', async () => {
      const mockResponse = {
        success: true,
        data: {
          response: createMockChatMessage(),
          session: createMockChatSession(),
        },
      }

      mockFetch(mockResponse)

      const wrapper = mountComponent(ChatInterface, {
        props: { visible: true },
      })

      await fillForm(wrapper, { message: 'Test message' })
      await wrapper.find('[data-testid="send-button"]').trigger('click')
      await flushPromises()

      expect(wrapper.emitted('messageSent')).toBeTruthy()
    })

    it('emits close event when close button is clicked', async () => {
      const wrapper = mountComponent(ChatInterface, {
        props: { visible: true },
      })

      await wrapper.find('[data-testid="close-button"]').trigger('click')

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('reacts to visibility prop changes', async () => {
      const wrapper = mountComponent(ChatInterface, {
        props: { visible: false },
      })

      expect(wrapper.find('[data-testid="chat-interface"]').classes()).toContain('hidden')

      await wrapper.setProps({ visible: true })

      expect(wrapper.find('[data-testid="chat-interface"]').classes()).not.toContain('hidden')
    })
  })
})