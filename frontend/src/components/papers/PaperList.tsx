import React, { useState } from 'react';
import {
  Grid,
  Box,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import PaperCard from './PaperCard';
import { Paper } from '@/utils/types/papers';

interface PaperListProps {
  papers: Paper[];
  loading?: boolean;
  error?: string;
  onViewPaper?: (paper: Paper) => void;
  onDownloadPaper?: (paper: Paper) => void;
  onKeywordClick?: (keyword: string) => void;
  showFilters?: boolean;
  showPagination?: boolean;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

const PaperList: React.FC<PaperListProps> = ({
  papers,
  loading = false,
  error,
  onViewPaper,
  onDownloadPaper,
  onKeywordClick,
  showFilters = true,
  showPagination = true,
  totalPages = 1,
  currentPage = 1,
  onPageChange,
}) => {
  const [sortBy, setSortBy] = useState('uploadedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const handleViewPaper = (paper: Paper) => {
    if (onViewPaper) {
      onViewPaper(paper);
    }
  };

  const handleDownloadPaper = (paper: Paper) => {
    if (onDownloadPaper) {
      onDownloadPaper(paper);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }



  return (
    <Box>
      {/* View Controls */}
      {showFilters && (
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort by"
              >
                <MenuItem value="uploadedAt">Upload Date</MenuItem>
                <MenuItem value="title">Title</MenuItem>
                <MenuItem value="journalName">Journal</MenuItem>
                <MenuItem value="downloadCount">Downloads</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Order</InputLabel>
              <Select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                label="Order"
              >
                <MenuItem value="desc">Descending</MenuItem>
                <MenuItem value="asc">Ascending</MenuItem>
              </Select>
            </FormControl>


          </Stack>
        </Box>
      )}

      {/* Papers List */}
      <Grid container spacing={3}>
        {papers.map((paper) => (
          <Grid
            item
            key={paper._id}
            xs={12}
          >
            <PaperCard
              paper={paper}
              onView={handleViewPaper}
              onDownload={handleDownloadPaper}
              onKeywordClick={onKeywordClick}
            />
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
};

export default PaperList; 