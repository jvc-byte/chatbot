import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import App from './App';

describe('App', () => {
  it('renders the chat interface', () => {
    render(
      <ChakraProvider>
        <App />
      </ChakraProvider>
    );
    
    // Check for the input field
    const inputElement = screen.getByPlaceholderText('Type your message...');
    expect(inputElement).toBeInTheDocument();
    
    // Check for the send button
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeInTheDocument();
  });
});
