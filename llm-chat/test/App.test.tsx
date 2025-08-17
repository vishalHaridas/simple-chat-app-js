import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'

// Mock CSS import
vi.mock('../src/App.css', () => ({}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('App Component', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders chat interface correctly', () => {
    render(<App />)
    
    // Check for main elements
    expect(screen.getByText('LLM Chat')).toBeInTheDocument()
    expect(screen.getByText('Start a conversation with your LLM!')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
  })

  it('allows user to type in input field', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    await user.type(input, 'Hello, world!')
    
    expect(input).toHaveValue('Hello, world!')
  })

  it('sends message when Send button is clicked', async () => {
    const user = userEvent.setup()
    
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        completion: 'Hello! How can I help you?',
        model: 'openai/gpt-oss-20b:free',
        usage: { prompt_tokens: 10, completion_tokens: 25, total_tokens: 35 }
      })
    })

    render(<App />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: 'Send' })
    
    // Type message and send
    await user.type(input, 'Hello!')
    await user.click(sendButton)
    
    // Check that input is cleared
    expect(input).toHaveValue('')
    
    // Check that user message appears
    expect(screen.getByText('Hello!')).toBeInTheDocument()
    
    // Wait for API response and check LLM message appears
    await waitFor(() => {
      expect(screen.getByText('Hello! How can I help you?')).toBeInTheDocument()
    })
    
    // Verify fetch was called with correct data structure
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: expect.any(String),
    })
  })

  it('sends message when Enter key is pressed', async () => {
    const user = userEvent.setup()
    
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        completion: 'Hi there!',
        model: 'openai/gpt-oss-20b:free'
      })
    })

    render(<App />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    
    // Type message and press Enter
    await user.type(input, 'Test message{enter}')
    
    // Check that user message appears
    expect(screen.getByText('Test message')).toBeInTheDocument()
    
    // Wait for API response
    await waitFor(() => {
      expect(screen.getByText('Hi there!')).toBeInTheDocument()
    })
  })

  it('includes conversation history in API calls', async () => {
    const user = userEvent.setup()
    
    // Mock two successful responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          completion: 'First response',
          model: 'openai/gpt-oss-20b:free'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          completion: 'Second response',
          model: 'openai/gpt-oss-20b:free'
        })
      })

    render(<App />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: 'Send' })
    
    // Send first message
    await user.type(input, 'First message')
    await user.click(sendButton)
    
    await waitFor(() => {
      expect(screen.getByText('First response')).toBeInTheDocument()
    })
    
    // Send second message
    await user.type(input, 'Second message')
    await user.click(sendButton)
    
    // Check that second API call includes conversation history
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
    
    const secondCall = mockFetch.mock.calls[1]
    const secondCallBody = JSON.parse(secondCall[1].body)
    
    expect(secondCallBody.messages).toEqual([
      { role: 'user', content: 'First message' },
      { role: 'assistant', content: 'First response' },
      { role: 'user', content: 'Second message' }
    ])
  })

  it('shows loading state during API call', async () => {
    const user = userEvent.setup()
    
    // Mock a delayed response
    let resolvePromise: (value: any) => void
    const delayedPromise = new Promise(resolve => {
      resolvePromise = resolve
    })
    
    mockFetch.mockReturnValueOnce(delayedPromise)

    render(<App />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: 'Send' })
    
    await user.type(input, 'Test message')
    await user.click(sendButton)
    
    // Check loading state
    expect(screen.getByPlaceholderText('Waiting for response...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sending...' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sending...' })).toBeDisabled()
    expect(input).toBeDisabled()
    
    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: async () => ({
        completion: 'Response',
        model: 'openai/gpt-oss-20b:free'
      })
    })
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup()
    
    // Mock API error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    })

    render(<App />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: 'Send' })
    
    await user.type(input, 'Test message')
    await user.click(sendButton)
    
    // Check that user message appears
    expect(screen.getByText('Test message')).toBeInTheDocument()
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Sorry, I encountered an error/)).toBeInTheDocument()
    })
  })

  it('handles network errors gracefully', async () => {
    const user = userEvent.setup()
    
    // Mock network error
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<App />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: 'Send' })
    
    await user.type(input, 'Test message')
    await user.click(sendButton)
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/Sorry, I encountered an error/)).toBeInTheDocument()
    })
  })

  it('prevents sending empty messages', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const sendButton = screen.getByRole('button', { name: 'Send' })
    
    // Try to send empty message
    await user.click(sendButton)
    
    // No API call should be made
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('prevents sending messages while loading', async () => {
    const user = userEvent.setup()
    
    // Mock a delayed response that never resolves
    const delayedPromise = new Promise(() => {})
    mockFetch.mockReturnValueOnce(delayedPromise)

    render(<App />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: 'Send' })
    
    // Send first message
    await user.type(input, 'First message')
    await user.click(sendButton)
    
    // Try to send another message while loading
    await user.type(input, 'Second message')
    await user.click(sendButton)
    
    // Only one API call should be made
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('displays message timestamps correctly', async () => {
    const user = userEvent.setup()
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        completion: 'Response message',
        model: 'openai/gpt-oss-20b:free'
      })
    })

    render(<App />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: 'Send' })
    
    await user.type(input, 'Test message')
    await user.click(sendButton)
    
    // Wait for both messages to appear and check timestamps
    await waitFor(() => {
      expect(screen.getByText('Response message')).toBeInTheDocument()
    })
    
    // Check that timestamps are displayed (time format like "12:34:56" or "1:23:45 PM")
    const timeElements = screen.getAllByText(/\d{1,2}:\d{2}/)
    expect(timeElements.length).toBeGreaterThanOrEqual(2) // User message + LLM response
  })

  it('correctly formats message history for API calls', async () => {
    const user = userEvent.setup()
    
    // Mock multiple successful responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ completion: 'Response 1' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ completion: 'Response 2' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ completion: 'Response 3' })
      })

    render(<App />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: 'Send' })
    
    // Send three messages to build conversation history
    await user.type(input, 'Message 1')
    await user.click(sendButton)
    
    await waitFor(() => {
      expect(screen.getByText('Response 1')).toBeInTheDocument()
    })
    
    await user.type(input, 'Message 2')
    await user.click(sendButton)
    
    await waitFor(() => {
      expect(screen.getByText('Response 2')).toBeInTheDocument()
    })
    
    await user.type(input, 'Message 3')
    await user.click(sendButton)
    
    // Check the third API call has full conversation history
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })
    
    const thirdCall = mockFetch.mock.calls[2]
    const thirdCallBody = JSON.parse(thirdCall[1].body)
    
    expect(thirdCallBody.messages).toEqual([
      { role: 'user', content: 'Message 1' },
      { role: 'assistant', content: 'Response 1' },
      { role: 'user', content: 'Message 2' },
      { role: 'assistant', content: 'Response 2' },
      { role: 'user', content: 'Message 3' }
    ])
  })
})
