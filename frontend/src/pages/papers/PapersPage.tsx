import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useGetAllPapersQuery } from '@/services/api/papersApi';
import { useAdvancedSearchMutation } from '@/services/api/searchApi';
import PaperList from '@/components/papers/PaperList';
import AdvancedSearchBar from '@/components/search/AdvancedSearchBar';
import { Paper } from '@/utils/types/papers';
import { ROUTES } from '@/utils/constants/routes';

interface SearchCriteria {
  query?: string;
  keywords?: string[];
  authors?: string[];
  journalName?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: 'relevance' | 'uploadedAt' | 'title' | 'journalName';
  sortOrder?: 'asc' | 'desc';
}

const PapersPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const location = useLocation();
  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialQuery = urlParams.get('q') || '';
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({ query: initialQuery });
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);

  // Advanced search mutation
  const [advancedSearch, { data: searchData, isLoading: searchLoading, error: searchError }] = useAdvancedSearchMutation();

  // Regular papers query for initial load
  const {
    data: papersData,
    isLoading: papersLoading,
    error: papersError,
  } = useGetAllPapersQuery({
    page: currentPage,
    limit: 12,
    sort: 'uploadedAt',
    order: 'desc',
  });

  const handleSearch = async (criteria: SearchCriteria) => {
    // Prevent duplicate calls for the same query while in-flight
    const normalizedQuery = (criteria.query || '').trim();
    if (isSearching && normalizedQuery === (searchCriteria.query || '').trim()) {
      return;
    }

    setSearchCriteria({ ...criteria, query: normalizedQuery });
    setCurrentPage(1);
    
    // If we have search criteria, use advanced search
    if (criteria.query || criteria.keywords?.length || criteria.authors?.length || criteria.journalName) {
      setHasSearched(true);
      setIsSearching(true);
      try {
        await advancedSearch({
          query: normalizedQuery,
          filters: {
            keywords: criteria.keywords,
            authors: criteria.authors,
            journalName: criteria.journalName,
            dateRange: criteria.dateRange,
          },
          sortBy: criteria.sortBy || 'relevance',
          page: 1,
          limit: 12,
        }).unwrap();
      } catch (error) {
        console.error('Advanced search failed:', error);
      } finally {
        setIsSearching(false);
      }
    } else {
      // Reset to show all papers
      setHasSearched(false);
    }
  };

  // auto-trigger search if q is in URL
  React.useEffect(() => {
    if (initialQuery) {
      handleSearch({ query: initialQuery });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    
    // If we're in search mode, perform search with new page
    if (hasSearched) {
      advancedSearch({
        query: searchCriteria.query,
        filters: {
          keywords: searchCriteria.keywords,
          authors: searchCriteria.authors,
          journalName: searchCriteria.journalName,
          dateRange: searchCriteria.dateRange,
        },
        sortBy: searchCriteria.sortBy || 'relevance',
        page,
        limit: 12,
      });
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
    // Filter papers by the clicked keyword
    const newCriteria = { 
      ...searchCriteria, 
      keywords: [keyword],
      query: '' // Clear any existing query to focus on keyword
    };
    setSearchCriteria(newCriteria);
    handleSearch(newCriteria);
  };

  // Upload button removed from Papers page per request

  // Determine which data to use
  const papers = hasSearched ? (searchData?.data.papers || []) : (papersData?.data.papers || []);
  const pagination = hasSearched ? searchData?.data.pagination : papersData?.data.pagination;
  const loading = hasSearched ? searchLoading : papersLoading;
  const error = hasSearched ? searchError : papersError;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Header */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="h4" component="h1" gutterBottom>
                    All Papers
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Discover and explore research papers from the community
                  </Typography>
                </Box>
              </Stack>
            </Box>

        {/* Advanced Search Bar */}
        <Box>
          <AdvancedSearchBar
            onSearch={handleSearch}
            placeholder="Search papers"
            defaultValue={searchCriteria.query || ''}
            showAdvancedFilters={true}
            currentCriteria={searchCriteria}
          />
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load papers. Please try again.
          </Alert>
        )}

        {/* Papers List */}
        <PaperList
          papers={papers}
          loading={loading}
          error={error ? 'Failed to load papers' : undefined}
          onViewPaper={handleViewPaper}
          onDownloadPaper={handleDownloadPaper}
          onKeywordClick={handleKeywordClick}
          showFilters={true}
          showPagination={true}
          totalPages={pagination?.totalPages || 1}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Empty State */}
        {!loading && papers.length === 0 && !error && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No papers found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {hasSearched
                ? 'Try adjusting your search criteria or browse all papers.'
                : 'Browse recent papers or try a different query.'}
            </Typography>
          </Box>
        )}
      </Stack>
    </Container>
  );
};

export default PapersPage;