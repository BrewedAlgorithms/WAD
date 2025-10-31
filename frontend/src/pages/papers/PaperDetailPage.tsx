import React, { useMemo, useState } from 'react';
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
  Favorite,
  FavoriteBorder,
  VerifiedUser,
  Science,
} from '@mui/icons-material';
import { useGetPaperByIdQuery, useDeletePaperMutation, useGetRelatedPapersQuery, useToggleFavoriteMutation, useAnalyzeGorardSieveMutation } from '@/services/api/papersApi';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatRelativeDate } from '@/utils/helpers/dateUtils';
import { ROUTES } from '@/utils/constants/routes';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;


const PaperDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pdfScale, setPdfScale] = useState<number>(1.1);
  const [isAnalyzingGorardSieve, setIsAnalyzingGorardSieve] = useState(false);

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
  const [analyzeGorardSieve] = useAnalyzeGorardSieveMutation();

  const paper = paperData?.data.paper;
  const paperId = id!;
  const { data: relatedData } = useGetRelatedPapersQuery(paperId, { skip: !isAuthenticated || !paperId });
  const [toggleFavorite] = useToggleFavoriteMutation();

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
      setPdfOpen(true);
    }
  };

  const handleShare = () => {
    if (paper) {
      navigator.clipboard.writeText(window.location.href);
      // Could show a snackbar notification here
    }
  };

  const handleAnalyzeGorardSieve = async () => {
    if (paper) {
      setIsAnalyzingGorardSieve(true);
      try {
        await analyzeGorardSieve(paper._id).unwrap();
        // The query will automatically refetch due to cache invalidation
      } catch (error) {
        console.error('Failed to analyze with Gorard Sieve:', error);
      } finally {
        setIsAnalyzingGorardSieve(false);
      }
    }
  };

  const isOwner = user?.id === paper?.uploadedBy._id;
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const relatedPapers = useMemo(() => relatedData?.data?.papers || [], [relatedData]);

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
              <Tooltip title="Share (Ctrl+C)">
                <IconButton onClick={handleShare}>
                  <Share />
                </IconButton>
              </Tooltip>
              {paper && (
                <Tooltip title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}>
                  <IconButton
                    onClick={async () => {
                      try {
                        const res = await toggleFavorite(paper._id).unwrap();
                        setIsFavorited(res.data.favorited);
                      } catch (e) {
                        console.error('Favorite toggle failed', e);
                      }
                    }}
                    color={isFavorited ? 'error' : 'default'}
                  >
                    {isFavorited ? <Favorite /> : <FavoriteBorder />}
                  </IconButton>
                </Tooltip>
              )}
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

              {/* Gorard Sieve Trustworthiness Rating Section (2nd) */}
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <VerifiedUser color="primary" />
                      <Typography variant="h6">Trustworthiness Rating (Gorard Sieve)</Typography>
                    </Stack>
                    {isOwner && !paper.gorard_sieve_rating && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Science />}
                        onClick={handleAnalyzeGorardSieve}
                        disabled={isAnalyzingGorardSieve}
                      >
                        {isAnalyzingGorardSieve ? 'Analyzing...' : 'Analyze'}
                      </Button>
                    )}
                  </Stack>

                  {paper.gorard_sieve_rating ? (
                    <>
                      {/* Overall Rating Display */}
                      <Box
                        sx={{
                          backgroundColor: paper.gorard_sieve_rating.overall_rating >= 3 
                            ? '#e8f5e9'  // Light green
                            : paper.gorard_sieve_rating.overall_rating >= 2 
                            ? '#fff3e0'  // Light orange
                            : '#ffebee', // Light red
                          border: `3px solid ${
                            paper.gorard_sieve_rating.overall_rating >= 3 
                            ? '#4caf50'  // Green
                            : paper.gorard_sieve_rating.overall_rating >= 2 
                            ? '#ff9800'  // Orange
                            : '#f44336'  // Red
                          }`,
                          p: 4,
                          borderRadius: 3,
                          mb: 3,
                          textAlign: 'center',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                      >
                        <Typography 
                          variant="h2" 
                          sx={{ 
                            fontWeight: 800, 
                            color: paper.gorard_sieve_rating.overall_rating >= 3 
                              ? '#2e7d32'  // Dark green
                              : paper.gorard_sieve_rating.overall_rating >= 2 
                              ? '#e65100'  // Dark orange
                              : '#c62828', // Dark red
                            mb: 1 
                          }}
                        >
                          {paper.gorard_sieve_rating.overall_rating}/4
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#424242', fontWeight: 600, mb: 0.5 }}>
                          Overall Trustworthiness Score
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#616161', maxWidth: '600px', mx: 'auto', mt: 2, lineHeight: 1.6 }}>
                          Based on the "lowest link" principle - the minimum score across all categories
                        </Typography>
                        {paper.gorard_sieve_rating.analysis_date && (
                          <Typography variant="caption" sx={{ color: '#757575', display: 'block', mt: 1.5 }}>
                            Analyzed on {formatDate(paper.gorard_sieve_rating.analysis_date)}
                          </Typography>
                        )}
                      </Box>

                      {/* Detailed Breakdown */}
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                        Detailed Breakdown
                      </Typography>

                      {/* Design */}
                      <Accordion sx={{ mb: 1, '&:before': { display: 'none' }, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <AccordionSummary 
                          expandIcon={<ExpandMore />}
                          sx={{ 
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' },
                            borderLeft: `4px solid ${paper.gorard_sieve_rating.design.score >= 3 ? '#4caf50' : paper.gorard_sieve_rating.design.score >= 2 ? '#ff9800' : '#f44336'}`
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                            <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 600 }}>
                              Design (Research Design Quality)
                            </Typography>
                            <Chip 
                              label={`${paper.gorard_sieve_rating.design.score}/4`} 
                              sx={{
                                backgroundColor: paper.gorard_sieve_rating.design.score >= 3 ? '#4caf50' : paper.gorard_sieve_rating.design.score >= 2 ? '#ff9800' : '#f44336',
                                color: 'white',
                                fontWeight: 700
                              }}
                              size="small"
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ backgroundColor: 'rgba(0,0,0,0.01)' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                            {paper.gorard_sieve_rating.design.reasoning}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>

                      {/* Scale */}
                      <Accordion sx={{ mb: 1, '&:before': { display: 'none' }, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <AccordionSummary 
                          expandIcon={<ExpandMore />}
                          sx={{ 
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' },
                            borderLeft: `4px solid ${paper.gorard_sieve_rating.scale.score >= 3 ? '#4caf50' : paper.gorard_sieve_rating.scale.score >= 2 ? '#ff9800' : '#f44336'}`
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                            <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 600 }}>
                              Scale (Sample Size and Scope)
                            </Typography>
                            <Chip 
                              label={`${paper.gorard_sieve_rating.scale.score}/4`} 
                              sx={{
                                backgroundColor: paper.gorard_sieve_rating.scale.score >= 3 ? '#4caf50' : paper.gorard_sieve_rating.scale.score >= 2 ? '#ff9800' : '#f44336',
                                color: 'white',
                                fontWeight: 700
                              }}
                              size="small"
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ backgroundColor: 'rgba(0,0,0,0.01)' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                            {paper.gorard_sieve_rating.scale.reasoning}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>

                      {/* Completeness of Data */}
                      <Accordion sx={{ mb: 1, '&:before': { display: 'none' }, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <AccordionSummary 
                          expandIcon={<ExpandMore />}
                          sx={{ 
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' },
                            borderLeft: `4px solid ${paper.gorard_sieve_rating.completeness_of_data.score >= 3 ? '#4caf50' : paper.gorard_sieve_rating.completeness_of_data.score >= 2 ? '#ff9800' : '#f44336'}`
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                            <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 600 }}>
                              Completeness of Data (Missing Data/Attrition)
                            </Typography>
                            <Chip 
                              label={`${paper.gorard_sieve_rating.completeness_of_data.score}/4`} 
                              sx={{
                                backgroundColor: paper.gorard_sieve_rating.completeness_of_data.score >= 3 ? '#4caf50' : paper.gorard_sieve_rating.completeness_of_data.score >= 2 ? '#ff9800' : '#f44336',
                                color: 'white',
                                fontWeight: 700
                              }}
                              size="small"
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ backgroundColor: 'rgba(0,0,0,0.01)' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                            {paper.gorard_sieve_rating.completeness_of_data.reasoning}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>

                      {/* Data Quality */}
                      <Accordion sx={{ mb: 1, '&:before': { display: 'none' }, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <AccordionSummary 
                          expandIcon={<ExpandMore />}
                          sx={{ 
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' },
                            borderLeft: `4px solid ${paper.gorard_sieve_rating.data_quality.score >= 3 ? '#4caf50' : paper.gorard_sieve_rating.data_quality.score >= 2 ? '#ff9800' : '#f44336'}`
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                            <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 600 }}>
                              Data Quality (Outcome Measures Quality)
                            </Typography>
                            <Chip 
                              label={`${paper.gorard_sieve_rating.data_quality.score}/4`} 
                              sx={{
                                backgroundColor: paper.gorard_sieve_rating.data_quality.score >= 3 ? '#4caf50' : paper.gorard_sieve_rating.data_quality.score >= 2 ? '#ff9800' : '#f44336',
                                color: 'white',
                                fontWeight: 700
                              }}
                              size="small"
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ backgroundColor: 'rgba(0,0,0,0.01)' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                            {paper.gorard_sieve_rating.data_quality.reasoning}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>

                      {/* Fidelity */}
                      <Accordion sx={{ mb: 1, '&:before': { display: 'none' }, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <AccordionSummary 
                          expandIcon={<ExpandMore />}
                          sx={{ 
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' },
                            borderLeft: `4px solid ${paper.gorard_sieve_rating.fidelity.score >= 3 ? '#4caf50' : paper.gorard_sieve_rating.fidelity.score >= 2 ? '#ff9800' : '#f44336'}`
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                            <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 600 }}>
                              Fidelity (Implementation Fidelity)
                            </Typography>
                            <Chip 
                              label={`${paper.gorard_sieve_rating.fidelity.score}/4`} 
                              sx={{
                                backgroundColor: paper.gorard_sieve_rating.fidelity.score >= 3 ? '#4caf50' : paper.gorard_sieve_rating.fidelity.score >= 2 ? '#ff9800' : '#f44336',
                                color: 'white',
                                fontWeight: 700
                              }}
                              size="small"
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ backgroundColor: 'rgba(0,0,0,0.01)' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                            {paper.gorard_sieve_rating.fidelity.reasoning}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>

                      {/* Validity */}
                      <Accordion sx={{ mb: 1, '&:before': { display: 'none' }, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        <AccordionSummary 
                          expandIcon={<ExpandMore />}
                          sx={{ 
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.02)' },
                            borderLeft: `4px solid ${paper.gorard_sieve_rating.validity.score >= 3 ? '#4caf50' : paper.gorard_sieve_rating.validity.score >= 2 ? '#ff9800' : '#f44336'}`
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                            <Typography variant="subtitle2" sx={{ flex: 1, fontWeight: 600 }}>
                              Validity (Overall Study Validity)
                            </Typography>
                            <Chip 
                              label={`${paper.gorard_sieve_rating.validity.score}/4`} 
                              sx={{
                                backgroundColor: paper.gorard_sieve_rating.validity.score >= 3 ? '#4caf50' : paper.gorard_sieve_rating.validity.score >= 2 ? '#ff9800' : '#f44336',
                                color: 'white',
                                fontWeight: 700
                              }}
                              size="small"
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ backgroundColor: 'rgba(0,0,0,0.01)' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                            {paper.gorard_sieve_rating.validity.reasoning}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>

                      {/* About Gorard Sieve */}
                      <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>About the Gorard Sieve:</strong> The Gorard Sieve is a standardized rubric for evaluating research quality and trustworthiness. 
                          It assesses studies across six key dimensions using a 0-4 scale. The overall rating reflects the "lowest link" principle - 
                          a study is only as trustworthy as its weakest component.
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        This paper has not been analyzed with the Gorard Sieve yet.
                      </Typography>
                      {isOwner && (
                        <>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                            Click the "Analyze" button above to evaluate this paper's trustworthiness.
                          </Typography>
                        </>
                      )}
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
              {/* Related Papers */}
              {relatedPapers.length > 0 && (
                <Card>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                      <Visibility color="primary" />
                      <Typography variant="h6">Related Papers</Typography>
                    </Stack>
                    <List dense>
                      {relatedPapers.slice(0, 5).map((rp: any) => (
                        <ListItem key={rp._id} button onClick={() => navigate(ROUTES.PAPERS.DETAIL(rp._id))}>
                          <ListItemText
                            primary={rp.title}
                            secondary={(rp.journalName || '') + (rp.authors?.length ? ` • ${rp.authors.slice(0,2).join(', ')}` : '')}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}
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
                    {paper.uploadedBy.firstName} {paper.uploadedBy.lastName}
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

      {/* PDF Viewer Dialog */}
      <Dialog open={pdfOpen} onClose={() => setPdfOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>
          {paper.title}
        </DialogTitle>
        <DialogContent dividers sx={{ height: '80vh', bgcolor: 'grey.100' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ mb: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button size="small" onClick={() => setPdfScale((s) => Math.max(0.5, s - 0.1))}>-</Button>
              <Typography variant="body2">Zoom {(pdfScale * 100).toFixed(0)}%</Typography>
              <Button size="small" onClick={() => setPdfScale((s) => Math.min(2, s + 0.1))}>+</Button>
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <Document
                file={paper.cloudinary?.secure_url || paper.cloudinary?.url || `/api/v1/papers/${paper._id}/download`}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                onLoadError={(e) => console.error('PDF load error', e)}
              >
                {Array.from(new Array(numPages || 0), (_el, index) => (
                  <Page
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    scale={pdfScale}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                ))}
              </Document>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPdfOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<Download />} href={paper.cloudinary?.secure_url || paper.cloudinary?.url || `/api/v1/papers/${paper._id}/download`} target="_blank">Download</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PaperDetailPage;