import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Stack,
  Alert,
  CircularProgress,
  Button,
  Grid,
  Chip,
} from '@mui/material';
import { FilterList, Clear } from '@mui/icons-material';
import { useAdvancedSearchMutation, useGetPopularKeywordsQuery } from '@/services/api/searchApi';
import PaperList from '@/components/papers/PaperList';
import SearchFilters from '@/components/search/SearchFilters';
import { Paper } from '@/utils/types/papers';
import { ROUTES } from '@/utils/constants/routes';

interface SearchFilters {
  query?: string;
  authors?: string[];
  journalName?: string;
  keywords?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  isPublic?: boolean;
  uploadedBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const AdvancedSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'uploadedAt',
    sortOrder: 'desc',
    isPublic: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  const [advancedSearch, { data: searchData, isLoading: searchLoading, error: searchError }] = useAdvancedSearchMutation();
  const { data: popularKeywordsData } = useGetPopularKeywordsQuery(20);

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      sortBy: 'uploadedAt',
      sortOrder: 'desc',
      isPublic: true,
    });
    setHasSearched(false);
  };

  const handleSearch = async () => {
    try {
      await advancedSearch({
        ...filters,
        page: currentPage,
        limit: 12,
        sortBy: filters.sortBy as 'uploadedAt' | 'title' | 'journalName' | 'relevance',
      }).unwrap();
      setHasSearched(true);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (hasSearched) {
      handleSearch();
    }
  };

  const handleViewPaper = (paper: Paper) => {
    navigate(ROUTES.PAPERS.DETAIL(paper._id));
  };

  const handleDownloadPaper = (paper: Paper) => {
    // Handle download logic
    console.log('Downloading paper:', paper.title);
  };

  const handleKeywordClick = (keyword: string) => {
    setFilters(prev => ({
      ...prev,
      keywords: [...(prev.keywords || []), keyword],
    }));
  };

  const papers = searchData?.data.papers || [];
  const pagination = searchData?.data.pagination;
  const popularKeywords = popularKeywordsData?.data.keywords?.map(k => k.keyword) || [];

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.query) count++;
    if (filters.authors && filters.authors.length > 0) count++;
    if (filters.journalName) count++;
    if (filters.keywords && filters.keywords.length > 0) count++;
    if (filters.dateRange?.start || filters.dateRange?.end) count++;
    if (filters.uploadedBy) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Advanced Search
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Use advanced filters to find specific research papers
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Filters Sidebar */}
          <Grid item xs={12} md={4} lg={3}>
            <SearchFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              availableKeywords={popularKeywords}
            />
            
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<FilterList />}
                onClick={handleSearch}
                fullWidth
                disabled={searchLoading}
              >
                {searchLoading ? <CircularProgress size={20} /> : 'Search Papers'}
              </Button>
            </Box>

            {activeFiltersCount > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Active filters: {activeFiltersCount}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={handleClearFilters}
                  size="small"
                  fullWidth
                >
                  Clear All Filters
                </Button>
              </Box>
            )}
          </Grid>

          {/* Results */}
          <Grid item xs={12} md={8} lg={9}>
            <Stack spacing={3}>
              {/* Search Results Header */}
              {hasSearched && (
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Search Results
                      </Typography>
                      {pagination && (
                        <Typography variant="body2" color="text.secondary">
                          Found {pagination.totalItems.toLocaleString()} result{pagination.totalItems !== 1 ? 's' : ''}
                          {pagination.totalPages > 1 && ` across ${pagination.totalPages} page${pagination.totalPages !== 1 ? 's' : ''}`}
                        </Typography>
                      )}
                    </Box>
                    {activeFiltersCount > 0 && (
                      <Chip
                        label={`${activeFiltersCount} filter${activeFiltersCount !== 1 ? 's' : ''} active`}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Box>
              )}

              {/* Error Alert */}
              {searchError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Failed to perform search. Please try again.
                </Alert>
              )}

              {/* Search Results */}
              {hasSearched && (
                <PaperList
                  papers={papers}
                  loading={searchLoading}
                  error={searchError ? 'Failed to perform search' : undefined}
                  onViewPaper={handleViewPaper}
                  onDownloadPaper={handleDownloadPaper}
                  showFilters={false}
                  showPagination={true}
                  totalPages={pagination?.totalPages || 1}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                  
                />
              )}

              {/* Loading State */}
              {searchLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              )}

              {/* No Search State */}
              {!hasSearched && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <FilterList sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Set your search criteria
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Use the filters on the left to narrow down your search and find specific papers.
                  </Typography>
                  {popularKeywords.length > 0 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Popular keywords to try:
                      </Typography>
                      <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                        {popularKeywords.slice(0, 10).map((keyword) => (
                          <Chip
                            key={keyword}
                            label={keyword}
                            size="small"
                            variant="outlined"
                            onClick={() => handleKeywordClick(keyword)}
                            sx={{ cursor: 'pointer' }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              )}

              {/* No Results State */}
              {hasSearched && !searchLoading && papers.length === 0 && !searchError && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No results found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Try adjusting your search criteria or browse all papers.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(ROUTES.PAPERS.ALL)}
                  >
                    Browse All Papers
                  </Button>
                </Box>
              )}

              {/* Search Tips */}
              {hasSearched && papers.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Advanced Search Tips:
                  </Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Chip
                      label="Use multiple keywords"
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label="Filter by date range"
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label="Search specific journals"
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label="Find papers by authors"
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                </Box>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
};

export default AdvancedSearchPage;