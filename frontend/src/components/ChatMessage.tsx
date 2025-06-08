import React from 'react';
import { Box, Text } from '@chakra-ui/react';
import { Message } from '../types/chat';

interface ChatMessageProps {
    message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const isUser = message.role === 'user';

    return (
        <Box
            display="flex"
            justifyContent={isUser ? 'flex-end' : 'flex-start'}
            mb={4}
        >
            <Box
                maxW="70%"
                bg={isUser ? 'blue.500' : 'gray.700'}
                color="white"
                p={3}
                borderRadius="lg"
            >
                <Text>{message.content}</Text>
            </Box>
        </Box>
    );
};

export default ChatMessage;
