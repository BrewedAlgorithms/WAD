import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Autocomplete,
  Chip,
  Stack,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
  Button,
  Collapse,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search,
  Clear,
  FilterList,
  ExpandMore,
  ExpandLess,
  Person,
  School,
  Tag,
  DateRange,
} from '@mui/icons-material';
import { useDebounce } from '@/hooks/useDebounce';
import { useGetAvailableAuthorsQuery, useGetAvailableJournalsQuery } from '@/services/api/searchApi';

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

interface AdvancedSearchBarProps {
  onSearch: (criteria: SearchCriteria) => void;
  loading?: boolean;
  placeholder?: string;
  defaultValue?: string;
  showAdvancedFilters?: boolean;
  currentCriteria?: SearchCriteria;
}

const AdvancedSearchBar: React.FC<AdvancedSearchBarProps> = ({
  onSearch,
  loading = false,
  placeholder = 'Search papers',
  defaultValue = '',
  showAdvancedFilters = true,
  currentCriteria,
}) => {
  // Fetch available authors and journals
  const { data: authorsData, isLoading: authorsLoading } = useGetAvailableAuthorsQuery(50);
  const { data: journalsData, isLoading: journalsLoading } = useGetAvailableJournalsQuery(50);
  
  const availableAuthors = authorsData?.data.authors || [];
  const availableJournals = journalsData?.data.journals || [];
  const [searchTerm, setSearchTerm] = useState(defaultValue);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [criteria, setCriteria] = useState<SearchCriteria>({
    query: defaultValue,
    keywords: [],
    authors: [],
    journalName: '',
    dateRange: { start: '', end: '' },
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  // Sync with parent criteria if provided
  useEffect(() => {
    if (currentCriteria) {
      setCriteria(currentCriteria);
      setSearchTerm(currentCriteria.query || '');
    }
  }, [currentCriteria]);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
      handleSearch({ ...criteria, query: debouncedSearchTerm });
    }
  }, [debouncedSearchTerm]);

  const handleSearch = (newCriteria: SearchCriteria) => {
    setCriteria(newCriteria);
    onSearch(newCriteria);
  };

  const handleClear = () => {
    const clearedCriteria: SearchCriteria = {
      query: '',
      keywords: [],
      authors: [],
      journalName: '',
      dateRange: { start: '', end: '' },
      sortBy: 'relevance',
      sortOrder: 'desc',
    };
    setSearchTerm('');
    setCriteria(clearedCriteria);
    onSearch(clearedCriteria);
  };



  const handleKeywordRemove = (keywordToRemove: string) => {
    const newKeywords = (criteria.keywords || []).filter(k => k !== keywordToRemove);
    const newCriteria = { ...criteria, keywords: newKeywords };
    setCriteria(newCriteria);
    onSearch(newCriteria);
  };

  const handleAuthorRemove = (authorToRemove: string) => {
    const newAuthors = (criteria.authors || []).filter(a => a !== authorToRemove);
    const newCriteria = { ...criteria, authors: newAuthors };
    setCriteria(newCriteria);
    onSearch(newCriteria);
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const newDateRange = { 
      start: field === 'start' ? value : (criteria.dateRange?.start || ''),
      end: field === 'end' ? value : (criteria.dateRange?.end || '')
    };
    const newCriteria = { ...criteria, dateRange: newDateRange };
    setCriteria(newCriteria);
    onSearch(newCriteria);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (criteria.query) count++;
    if (criteria.keywords && criteria.keywords.length > 0) count++;
    if (criteria.authors && criteria.authors.length > 0) count++;
    if (criteria.journalName) count++;
    if (criteria.dateRange?.start || criteria.dateRange?.end) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Box sx={{ width: '100%' }}>
      {/* Main Search Input */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {loading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : (
                  <Stack direction="row" spacing={1}>
                    {showAdvancedFilters && (
                      <Button
                        size="small"
                        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                        color={isAdvancedOpen ? 'primary' : 'inherit'}
                        variant="text"
                        startIcon={isAdvancedOpen ? <ExpandLess /> : <ExpandMore />}
                        sx={{ 
                          minWidth: 'auto',
                          px: 1,
                          py: 0.5,
                          fontSize: '0.75rem',
                          textTransform: 'none'
                        }}
                      >
                        Filters
                      </Button>
                    )}
                    {activeFiltersCount > 0 && (
                      <IconButton
                        size="small"
                        onClick={handleClear}
                        edge="end"
                      >
                        <Clear />
                      </IconButton>
                    )}
                  </Stack>
                )}
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: 'background.paper',
            },
          }}
        />
      </Box>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && !isAdvancedOpen && (
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {criteria.keywords?.map((keyword) => (
              <Chip
                key={keyword}
                label={keyword}
                size="small"
                onDelete={() => handleKeywordRemove(keyword)}
                color="primary"
                variant="outlined"
              />
            ))}
            {criteria.authors?.map((author) => (
              <Chip
                key={author}
                label={`Author: ${author}`}
                size="small"
                onDelete={() => handleAuthorRemove(author)}
                color="secondary"
                variant="outlined"
              />
            ))}
            {criteria.journalName && (
              <Chip
                label={`Journal: ${criteria.journalName}`}
                size="small"
                onDelete={() => {
                  const newCriteria = { ...criteria, journalName: '' };
                  setCriteria(newCriteria);
                  onSearch(newCriteria);
                }}
                color="info"
                variant="outlined"
              />
            )}
            {(criteria.dateRange?.start || criteria.dateRange?.end) && (
              <Chip
                label={`Date: ${criteria.dateRange?.start || 'Any'} - ${criteria.dateRange?.end || 'Any'}`}
                size="small"
                onDelete={() => {
                  const newCriteria = { ...criteria, dateRange: { start: '', end: '' } };
                  setCriteria(newCriteria);
                  onSearch(newCriteria);
                }}
                color="warning"
                variant="outlined"
              />
            )}
          </Stack>
        </Box>
      )}

      {/* Advanced Filters */}
      <Collapse in={isAdvancedOpen}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterList />
                Advanced Filters
              </Typography>

              <Stack direction="row" spacing={2} flexWrap="wrap">
                {/* Keywords */}
                <Box sx={{ minWidth: 200, flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <Tag sx={{ fontSize: 16, mr: 0.5 }} />
                    Keywords
                  </Typography>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={[]}
                    value={criteria.keywords || []}
                    onChange={(_event, newValue) => {
                      const newCriteria = { ...criteria, keywords: newValue };
                      setCriteria(newCriteria);
                      onSearch(newCriteria);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Type keywords..."
                        size="small"
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return (
                          <Chip
                            key={key}
                            label={option}
                            size="small"
                            {...tagProps}
                          />
                        );
                      })
                    }
                  />
                </Box>

                {/* Authors */}
                <Box sx={{ minWidth: 200, flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <Person sx={{ fontSize: 16, mr: 0.5 }} />
                    Authors
                  </Typography>
                  <Autocomplete
                    multiple
                    options={availableAuthors}
                    value={criteria.authors || []}
                    loading={authorsLoading}
                    onChange={(_event, newValue) => {
                      const newCriteria = { ...criteria, authors: newValue };
                      setCriteria(newCriteria);
                      onSearch(newCriteria);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder={authorsLoading ? "Loading authors..." : "Select authors..."}
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {authorsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return (
                          <Chip
                            key={key}
                            label={option}
                            size="small"
                            {...tagProps}
                          />
                        );
                      })
                    }
                  />
                </Box>

                {/* Journal */}
                <Box sx={{ minWidth: 200, flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <School sx={{ fontSize: 16, mr: 0.5 }} />
                    Journal
                  </Typography>
                  <Autocomplete
                    options={availableJournals}
                    value={criteria.journalName || ''}
                    loading={journalsLoading}
                    onChange={(_event, newValue) => {
                      const newCriteria = { ...criteria, journalName: newValue || '' };
                      setCriteria(newCriteria);
                      onSearch(newCriteria);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder={journalsLoading ? "Loading journals..." : "Select journal..."}
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {journalsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Box>
              </Stack>

              {/* Date Range and Sort */}
              <Stack direction="row" spacing={2} flexWrap="wrap">
                {/* Date Range */}
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <DateRange sx={{ fontSize: 16, mr: 0.5 }} />
                    Publication Date Range
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      type="date"
                      label="From"
                      value={criteria.dateRange?.start || ''}
                      onChange={(e) => handleDateRangeChange('start', e.target.value)}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      type="date"
                      label="To"
                      value={criteria.dateRange?.end || ''}
                      onChange={(e) => handleDateRangeChange('end', e.target.value)}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Stack>
                </Box>

                {/* Sort Options */}
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Sort Options
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Sort by</InputLabel>
                      <Select
                        value={criteria.sortBy || 'relevance'}
                        onChange={(e) => {
                          const newCriteria = { ...criteria, sortBy: e.target.value as any };
                          setCriteria(newCriteria);
                          onSearch(newCriteria);
                        }}
                        label="Sort by"
                      >
                        <MenuItem value="relevance">Relevance</MenuItem>
                        <MenuItem value="uploadedAt">Upload Date</MenuItem>
                        <MenuItem value="title">Title</MenuItem>
                        <MenuItem value="journalName">Journal</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <InputLabel>Order</InputLabel>
                      <Select
                        value={criteria.sortOrder || 'desc'}
                        onChange={(e) => {
                          const newCriteria = { ...criteria, sortOrder: e.target.value as 'asc' | 'desc' };
                          setCriteria(newCriteria);
                          onSearch(newCriteria);
                        }}
                        label="Order"
                      >
                        <MenuItem value="desc">Descending</MenuItem>
                        <MenuItem value="asc">Ascending</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                </Box>
              </Stack>

              {/* Clear All Button */}
              {activeFiltersCount > 0 && (
                <Box>
                  <Button
                    startIcon={<Clear />}
                    onClick={handleClear}
                    variant="outlined"
                    size="small"
                  >
                    Clear All Filters
                  </Button>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Collapse>


    </Box>
  );
};

export default AdvancedSearchBar; 