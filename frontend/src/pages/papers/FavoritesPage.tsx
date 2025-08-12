import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Stack, Box, Typography, Alert, CircularProgress, Button } from '@mui/material';
import { Favorite } from '@mui/icons-material';
import PaperList from '@/components/papers/PaperList';
import { useGetMyFavoritesQuery } from '@/services/api/papersApi';
import { ROUTES } from '@/utils/constants/routes';
import type { Paper } from '@/utils/types/papers';

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  // Pagination can be added later if needed
  const { data, isLoading, error } = useGetMyFavoritesQuery();

  const papers = data?.data?.papers || [];

  // const handlePageChange = (page: number) => setCurrentPage(page);
  const handleViewPaper = (paper: Paper) => navigate(ROUTES.PAPERS.DETAIL(paper._id));
  const handleDownloadPaper = (_paper: Paper) => {};

  // const handleUnfavorite = async (paper: Paper) => {
  //   try {
  //     await toggleFavorite(paper._id).unwrap();
  //     refetch();
  //   } catch (e) {
  //     console.error('Failed to unfavorite', e);
  //   }
  // };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Favorites
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Your saved research papers
              </Typography>
            </Box>
            <Button variant="outlined" startIcon={<Favorite />} disabled>
              {papers.length} saved
            </Button>
          </Stack>
        </Box>

        {error && (
          <Alert severity="error">Failed to load favorites. Please try again.</Alert>
        )}

        <PaperList
          papers={papers}
          loading={isLoading}
          error={error ? 'Failed to load favorites' : undefined}
          onViewPaper={handleViewPaper}
          onDownloadPaper={handleDownloadPaper}
          onKeywordClick={() => {}}
          showFilters={false}
          showPagination={false}
        />

        {!isLoading && papers.length === 0 && !error && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Favorite sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No favorites yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Browse papers and tap the heart icon to save them here.
            </Typography>
            <Button variant="contained" onClick={() => navigate(ROUTES.PAPERS.ALL)}>Browse Papers</Button>
          </Box>
        )}

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
      </Stack>
    </Container>
  );
};

export default FavoritesPage;
