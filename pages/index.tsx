import { ViewIcon } from '@chakra-ui/icons';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  CircularProgress,
  CircularProgressLabel,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import supabase from 'api/client';
import { FC, useState } from 'react';
import { useUrls } from 'store/useUrls';
import { isValidUrl } from 'utils/isValidUrl';

const Home: FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [urlToAnalyze, setUrlToAnalyze] = useState('');
  const [title, setTitle] = useState('');
  const [urls, setUrls] = useUrls((e) => [e.urls, e.setUrls]);
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [data, setData] = useState<any>(null);
  const [categoryResults, setCategoryResults] = useState<{ name: string; value: number }[]>([]);
  const uniqueUrls = urls.map((item) => item.url);

  const onModalClose = (): void => {
    onClose();
    setUrlToAnalyze('');
  };

  const addToDatabase = async (): Promise<void> => {
    setAddLoading(true);

    try {
      const lighthouse = data?.lighthouseResult;
      const performance = lighthouse.categories.performance.score;
      const accessibility = lighthouse.categories.accessibility.score;
      const best_practices = lighthouse.categories['best-practices'].score;
      const pwa = lighthouse.categories.pwa.score;
      const seo = lighthouse.categories.seo.score;

      if (!uniqueUrls.includes(urlToAnalyze)) {
        const { data: urlData, error: urlError } = await supabase
          .from('urls')
          .insert({
            url: data.id,
            title,
          })
          .select();

        if (!urlError) {
          setUrls([...urls, ...urlData]);
        } else {
          // eslint-disable-next-line
          console.log(urlError);
        }
      }

      const { data: insertData, error } = await supabase
        .from('results')
        .insert({
          url: data.id,
          accessibility,
          best_practices,
          performance,
          pwa,
          seo,
        })
        .select();

      // eslint-disable-next-line
      console.log(insertData);

      if (error) {
        throw Error(error.message);
      }
    } catch (ex) {
      //eslint-disable-next-line
      console.error(ex);
    } finally {
      onModalClose();
      setAddLoading(false);
    }
  };

  const runPageSpeedInsights = async (): Promise<void> => {
    if (!isValidUrl(urlToAnalyze)) {
      toast({
        title: 'Invalid URL Provided',
        position: 'bottom-right',
        status: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${urlToAnalyze}&key=${process.env.NEXT_PUBLIC_GPSI_APIKEY}&category=ACCESSIBILITY&category=BEST_PRACTICES&category=PERFORMANCE&category=PWA&category=SEO&strategy=desktop`
      );
      const results = await response.json();
      setData(results);

      const lighthouse = results.lighthouseResult.categories;
      setCategoryResults([
        {
          name: 'Performance',
          value: lighthouse.performance.score,
        },
        {
          name: 'Accessibility',
          value: lighthouse.accessibility.score,
        },
        {
          name: 'Best Practices',
          value: lighthouse['best-practices'].score,
        },
        {
          name: 'SEO',
          value: lighthouse.seo.score,
        },
        {
          name: 'PWA',
          value: lighthouse.pwa.score,
        },
      ]);

      onOpen();
    } catch (ex) {
      // eslint-disable-next-line
      console.error(ex);
    } finally {
      setLoading(false);
    }
  };

  const getColor = (value: number): string => {
    if (value >= 0.9) {
      return 'green.400';
    }

    if (value >= 0.5) {
      return 'yellow.400';
    }

    return 'red.400';
  };

  return (
    <Box maxW={1280} m="auto" pt={4}>
      <Flex w="50%">
        <Input
          mr={4}
          placeholder="Enter a website url"
          value={urlToAnalyze}
          onChange={(e): void => setUrlToAnalyze(e.target.value)}
        />
        <Button
          colorScheme="teal"
          onClick={runPageSpeedInsights}
          isLoading={loading}
          fontSize="sm"
          isDisabled={!urlToAnalyze}
        >
          ANALYZE
        </Button>
      </Flex>

      {urls.length ? (
        <TableContainer mt="4">
          <Table variant="striped">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Url</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {urls.map((item) => (
                <Tr key={item.url}>
                  <Td>{item.title}</Td>
                  <Td>{item.url}</Td>
                  <Td>
                    <Button colorScheme="green">
                      <ViewIcon />
                    </Button>
                    <Button colorScheme="blue" ml={3}>
                      Re-run
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      ) : (
        <Box mt="4">
          <Alert status="info">
            <AlertIcon />
            No URL analyzed tet.
          </Alert>
        </Box>
      )}

      <Modal isOpen={isOpen} onClose={onModalClose} isCentered size="2xl" closeOnOverlayClick={false}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Lighthouse Results</ModalHeader>
          <ModalCloseButton />
          {data && (
            <>
              <ModalBody>
                <Box display="flex" justifyContent="space-evenly" my="8">
                  {categoryResults.map((item) => (
                    <Box textAlign="center" key={item.name}>
                      <CircularProgress value={item.value * 100} color={getColor(item.value)} size="70px">
                        <CircularProgressLabel>{item.value * 100}%</CircularProgressLabel>
                      </CircularProgress>
                      <Text>{item.name}</Text>
                    </Box>
                  ))}
                </Box>

                {!uniqueUrls.includes(data.id) && (
                  <>
                    <Alert status="info" mb="4">
                      <AlertIcon />
                      Do you want to add this results to the database?
                    </Alert>

                    <FormControl>
                      <FormLabel>Title</FormLabel>
                      <Input onChange={(e): void => setTitle(e.target.value)} value={title} />
                    </FormControl>
                  </>
                )}
              </ModalBody>

              <ModalFooter>
                {uniqueUrls.includes(data.id) ? (
                  <Button colorScheme="teal" mr={3} onClick={addToDatabase} isLoading={addLoading}>
                    Save these results
                  </Button>
                ) : (
                  <Button colorScheme="teal" mr={3} isDisabled={!title} onClick={addToDatabase} isLoading={addLoading}>
                    Add
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Home;
