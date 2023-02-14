import { Box, ChakraProvider, extendTheme, Text } from '@chakra-ui/react';
import { Inter } from '@next/font/google';
import supabase from 'api/client';
import { AppProps } from 'next/app';
import { FC, useEffect } from 'react';
import { useUrls } from 'store/useUrls';

const inter = Inter({ subsets: ['latin'] });
const config = {
  initialColorMode: 'lighthouse',
  useSystemColorMode: false,
};

const theme = extendTheme({ config });

const App: FC<AppProps> = ({ Component, pageProps }) => {
  const setUrls = useUrls((e) => e.setUrls);

  useEffect(() => {
    void (async (): Promise<void> => {
      const { data } = await supabase.from('urls').select();
      setUrls(data as any); // TODO: typecheck this better
    })();
  }, [setUrls]);

  return (
    <main className={inter.className}>
      <ChakraProvider theme={theme}>
        <Box p={4} h="60px" bg="teal" color="white">
          <Box maxW={1280} m="auto">
            <Text>Lighthouse Dashboard</Text>
          </Box>
        </Box>
        <Component {...pageProps} />
      </ChakraProvider>
    </main>
  );
};

export default App;
