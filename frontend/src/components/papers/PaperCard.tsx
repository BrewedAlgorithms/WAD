import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Visibility,
  Download,
  CalendarToday,
  Person,
  School,
  Description,
} from '@mui/icons-material';
import { Paper } from '@/utils/types/papers';
import { formatDate } from '@/utils/helpers/dateUtils';

interface PaperCardProps {
  paper: Paper;
  onView?: (paper: Paper) => void;
  onDownload?: (paper: Paper) => void;
  onKeywordClick?: (keyword: string) => void;
  showActions?: boolean;
}

const PaperCard: React.FC<PaperCardProps> = ({
  paper,
  onView,
  onDownload,
  onKeywordClick,
  showActions = true,
}) => {
  const [summaryOpen, setSummaryOpen] = useState(false);

  const handleView = () => {
    if (onView) {
      onView(paper);
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(paper);
    }
  };

  const handleSummaryClick = () => {
    setSummaryOpen(true);
  };

  const handleCloseSummary = () => {
    setSummaryOpen(false);
  };

  const handleKeywordClick = (keyword: string) => {
    if (onKeywordClick) {
      onKeywordClick(keyword);
    }
  };

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          },
        }}
        onClick={handleView}
      >
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          {/* Title */}
          <Typography
            variant="h6"
            component="h3"
            gutterBottom
            sx={{
              fontWeight: 600,
              lineHeight: 1.3,
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {paper.title}
          </Typography>

          {/* Authors */}
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {paper.authors.join(', ')}
              </Typography>
            </Stack>
          </Box>

          {/* Journal */}
          {paper.journalName && (
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <School sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {paper.journalName}
                </Typography>
              </Stack>
            </Box>
          )}

          {/* Publication Date */}
          {paper.publication_date && (
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {formatDate(paper.publication_date)}
                </Typography>
              </Stack>
            </Box>
          )}

          {/* Keywords */}
          {paper.keywords && paper.keywords.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Keywords:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {paper.keywords.slice(0, 3).map((keyword, index) => (
                  <Chip
                    key={index}
                    label={keyword}
                    size="small"
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleKeywordClick(keyword);
                    }}
                    sx={{
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    }}
                  />
                ))}
                {paper.keywords.length > 3 && (
                  <Chip
                    label={`+${paper.keywords.length - 3} more`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                )}
              </Box>
            </Box>
          )}

          {/* Summary Preview */}
          {paper.detailed_summary && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.4,
                  cursor: 'pointer',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSummaryClick();
                }}
              >
                {/* Strip markdown for preview */}
                {paper.detailed_summary.replace(/[#*`]/g, '').substring(0, 200)}...
              </Typography>
              <Button
                size="small"
                startIcon={<Description />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSummaryClick();
                }}
                sx={{ mt: 1, p: 0, minWidth: 'auto' }}
              >
                Read Summary
              </Button>
            </Box>
          )}

          {/* Actions */}
          {showActions && (
            <Box sx={{ mt: 'auto', pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Downloads: {paper.downloadCount}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleView();
                      }}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload();
                      }}
                    >
                      <Download />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Summary Dialog */}
      <Dialog
        open={summaryOpen}
        onClose={handleCloseSummary}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>
          <Typography variant="h6" component="h2">
            {paper.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Summary
          </Typography>
        </DialogTitle>
        <DialogContent>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSummary}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              handleCloseSummary();
              handleView();
            }}
          >
            View Full Paper
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PaperCard; 