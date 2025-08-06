import React, { useState, useEffect } from 'react';
import {
  TextField,
  Autocomplete,
  Box,
  IconButton,
  InputAdornment,
  CircularProgress,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import {
  Search,
  Clear,
  TrendingUp,
  History,
} from '@mui/icons-material';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onKeywordClick?: (keyword: string) => void;
  suggestions?: string[];
  popularKeywords?: string[];
  recentSearches?: string[];
  loading?: boolean;
  placeholder?: string;
  defaultValue?: string;
  showPopularKeywords?: boolean;
  showRecentSearches?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onKeywordClick,
  suggestions = [],
  popularKeywords = [],
  recentSearches = [],
  loading = false,
  placeholder = 'Search papers...',
  defaultValue = '',
  showPopularKeywords = true,
  showRecentSearches = true,
}) => {
  const [searchTerm, setSearchTerm] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
      onSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearch]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      onSearch(value.trim());
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  const handleKeywordClick = (keyword: string) => {
    setSearchTerm(keyword);
    onSearch(keyword);
    if (onKeywordClick) {
      onKeywordClick(keyword);
    }
  };

  const handleRecentSearchClick = (search: string) => {
    setSearchTerm(search);
    onSearch(search);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Autocomplete
        freeSolo
        options={suggestions}
        value={searchTerm}
        onChange={(_event, newValue) => {
          if (typeof newValue === 'string') {
            handleSearch(newValue);
          }
        }}
        onInputChange={(_event, newInputValue) => {
          setSearchTerm(newInputValue);
        }}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
        loading={loading}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            variant="outlined"
            fullWidth
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {loading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : searchTerm ? (
                    <IconButton
                      size="small"
                      onClick={handleClear}
                      edge="end"
                    >
                      <Clear />
                    </IconButton>
                  ) : null}
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
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Search sx={{ fontSize: 16, color: 'text.secondary' }} />
              <span>{option}</span>
            </Stack>
          </Box>
        )}
        noOptionsText={
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              No suggestions found
            </Typography>
            {showPopularKeywords && popularKeywords.length > 0 && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Popular keywords:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {popularKeywords.slice(0, 5).map((keyword) => (
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
        }
        ListboxProps={{
          style: {
            maxHeight: 300,
          },
        }}
      />

      {/* Popular Keywords */}
      {showPopularKeywords && popularKeywords.length > 0 && !isOpen && (
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <TrendingUp sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Popular keywords:
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {popularKeywords.slice(0, 8).map((keyword) => (
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

      {/* Recent Searches */}
      {showRecentSearches && recentSearches.length > 0 && !isOpen && (
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <History sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Recent searches:
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {recentSearches.slice(0, 5).map((search) => (
              <Chip
                key={search}
                label={search}
                size="small"
                variant="outlined"
                onClick={() => handleRecentSearchClick(search)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default SearchBar; 