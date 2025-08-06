import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Autocomplete,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  ExpandMore,
  FilterList,
  Clear,
  DateRange,
  Person,
  School,
  Tag,
} from '@mui/icons-material';

interface SearchFiltersProps {
  filters: {
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
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  availableJournals?: string[];
  availableAuthors?: string[];
  availableKeywords?: string[];
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  availableJournals = [],
  availableAuthors = [],
  availableKeywords = [],
}) => {
  const [expanded, setExpanded] = useState<string | false>('filters');

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    handleFilterChange('dateRange', {
      ...filters.dateRange,
      [field]: value,
    });
  };

  const handleKeywordChange = (keywords: string[]) => {
    handleFilterChange('keywords', keywords);
  };

  const handleAuthorChange = (authors: string[]) => {
    handleFilterChange('authors', authors);
  };

  const handleClearFilters = () => {
    onClearFilters();
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <FilterList />
          <Typography variant="h6">Search Filters</Typography>
        </Stack>

        <Accordion
          expanded={expanded === 'filters'}
          onChange={(_event, isExpanded) => setExpanded(isExpanded ? 'filters' : false)}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">Advanced Filters</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={3}>
              {/* Authors Filter */}
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="subtitle2">Authors</Typography>
                </Stack>
                <Autocomplete
                  multiple
                  options={availableAuthors}
                  value={filters.authors || []}
                  onChange={(_event, newValue) => handleAuthorChange(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select authors..."
                      size="small"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        size="small"
                        {...getTagProps({ index })}
                      />
                    ))
                  }
                />
              </Box>

              {/* Journal Filter */}
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <School sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="subtitle2">Journal</Typography>
                </Stack>
                <Autocomplete
                  options={availableJournals}
                  value={filters.journalName || ''}
                  onChange={(_event, newValue) => handleFilterChange('journalName', newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select journal..."
                      size="small"
                    />
                  )}
                />
              </Box>

              {/* Keywords Filter */}
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Tag sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="subtitle2">Keywords</Typography>
                </Stack>
                <Autocomplete
                  multiple
                  options={availableKeywords}
                  value={filters.keywords || []}
                  onChange={(_event, newValue) => handleKeywordChange(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select keywords..."
                      size="small"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        size="small"
                        {...getTagProps({ index })}
                      />
                    ))
                  }
                />
              </Box>

              {/* Date Range Filter */}
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <DateRange sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="subtitle2">Publication Date Range</Typography>
                </Stack>
                <Stack direction="row" spacing={2}>
                  <TextField
                    type="date"
                    label="From"
                    value={filters.dateRange?.start || ''}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    type="date"
                    label="To"
                    value={filters.dateRange?.end || ''}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
              </Box>

              {/* Uploaded By Filter */}
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="subtitle2">Uploaded By</Typography>
                </Stack>
                <TextField
                  placeholder="Enter username..."
                  value={filters.uploadedBy || ''}
                  onChange={(e) => handleFilterChange('uploadedBy', e.target.value)}
                  size="small"
                />
              </Box>

              {/* Public/Private Filter */}
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.isPublic !== false}
                      onChange={(e) => handleFilterChange('isPublic', e.target.checked)}
                    />
                  }
                  label="Show only public papers"
                />
              </Box>

              <Divider />

              {/* Sort Options */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Sort Options
                </Typography>
                <Stack direction="row" spacing={2}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Sort by</InputLabel>
                    <Select
                      value={filters.sortBy || 'uploadedAt'}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      label="Sort by"
                    >
                      <MenuItem value="uploadedAt">Upload Date</MenuItem>
                      <MenuItem value="title">Title</MenuItem>
                      <MenuItem value="journalName">Journal</MenuItem>
                      <MenuItem value="downloadCount">Downloads</MenuItem>
                      <MenuItem value="publication_date">Publication Date</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Order</InputLabel>
                    <Select
                      value={filters.sortOrder || 'desc'}
                      onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                      label="Order"
                    >
                      <MenuItem value="desc">Descending</MenuItem>
                      <MenuItem value="asc">Ascending</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </Box>

              {/* Clear Filters Button */}
              <Box>
                <Button
                  startIcon={<Clear />}
                  onClick={handleClearFilters}
                  variant="outlined"
                  size="small"
                >
                  Clear All Filters
                </Button>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default SearchFilters; 