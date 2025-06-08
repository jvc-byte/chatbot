import React from 'react';
import { Box, VStack, Text, HStack, IconButton } from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';

interface ConversationListProps {
  conversations: Array<{
    id: string;
    title: string;
    updated_at: string;
  }>;
  onSelectConversation: (id: string) => void;
  currentConversationId: string | null;
  onClose?: () => void;
  onCreateNew?: () => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onSelectConversation,
  onCreateNew,
  currentConversationId,
  onClose,
}) => {
  return (
    <VStack align="stretch" spacing={2} p={4} borderRightWidth="1px" h="100vh" overflowY="auto">
      <HStack justify="space-between" mb={4}>
        <Text fontWeight="bold">Conversations</Text>
        {onClose && (
          <IconButton
            aria-label="Close menu"
            icon={<CloseIcon />}
            size="sm"
            variant="ghost"
            onClick={onClose}
            display={{ base: 'flex', md: 'none' }}
          />
        )}
      </HStack>
      
      {conversations.map((conv) => (
        <Box
          key={conv.id}
          p={2}
          borderRadius="md"
          bg={currentConversationId === conv.id ? 'blue.100' : 'transparent'}
          _hover={{ bg: 'gray.100', cursor: 'pointer' }}
          onClick={() => onSelectConversation(conv.id)}
        >
          <Text isTruncated fontWeight={currentConversationId === conv.id ? 'bold' : 'normal'}>
            {conv.title}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {new Date(conv.updated_at).toLocaleString()}
          </Text>
        </Box>
      ))}
    </VStack>
  );
};

export default ConversationList;