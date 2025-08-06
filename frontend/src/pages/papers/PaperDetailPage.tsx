import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  Box,
  Typography,
  Container,
  Stack,
  Alert,
  CircularProgress,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Download,
  Edit,
  Delete,
  Share,
  Person,
  School,
  Tag,
  Description,
  FileDownload,
  Link,
  TrendingUp,
  Psychology,
  Assessment,
  ExpandMore,
  Visibility,
  PictureAsPdf,
} from '@mui/icons-material';
import { useGetPaperByIdQuery, useDeletePaperMutation } from '@/services/api/papersApi';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatRelativeDate } from '@/utils/helpers/dateUtils';
import { ROUTES } from '@/utils/constants/routes';


const PaperDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Debug authentication state
  console.log('PaperDetailPage - Auth state:', { user, token, isAuthenticated, id });
  console.log('PaperDetailPage - localStorage token:', localStorage.getItem('token'));

  const {
    data: paperData,
    isLoading: paperLoading,
    error: paperError,
  } = useGetPaperByIdQuery(id!, {
    // Skip the query if not authenticated
    skip: !isAuthenticated || !id,
  });

  // Debug query state
  console.log('PaperDetailPage - Query state:', { 
    paperData, 
    paperLoading, 
    paperError, 
    isAuthenticated, 
    id 
  });

  const [deletePaper, { isLoading: deleteLoading }] = useDeletePaperMutation();

  const paper = paperData?.data.paper;

  const handleEdit = () => {
    if (paper) {
      navigate(ROUTES.PAPERS.EDIT(paper._id));
    }
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (paper) {
      try {
        await deletePaper(paper._id).unwrap();
        navigate(ROUTES.PAPERS.MY_PAPERS);
      } catch (error) {
        console.error('Failed to delete paper:', error);
      }
    }
  };

  const handleViewPaper = () => {
    if (paper) {
      // Use Cloudinary URL if available, otherwise fallback to download endpoint
      const viewUrl = paper.cloudinary?.url || `/api/v1/papers/${paper._id}/download`;
      
      // Debug logging
      console.log('View URL:', viewUrl);
      console.log('Cloudinary data:', paper.cloudinary);
      
      // Open in new window
      window.open(viewUrl, '_blank');
    }
  };

  const handleShare = () => {
    if (paper) {
      navigator.clipboard.writeText(window.location.href);
      // Could show a snackbar notification here
    }
  };

  const isOwner = user?.id === paper?.uploadedBy._id;

  if (paperLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (paperError || !paper) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Paper not found or you don't have permission to view it.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {paper.title}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Chip
                  label={paper.isPublic ? 'Public' : 'Private'}
                  color={paper.isPublic ? 'success' : 'default'}
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  Uploaded {formatRelativeDate(paper.createdAt)}
                </Typography>
              </Stack>
            </Box>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Share">
                <IconButton onClick={handleShare}>
                  <Share />
                </IconButton>
              </Tooltip>
              {isOwner && (
                <>
                  <Tooltip title="Edit">
                    <IconButton onClick={handleEdit}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={handleDelete} color="error">
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Stack>
          </Stack>
        </Box>

        <Grid container spacing={3}>
          {/* Main Content */}
          <Grid item xs={12} lg={8}>
            <Stack spacing={3}>
              {/* Summary Section (1st) */}
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <Description color="primary" />
                    <Typography variant="h6">Summary</Typography>
                  </Stack>
                  
                  {/* Abstract */}
                  {paper.abstract && (
                    <Box sx={{ mb: 3 }}>
                      <Box 
                        sx={{ 
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText',
                          px: 2,
                          py: 1,
                          borderRadius: 1,
                          mb: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <Description fontSize="small" />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Abstract
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                        {paper.abstract}
                      </Typography>
                    </Box>
                  )}

                  {/* Detailed Summary */}
                  {paper.detailed_summary && (
                    <Box>
                      <Box 
                        sx={{ 
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText',
                          px: 2,
                          py: 1,
                          borderRadius: 1,
                          mb: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <Assessment fontSize="small" />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Detailed Summary
                        </Typography>
                      </Box>
                      <Box 
                        sx={{ 
                          lineHeight: 1.6,
                          wordBreak: 'break-word',
                          '& h3': {
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            mt: 3,
                            mb: 1,
                            color: 'text.primary'
                          },
                          '& h4': {
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            mt: 2,
                            mb: 1,
                            color: 'text.primary'
                          },
                          '& p': {
                            mb: 1.5,
                            lineHeight: 1.6
                          },
                          '& strong': {
                            fontWeight: 600,
                            color: 'text.primary'
                          },
                          '& em': {
                            fontStyle: 'italic'
                          },
                          '& ul, & ol': {
                            pl: 2,
                            mb: 1.5
                          },
                          '& li': {
                            mb: 0.5
                          }
                        }}
                      >
                        <ReactMarkdown>
                          {paper.detailed_summary}
                        </ReactMarkdown>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>



              {/* AI Analysis Section (3rd) */}
              {paper.gemini_analysis && (
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                      <Psychology color="primary" />
                      <Typography variant="h6">Research Analysis</Typography>
                    </Stack>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle1">Detailed Analysis</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2}>
                          {paper.gemini_analysis.research_area && (
                            <Box>
                              <Typography variant="subtitle2" gutterBottom>
                                Research Area
                              </Typography>
                              <Typography variant="body2">
                                {paper.gemini_analysis.research_area}
                              </Typography>
                            </Box>
                          )}
                          {paper.gemini_analysis.methodology && (
                            <Box>
                              <Typography variant="subtitle2" gutterBottom>
                                Methodology
                              </Typography>
                              <Typography variant="body2">
                                {paper.gemini_analysis.methodology}
                              </Typography>
                            </Box>
                          )}
                          {paper.gemini_analysis.key_findings && paper.gemini_analysis.key_findings.length > 0 && (
                            <Box>
                              <Typography variant="subtitle2" gutterBottom>
                                Key Findings
                              </Typography>
                              <List dense>
                                {paper.gemini_analysis.key_findings.map((finding, index) => (
                                  <ListItem key={index}>
                                    <ListItemIcon>
                                      <TrendingUp fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary={finding} />
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          )}
                          {paper.gemini_analysis.research_impact && (
                            <Box>
                              <Typography variant="subtitle2" gutterBottom>
                                Research Impact
                              </Typography>
                              <Typography variant="body2">
                                {paper.gemini_analysis.research_impact}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  </CardContent>
                </Card>
              )}

              {/* Additional Information */}
              <Stack spacing={3}>
                {/* Authors */}
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                      <Person color="primary" />
                      <Typography variant="h6">Authors</Typography>
                    </Stack>
                    <Typography variant="body1">
                      {paper.authors.join(', ')}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Journal Information */}
                {paper.journalName && (
                  <Card>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <School color="primary" />
                        <Typography variant="h6">Journal</Typography>
                      </Stack>
                      <Typography variant="body1">
                        {paper.journalName}
                      </Typography>
                      {paper.publication_date && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Published: {formatDate(paper.publication_date)}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Keywords */}
                {paper.keywords && paper.keywords.length > 0 && (
                  <Card>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <Tag color="primary" />
                        <Typography variant="h6">Keywords</Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {paper.keywords.map((keyword, index) => (
                          <Chip
                            key={index}
                            label={keyword}
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                )}
              </Stack>
            </Stack>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              {/* File Information */}
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <FileDownload color="primary" />
                    <Typography variant="h6">File Information</Typography>
                  </Stack>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="File Name"
                        secondary={paper.fileName}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="File Size"
                        secondary={paper.formattedFileSize}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="File Type"
                        secondary={paper.mimeType}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Downloads"
                        secondary={paper.downloadCount}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              {/* Upload Information */}
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <Person color="primary" />
                    <Typography variant="h6">Uploaded By</Typography>
                  </Stack>
                  <Typography variant="body1" gutterBottom>
                    {paper.uploadedBy.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(paper.createdAt)}
                  </Typography>
                </CardContent>
              </Card>

              {/* Processing Information */}
              {paper.processing_info && (
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                      <Assessment color="primary" />
                      <Typography variant="h6">Processing Info</Typography>
                    </Stack>
                    <List dense>
                      {paper.processing_info.extraction_method && (
                        <ListItem>
                          <ListItemText
                            primary="Extraction Method"
                            secondary={paper.processing_info.extraction_method}
                          />
                        </ListItem>
                      )}
                      {paper.processing_info.ai_processing_time && (
                        <ListItem>
                          <ListItemText
                            primary="AI Processing Time"
                            secondary={`${paper.processing_info.ai_processing_time}ms`}
                          />
                        </ListItem>
                      )}
                      {paper.processing_info.gemini_tokens_used && (
                        <ListItem>
                          <ListItemText
                            primary="Tokens Used"
                            secondary={paper.processing_info.gemini_tokens_used.toLocaleString()}
                          />
                        </ListItem>
                      )}
                      {paper.processing_info.confidence_score && (
                        <ListItem>
                          <ListItemText
                            primary="Confidence Score"
                            secondary={`${(paper.processing_info.confidence_score * 100).toFixed(1)}%`}
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Actions
                  </Typography>
                  <Stack spacing={2}>
                    {paper.paperLink && (
                      <Button
                        variant="outlined"
                        startIcon={<Link />}
                        href={paper.paperLink}
                        target="_blank"
                        fullWidth
                      >
                        View Original
                      </Button>
                    )}
                    {isOwner && (
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={handleEdit}
                        fullWidth
                      >
                        Edit Paper
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
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
            Are you sure you want to delete "{paper.title}"? This action cannot be undone.
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

      {/* Floating View PDF Button - Always Visible */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <Tooltip title="View PDF" placement="left">
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<PictureAsPdf />}
            onClick={handleViewPaper}
            sx={{
              borderRadius: '50px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
              },
            }}
          >
            Read the paper
          </Button>
        </Tooltip>
      </Box>
    </Container>
  );
};

export default PaperDetailPage;