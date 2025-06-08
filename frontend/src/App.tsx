import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, VStack, HStack, Input, Button, Text, useToast, IconButton, useDisclosure, extendTheme, ChakraProvider, Icon } from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, AddIcon, ChatIcon, SettingsIcon, AtSignIcon } from '@chakra-ui/icons';
import ConversationList from './components/ConversationList';
import axios from 'axios';

// Configure axios defaults
const api = axios.create({
  baseURL: '', // Use relative paths for Vercel deployment
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log('Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log('Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    if (axios.isAxiosError(error)) {
      console.error('Response Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    } else {
      console.error('Unexpected Error:', error);
    }
    return Promise.reject(error);
  }
);

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: '#f7f7a0',
        color: '#1f2937',
        '&::-webkit-scrollbar': {
          width: '0.4rem',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'transparent',
          borderRadius: '4px',
        },
      },
      '&::-webkit-scrollbar': {
        width: '0.4rem',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: 'transparent',
        borderRadius: '4px',
      },
    },
  },
  colors: {
    brand: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'medium',
        borderRadius: 'lg',
        _focus: {
          boxShadow: 'none',
        },
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
            _disabled: {
              bg: 'brand.500',
            },
          },
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: 'lg',
          _focus: {
            borderColor: 'brand.400',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-400)',
          },
        },
      },
    },
  },
});

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const { isOpen: isSidebarOpen, onToggle: toggleSidebar } = useDisclosure({ defaultIsOpen: true });
  const toast = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate a temporary ID for new conversations until saved to the backend
  const generateTempId = () => `temp-${Date.now()}`;

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations from the backend
  const fetchConversations = useCallback(async () => {
    try {
      const response = await api.get('/api/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      if (axios.isAxiosError(error)) {
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
      }
      toast({
        title: 'Error',
        description: 'Failed to load conversations. Check console for details.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load messages when conversation changes
  const fetchMessages = useCallback(async (conversationId: string) => {
    console.log('Fetching messages for conversation:', conversationId);
    if (!conversationId) {
      console.log('No conversation ID provided, skipping message fetch');
      return;
    }

    try {
      const url = `/api/conversations/${conversationId}/messages`;
      console.log('Making request to:', url);
      const response = await api.get(url);
      console.log('Received messages:', response.data);
      
      // Ensure we have valid data
      if (!response.data) {
        console.warn('No data in response');
        return;
      }
      
      let messagesToSet = [];
      
      // Handle different response formats
      if (Array.isArray(response.data)) {
        messagesToSet = response.data;
      } else if (response.data.messages && Array.isArray(response.data.messages)) {
        messagesToSet = response.data.messages;
      } else if (response.data.conversation?.messages) {
        messagesToSet = response.data.conversation.messages;
      } else {
        console.warn('Unexpected response format:', response.data);
        return;
      }
      
      // Define a type for the message object we expect
      interface MessageData {
        id?: string;
        content?: string;
        message?: string;
        role?: 'user' | 'assistant';
        timestamp?: string;
      }

      // Ensure all messages have required fields
      const processedMessages = messagesToSet.map((msg: MessageData) => ({
        id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: msg.content || msg.message || '',
        role: msg.role || 'assistant',
        timestamp: msg.timestamp || new Date().toISOString()
      }));
      
      console.log('Setting messages:', processedMessages);
      setMessages(processedMessages);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      
      let errorMessage = 'Failed to load messages';
      if (axios.isAxiosError(error)) {
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
        
        // Extract error message if available
        if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      // Set empty messages to prevent UI issues
      setMessages([]);
    }
  }, [toast]);

  useEffect(() => {
    console.log('Current conversation ID changed:', currentConversationId);
    if (currentConversationId) {
      if (!currentConversationId.startsWith('temp-')) {
        fetchMessages(currentConversationId);
      } else {
        console.log('Skipping message fetch for temporary conversation ID');
        setMessages([]);
      }
    } else {
      console.log('No conversation selected, clearing messages');
      setMessages([]);
    }
  }, [currentConversationId, fetchMessages]);

  // Send a new message
  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    setIsSending(true);

    // Create a temporary user message ID that we'll update later
    const tempMessageId = `temp-${Date.now()}`;
    const userMessage: Message = {
      id: tempMessageId,
      content: message,
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    // Optimistically update the UI with the user's message
    setMessages(prev => [...prev, userMessage]);

    try {
      console.log('Sending message:', {
        message,
        conversation_id: currentConversationId?.startsWith('temp-') ? null : currentConversationId,
      });

      const response = await api.post('/api/chat', {
        message,
        conversation_id: currentConversationId?.startsWith('temp-') ? null : currentConversationId,
      });

      console.log('Received response:', response.data);

      // The backend returns the message directly in the response.data
      const responseData = response.data;
      
      // Ensure we have valid response data
      if (!responseData) {
        throw new Error('Empty response from server');
      }

      // Create the assistant message
      const assistantMessage: Message = {
        id: responseData.id || `msg-${Date.now()}`,
        content: typeof responseData === 'string' 
          ? responseData 
          : responseData.content || responseData.response || JSON.stringify(responseData),
        role: 'assistant',
        timestamp: responseData.timestamp || new Date().toISOString(),
      };

      // Update the messages state with the assistant's response
      // and ensure we don't have any duplicate messages
      setMessages(prev => {
        // Filter out any temporary messages with the same content
        const filtered = prev.filter(msg => 
          !(msg.id === tempMessageId && msg.content === message)
        );
        return [...filtered, {
          ...userMessage,
          id: responseData.message_id || userMessage.id
        }, assistantMessage];
      });

      // Handle conversation ID updates
      const newConversationId = responseData.conversation_id;
      if (newConversationId && newConversationId !== currentConversationId) {
        console.log('New conversation created with ID:', newConversationId);
        setCurrentConversationId(newConversationId);
      }

      // Refresh the conversation list
      await fetchConversations();
      
      // Force a re-render of the messages
      setMessages(prev => [...prev]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to send message';
      
      if (axios.isAxiosError(error)) {
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
        
        // Try to extract a meaningful error message
        if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      // Re-add the message to the UI even if there was an error
      // This ensures the user can see their message and try again
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        content: `Error: ${errorMessage}`,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const Sidebar = () => (
    <Box
      w={{ base: '280px', md: '280px' }}
      h="100vh"
      bg="white"
      boxShadow="md"
      display={{ base: isSidebarOpen ? 'block' : 'none', md: 'block' }}
      position="fixed"
      left={0}
      top={0}
      zIndex={10}
      overflowY="auto"
      overflowX="hidden"
      borderRight="1px"
      borderColor="gray.200"
      css={{
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'transparent',
          borderRadius: '4px',
        },
        '&:hover': {
          '&::-webkit-scrollbar-thumb': {
            background: '#c1c1c1',
          },
        },
      }}
    >
      <VStack h="100%" spacing={0} align="stretch">
        <Box p={4} borderBottomWidth="1px" borderColor="gray.100">
          <Text fontSize="lg" fontWeight="bold" color="brand.600">Chatbot</Text>
        </Box>
        <Box p={3}>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="brand"
            size="sm"
            w="100%"
            onClick={() => {
              setCurrentConversationId(generateTempId());
              setMessages([]);
              if (window.innerWidth < 768) {
                toggleSidebar();
              }
            }}
          >
            New Chat
          </Button>
        </Box>
        <Box flex={1} overflowY="auto" px={2}>
          <ConversationList
            conversations={conversations}
            onSelectConversation={(id) => {
              setCurrentConversationId(id);
              if (window.innerWidth < 768) {
                toggleSidebar();
              }
            }}
            currentConversationId={currentConversationId}
            onClose={toggleSidebar}
          />
        </Box>
        <Box p={3} borderTopWidth="1px" borderColor="gray.200">
          <Text fontSize="xs" color="gray.500" textAlign="center">
            Chatbot v1.0
          </Text>
        </Box>
      </VStack>
    </Box>
  );

  return (
    <ChakraProvider theme={theme}>
      <Box h="100vh" bg="gray.50" position="relative">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <Box
          h="100vh"
          ml={{ base: 0, md: '280px' }}
          display="flex"
          flexDirection="column"
          bg="white"
          position="relative"
        >
          {/* Mobile header */}
          <Box
            p={3}
            display={{ base: 'flex', md: 'none' }}
            alignItems="center"
            borderBottomWidth="1px"
            borderBottomColor="gray.200"
            bg="white"
          >
            <IconButton
              aria-label="Toggle sidebar"
              icon={isSidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
              onClick={toggleSidebar}
              variant="ghost"
              size="sm"
              colorScheme="gray"
              mr={2}
            />
            <Text fontSize="md" fontWeight="medium">Chatbot</Text>
          </Box>

          {/* Messages */}
          <Box
            flex={1}
            overflowY="auto"
            w="100%"
            px={{ base: 4, md: 6 }}
            py={4}
            pb={28}
            css={{
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'transparent',
                borderRadius: '4px',
              },
              '&:hover': {
                '&::-webkit-scrollbar-thumb': {
                  background: '#c1c1c1',
                },
              },
            }}
          >
            {messages.length === 0 ? (
              <VStack
                justify="center"
                h="100%"
                textAlign="center"
                px={4}
                maxW="2xl"
                mx="auto"
                spacing={6}
              >
                <Box p={4} bg="brand.50" borderRadius="full">
                  <ChatIcon w={10} h={10} color="brand.500" />
                </Box>
                <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                  How can I help you today?
                </Text>
                <Text color="gray.500" maxW="md">
                  Ask me anything or continue from previous conversation.
                </Text>
              </VStack>
            ) : (
              <Box maxW="xl" mx="auto" w="100%" py={4}>
                {messages.map((msg) => (
                  <Box
                    key={msg.id}
                    mb={4}
                    alignSelf={msg.role === 'user' ? 'flex-end' : 'flex-start'}
                  >
                    <Box
                      maxW="90%"
                      p={4}
                      borderRadius="lg"
                      bg={msg.role === 'user' ? 'brand.500' : 'blue.100'}
                      color={msg.role === 'user' ? 'white' : 'gray.800'}
                      boxShadow="sm"
                      ml={msg.role === 'user' ? 'auto' : 0}
                      mr={msg.role === 'user' ? 0 : 'auto'}
                    >
                      <HStack spacing={2} mb={2} align="center">
                        {msg.role === 'user' ? (
                          <Box p={1} bg="brand.50" borderRadius="full" color="brand.600" boxShadow="sm" display="flex" alignItems="center" justifyContent="center" w={6} h={6}>
                            <Icon as={AtSignIcon} boxSize={3} color="brand.600" />
                          </Box>
                        ) : (
                          <Box p={1} bg="brand.500" borderRadius="full" color="white" boxShadow="sm" display="flex" alignItems="center" justifyContent="center" w={6} h={6}>
                            <Icon as={SettingsIcon} boxSize={3} transform="rotate(45deg)" color="white" />
                          </Box>
                        )}
                        <Text
                          fontSize="sm"
                          fontWeight="medium"
                          color={msg.role === 'user' ? 'whiteAlpha.900' : 'gray.600'}
                        >
                          {msg.role === 'user' ? 'You' : 'Chatbot'}
                        </Text>
                      </HStack>
                      <Text
                        whiteSpace="pre-wrap"
                        lineHeight="tall"
                      >
                        {msg.content}
                      </Text>
                    </Box>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </Box>
            )}
          </Box>

          {/* Input area */}
          <Box
            position="fixed"
            bottom={0}
            left={{ base: 0, md: '280px' }}
            right={0}
            bg="white"
            p={4}
            borderTopWidth="1px"
            borderTopColor="gray.200"
            boxShadow="0 -2px 10px rgba(0,0,0,0.05)"
          >
            <Box maxW="2xl" mx="auto">
              <HStack spacing={3}>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && input.trim() && !isSending) {
                      sendMessage(input);
                      setInput('');
                    }
                  }}
                  placeholder="Type your message..."
                  disabled={isSending}
                  size="md"
                  bg="white"
                  borderColor="gray.300"
                  _hover={{
                    borderColor: 'gray.400',
                  }}
                />
                <Button
                  onClick={() => {
                    if (input.trim() && !isSending) {
                      sendMessage(input);
                      setInput('');
                    }
                  }}
                  colorScheme="brand"
                  isLoading={isSending}
                  disabled={!input.trim() || isSending}
                  px={6}
                >
                  Send
                </Button>
              </HStack>
              <Text mt={2} fontSize="xs" textAlign="center" color="gray.500">
                Chatbot may produce inaccurate information.
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    </ChakraProvider>
  );
};

export default App;