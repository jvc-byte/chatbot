import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme({

  config,
  styles: {
    global: {
      body: {
        bg: 'gray.900',
        color: 'white',
      },
    },
  },
  components: {
    Container: {
      baseStyle: {
        maxW: 'container.md',
      },
    },
    Box: {
      baseStyle: {
        bg: 'gray.800',
        borderColor: 'gray.700',
      },
    },
    Input: {
      variants: {
        filled: {
          field: {
            bg: 'gray.700',
            _hover: {
              bg: 'gray.600',
            },
            _focus: {
              bg: 'gray.600',
              borderColor: 'blue.400',
            },
          },
        },
      },
      defaultProps: {
        variant: 'filled',
      },
    },
  },
});

export default theme;
