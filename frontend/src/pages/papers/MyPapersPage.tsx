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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add,
} from '@mui/icons-material';
import { useGetUserPapersQuery, useDeletePaperMutation } from '@/services/api/papersApi';
import PaperList from '@/components/papers/PaperList';
import { Paper } from '@/utils/types/papers';
import { ROUTES } from '@/utils/constants/routes';
import { useAuth } from '@/hooks/useAuth';

const MyPapersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    data: papersData,
    isLoading: papersLoading,
    error: papersError,
    refetch: refetchPapers,
  } = useGetUserPapersQuery(user?.id);

  const [deletePaper, { isLoading: deleteLoading }] = useDeletePaperMutation();

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewPaper = (paper: Paper) => {
    navigate(ROUTES.PAPERS.DETAIL(paper._id));
  };

  const handleDownloadPaper = (paper: Paper) => {
    // Handle download logic
    console.log('Downloading paper:', paper.title);
  };

  const handleKeywordClick = (keyword: string) => {
    // For My Papers, we could implement a different behavior
    // For now, just log the keyword
    console.log('Keyword clicked in My Papers:', keyword);
  };

  const confirmDelete = async () => {
    if (selectedPaper) {
      try {
        await deletePaper(selectedPaper._id).unwrap();
        setDeleteDialogOpen(false);
        setSelectedPaper(null);
        refetchPapers();
      } catch (error) {
        console.error('Failed to delete paper:', error);
      }
    }
  };

  const handleUploadClick = () => {
    navigate(ROUTES.PAPERS.UPLOAD);
  };

  const papers = papersData?.data.papers || [];
  const pagination = papersData?.data.pagination;

  const getPaperStats = () => {
    const total = papers.length;
    const publicPapers = papers.filter(p => p.isPublic).length;
    const privatePapers = total - publicPapers;
    const totalDownloads = papers.reduce((sum, p) => sum + p.downloadCount, 0);

    return { total, publicPapers, privatePapers, totalDownloads };
  };

  const stats = getPaperStats();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                My Papers
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage your uploaded research papers
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleUploadClick}
            >
              Upload New Paper
            </Button>
          </Stack>
        </Box>

        {/* Stats */}
        <Box>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Chip
              label={`${stats.total} Total Papers`}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`${stats.publicPapers} Public`}
              color="success"
              variant="outlined"
            />
            <Chip
              label={`${stats.privatePapers} Private`}
              color="default"
              variant="outlined"
            />
            <Chip
              label={`${stats.totalDownloads} Total Downloads`}
              color="info"
              variant="outlined"
            />
          </Stack>
        </Box>

        {/* Error Alert */}
        {papersError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load your papers. Please try again.
          </Alert>
        )}

        {/* Papers List */}
        <PaperList
          papers={papers}
          loading={papersLoading}
          error={papersError ? 'Failed to load papers' : undefined}
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
        {papersLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Empty State */}
        {!papersLoading && papers.length === 0 && !papersError && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No papers uploaded yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Start sharing your research by uploading your first paper.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleUploadClick}
            >
              Upload Your First Paper
            </Button>
          </Box>
        )}
      </Stack>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Paper</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedPaper?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyPapersPage;