# LLM Chat App Tests
This directory contains React Testing Library tests for the LLM Chat application.

## ❗❗ OUT OF DATE❗❗

## Structure

```
test/
├── setup.ts           # Test configuration and global mocks
└── App.test.tsx       # Tests for the main App component
```

The test structure mirrors the `src/` directory structure.

## What's Tested

### App Component Tests

✅ **UI Rendering**
- Chat interface renders correctly
- Empty state displays properly
- Input field and send button are present

✅ **User Interactions**
- User can type in input field
- Messages send via button click
- Messages send via Enter key
- Empty messages are prevented
- Loading state prevents multiple sends

✅ **API Integration**
- Correct API calls to chat completion endpoint
- Conversation history included in requests
- Proper message format (role/content structure)
- API error handling
- Network error handling

✅ **State Management**
- Loading states work correctly
- Message history accumulates properly
- Input field clears after sending
- UI updates during API calls

✅ **Message Display**
- User and LLM messages display correctly
- Timestamps are shown
- Message content renders properly

## Running Tests

```bash
# Run all tests once
npm run test:run

# Run tests in watch mode
npm run test

# Run tests with UI (if installed)
npm run test:ui

# Run with coverage (if configured)
npm run test:coverage
```

## Test Mocks

- **fetch**: Mocked globally to simulate API responses
- **CSS imports**: Mocked to prevent styling issues in tests
- **Console errors**: Expected errors during error testing are captured

## Key Testing Patterns

1. **User Event Testing**: Uses `@testing-library/user-event` for realistic user interactions
2. **Async Testing**: Uses `waitFor` for API response testing
3. **Mock Management**: Each test resets mocks for isolation
4. **Error Boundary Testing**: Tests both API and network error scenarios

## Example Test Structure

```tsx
it('test description', async () => {
  const user = userEvent.setup()
  
  // Mock API response
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ completion: 'Response' })
  })
  
  render(<App />)
  
  // User interaction
  await user.type(input, 'Hello')
  await user.click(sendButton)
  
  // Assertions
  expect(screen.getByText('Hello')).toBeInTheDocument()
  await waitFor(() => {
    expect(screen.getByText('Response')).toBeInTheDocument()
  })
})
```

## Adding New Tests

When adding new features to the app:

1. Add tests to the corresponding test file in the `test/` directory
2. Follow the same structure as `src/` 
3. Use descriptive test names
4. Test both happy path and error scenarios
5. Mock external dependencies appropriately
