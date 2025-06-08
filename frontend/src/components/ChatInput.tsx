import React, { useState } from 'react';
import { Input, Button, Flex } from '@chakra-ui/react';

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    isLoading: boolean;
    placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, placeholder = 'Type your message...' }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && !isLoading) {
            onSendMessage(message);
            setMessage('');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Flex gap={2}>
                <Input
                    flex={1}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={placeholder}
                    disabled={isLoading}
                />
                <Button
                    type="submit"
                    colorScheme="blue"
                    isLoading={isLoading}
                >
                    Send
                </Button>
            </Flex>
        </form>
    );
};

export default ChatInput;
