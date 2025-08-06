import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Card,
  Chip,
  LinearProgress,
  Divider,
  Switch,
  FormControlLabel,
  Autocomplete,
  IconButton,
  Tabs,
  Tab,
  Container,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  PictureAsPdf as PdfIcon,
  Delete as DeleteIcon,
  AutoAwesome as AIIcon,
  Save as SaveIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { 
  useUploadPaperMutation, 
  useExtractMetadataFromAIMutation,
  useExtractMetadataFromUrlMutation
} from '@/services/api/papersApi';
import { ROUTES } from '@/utils/constants/routes';

const schema = yup.object({
  title: yup.string().required('Title is required'),
  abstract: yup.string().optional(),
  detailed_summary: yup.string().optional(),
  keywords: yup.array().of(yup.string().required()).optional(),
  authors: yup.array().of(yup.string().required()).optional(),
  journalName: yup.string().optional(),
  paperLink: yup.string().url('Must be a valid URL').optional(),
  publication_date: yup.date().nullable().optional(),
  isPublic: yup.boolean().required(),
});

interface UploadFormData {
  title: string;
  abstract?: string;
  detailed_summary?: string;
  keywords?: string[];
  authors?: string[];
  journalName?: string;
  paperLink?: string;
  publication_date?: Date | null;
  isPublic: boolean;
  gemini_analysis?: {
    research_area?: string;
    methodology?: string;
    key_findings?: string[] | string;
    research_impact?: string;
  };
}

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [paperUrl, setPaperUrl] = useState('');
  
  const [uploadPaper, { isLoading: isUploading }] = useUploadPaperMutation();
  const [extractMetadata] = useExtractMetadataFromAIMutation();
  const [extractMetadataFromUrl] = useExtractMetadataFromUrlMutation();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UploadFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      abstract: '',
      detailed_summary: '',
      keywords: [] as string[],
      authors: [] as string[],
      journalName: '',
      paperLink: '',
      publication_date: null,
      isPublic: true,
      gemini_analysis: {
        research_area: '',
        methodology: '',
        key_findings: [],
        research_impact: '',
      },
    },
    mode: 'onChange',
  });

  // Watch form values for debugging
  const watchedValues = watch();
  console.log('Current form values:', watchedValues);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill title from filename if title is empty
      if (!watch('title')) {
        setValue('title', file.name.replace('.pdf', ''));
      }
    }
  }, [setValue, watch]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleAIExtraction = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsExtracting(true);
    try {
      const result = await extractMetadata(selectedFile).unwrap();
      
      console.log('Metadata extraction result:', result); // Debug log
      
      if (result.success && result.data) {
        const metadata = result.data.metadata; // Access metadata from the correct path
        
        console.log('Extracted metadata:', metadata); // Debug log
        
        // Fill form with extracted metadata
        console.log('Setting form values with metadata:', metadata);
        
        if (metadata.title) {
          console.log('Setting title:', metadata.title);
          setValue('title', metadata.title);
        }
        if (metadata.abstract) {
          console.log('Setting abstract:', metadata.abstract);
          setValue('abstract', metadata.abstract);
        }
        if (metadata.detailed_summary) {
          console.log('Setting detailed_summary:', metadata.detailed_summary);
          setValue('detailed_summary', metadata.detailed_summary);
        }
        if (metadata.keywords && Array.isArray(metadata.keywords)) {
          console.log('Setting keywords:', metadata.keywords);
          setValue('keywords', metadata.keywords);
        }
        if (metadata.authors && Array.isArray(metadata.authors)) {
          // Handle authors array - extract names if they're objects
          const authorNames = metadata.authors.map((author: any) => 
            typeof author === 'string' ? author : author.name || author
          );
          console.log('Setting authors:', authorNames);
          setValue('authors', authorNames);
        }
        if (metadata.journal?.name) {
          console.log('Setting journalName:', metadata.journal.name);
          setValue('journalName', metadata.journal.name);
        }
        if (metadata.publication_date) {
          console.log('Setting publication_date:', metadata.publication_date);
          setValue('publication_date', new Date(metadata.publication_date));
        }

        // Set Gemini analysis if available
        if (metadata.gemini_analysis) {
          console.log('Setting gemini_analysis:', metadata.gemini_analysis);
          // Convert key_findings array to string format if it exists
          const geminiAnalysis = { ...metadata.gemini_analysis };
          if (geminiAnalysis.key_findings && Array.isArray(geminiAnalysis.key_findings)) {
            geminiAnalysis.key_findings = geminiAnalysis.key_findings.join('\n\n');
          }
          setValue('gemini_analysis', geminiAnalysis);
        }

        toast.success('Metadata extracted successfully!');
      } else {
        console.error('Invalid response structure:', result);
        toast.error('Invalid response from metadata extraction');
      }
    } catch (error: any) {
      console.error('Metadata extraction error:', error);
      toast.error(error?.data?.error?.message || 'Failed to extract metadata');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleUrlMetadataExtraction = async () => {
    if (!paperUrl) {
      toast.error('Please enter a paper URL first');
      return;
    }

    setIsExtracting(true);
    try {
      const result = await extractMetadataFromUrl(paperUrl).unwrap();
      
      console.log('URL metadata extraction result:', result);
      
      if (result.success && result.data) {
        const metadata = result.data.metadata;
        
        console.log('Extracted metadata from URL:', metadata);
        
        // Fill form with extracted metadata
        if (metadata.title) {
          setValue('title', metadata.title);
        }
        if (metadata.abstract) {
          setValue('abstract', metadata.abstract);
        }
        if (metadata.detailed_summary) {
          setValue('detailed_summary', metadata.detailed_summary);
        }
        if (metadata.keywords && Array.isArray(metadata.keywords)) {
          setValue('keywords', metadata.keywords);
        }
        if (metadata.authors && Array.isArray(metadata.authors)) {
          const authorNames = metadata.authors.map((author: any) => 
            typeof author === 'string' ? author : author.name || author
          );
          setValue('authors', authorNames);
        }
        if (metadata.journal?.name) {
          setValue('journalName', metadata.journal.name);
        }
        if (metadata.publication_date) {
          setValue('publication_date', new Date(metadata.publication_date));
        }

        // Set Gemini analysis if available
        if (metadata.gemini_analysis) {
          // Convert key_findings array to string format if it exists
          const geminiAnalysis = { ...metadata.gemini_analysis };
          if (geminiAnalysis.key_findings && Array.isArray(geminiAnalysis.key_findings)) {
            geminiAnalysis.key_findings = geminiAnalysis.key_findings.join('\n\n');
          }
          setValue('gemini_analysis', geminiAnalysis);
        }

        toast.success('Metadata extracted successfully from URL!');
      } else {
        console.error('Invalid response structure:', result);
        toast.error('Invalid response from metadata extraction');
      }
    } catch (error: any) {
      console.error('URL metadata extraction error:', error);
      toast.error(error?.data?.error?.message || 'Failed to extract metadata from URL');
    } finally {
      setIsExtracting(false);
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    if (uploadMethod === 'file' && !selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (uploadMethod === 'url' && !paperUrl) {
      toast.error('Please enter a paper URL');
      return;
    }

    try {
      // Convert key_findings string back to array for backend
      const metadata = { ...data };
      if (metadata.gemini_analysis?.key_findings && typeof metadata.gemini_analysis.key_findings === 'string') {
        metadata.gemini_analysis.key_findings = metadata.gemini_analysis.key_findings
          .split('\n\n')
          .filter(finding => finding.trim() !== '');
      }
      
      const result = await uploadPaper({
        file: uploadMethod === 'file' ? selectedFile || undefined : undefined,
        url: uploadMethod === 'url' ? paperUrl : undefined,
        metadata: {
          ...metadata,
          publication_date: metadata.publication_date ? metadata.publication_date.toISOString() : undefined,
        },
      }).unwrap();

      if (result.success) {
        toast.success('Paper uploaded successfully!');
        // Redirect to the paper detail page instead of papers list
        navigate(ROUTES.PAPERS.DETAIL(result.data.paper._id));
      }
    } catch (error: any) {
      toast.error(error?.data?.error?.message || 'Failed to upload paper');
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
        Upload Research Paper
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Upload your research paper and let AI extract metadata automatically.
      </Typography>

      <Grid container spacing={3}>
        {/* Upload Method Selection */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              1. Choose Upload Method
            </Typography>
            
            <Tabs
              value={uploadMethod}
              onChange={(_, newValue) => setUploadMethod(newValue)}
              sx={{ mb: 3 }}
            >
              <Tab
                value="file"
                label="Upload PDF File"
                icon={<UploadIcon />}
                iconPosition="start"
              />
              <Tab
                value="url"
                label="Upload from URL"
                icon={<LinkIcon />}
                iconPosition="start"
              />
            </Tabs>

            {uploadMethod === 'file' ? (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Select PDF File
                </Typography>
            
            {!selectedFile ? (
              <Card
                {...getRootProps()}
                sx={{
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : 'grey.300',
                  backgroundColor: isDragActive ? 'primary.light' : 'grey.50',
                  cursor: 'pointer',
                  p: 4,
                  textAlign: 'center',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'primary.light',
                  },
                }}
              >
                <input {...getInputProps()} />
                <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Drag & drop your PDF here
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  or click to browse files
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Max file size: 10MB
                </Typography>
              </Card>
            ) : (
              <Card sx={{ p: 2, backgroundColor: 'success.light' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PdfIcon sx={{ mr: 2, color: 'error.main' }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" noWrap>
                      {selectedFile.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(selectedFile.size)}
                    </Typography>
                  </Box>
                  <IconButton onClick={removeFile} size="small">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Card>
            )}

            {selectedFile && (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<AIIcon />}
                  onClick={handleAIExtraction}
                  disabled={isExtracting}
                  fullWidth
                >
                  {isExtracting ? 'Extracting Metadata...' : 'Extract Metadata with AI'}
                </Button>
                {isExtracting && <LinearProgress sx={{ mt: 1 }} />}
              </Box>
            )}
              </Box>
            ) : (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Enter Paper URL
                </Typography>
                <TextField
                  fullWidth
                  label="Paper URL"
                  placeholder="https://example.com/paper.pdf"
                  value={paperUrl}
                  onChange={(e) => setPaperUrl(e.target.value)}
                  helperText="Enter the direct URL to the PDF file"
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="outlined"
                  startIcon={<AIIcon />}
                  onClick={handleUrlMetadataExtraction}
                  disabled={!paperUrl || isExtracting}
                  fullWidth
                >
                  {isExtracting ? 'Extracting Metadata...' : 'Extract Metadata from URL'}
                </Button>
                {isExtracting && <LinearProgress sx={{ mt: 1 }} />}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Metadata Form */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              2. Paper Information
            </Typography>
            
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <TextField
                {...register('title')}
                fullWidth
                label="Title *"
                margin="normal"
                error={!!errors.title}
                helperText={errors.title?.message}
                disabled={isUploading}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                {...register('abstract')}
                fullWidth
                label="Abstract"
                margin="normal"
                multiline
                rows={8}
                disabled={isUploading}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                {...register('detailed_summary')}
                fullWidth
                label="Detailed Summary"
                margin="normal"
                multiline
                rows={8}
                disabled={isUploading}
                InputLabelProps={{ shrink: true }}
              />

              <Controller
                name="authors"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    multiple
                    freeSolo
                    options={[]}
                    value={field.value || []}
                    renderTags={(value: readonly string[], getTagProps) =>
                      value.map((option: string, index: number) => (
                        <Chip
                          variant="outlined"
                          label={option}
                          {...getTagProps({ index })}
                          key={option}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Authors"
                        margin="normal"
                        placeholder="Type author names"
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                    onChange={(_, newValue) => {
                      console.log('Authors field changed:', newValue);
                      field.onChange(newValue);
                    }}
                    disabled={isUploading}
                  />
                )}
              />

              <Controller
                name="keywords"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    multiple
                    freeSolo
                    options={[]}
                    value={field.value || []}
                    renderTags={(value: readonly string[], getTagProps) =>
                      value.map((option: string, index: number) => (
                        <Chip
                          variant="outlined"
                          label={option}
                          {...getTagProps({ index })}
                          key={option}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Keywords"
                        margin="normal"
                        placeholder="Type keywords"
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                    onChange={(_, newValue) => {
                      console.log('Keywords field changed:', newValue);
                      field.onChange(newValue);
                    }}
                    disabled={isUploading}
                  />
                )}
              />

              <TextField
                {...register('journalName')}
                fullWidth
                label="Journal Name"
                margin="normal"
                disabled={isUploading}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                {...register('paperLink')}
                fullWidth
                label="Paper Link (URL)"
                margin="normal"
                error={!!errors.paperLink}
                helperText={errors.paperLink?.message}
                disabled={isUploading}
                InputLabelProps={{ shrink: true }}
              />

              <Controller
                name="publication_date"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Publication Date"
                    type="date"
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    value={field.value ? field.value.toISOString().split('T')[0] : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                    disabled={isUploading}
                  />
                )}
              />

              <Controller
                name="isPublic"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                        disabled={isUploading}
                      />
                    }
                    label="Make this paper public"
                    sx={{ mt: 2 }}
                  />
                )}
              />

              {/* Research Analysis Section */}
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>
                Research Analysis
              </Typography>
              
              <TextField
                {...register('gemini_analysis.research_area')}
                fullWidth
                label="Research Area"
                margin="normal"
                multiline
                rows={2}
                disabled={isUploading}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                {...register('gemini_analysis.methodology')}
                fullWidth
                label="Methodology"
                margin="normal"
                multiline
                rows={3}
                disabled={isUploading}
                InputLabelProps={{ shrink: true }}
              />

              <Controller
                name="gemini_analysis.key_findings"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Key Findings"
                    margin="normal"
                    multiline
                    rows={4}
                    placeholder="Enter key findings separated by double line breaks"
                    InputLabelProps={{ shrink: true }}
                    value={Array.isArray(field.value) ? field.value.join('\n\n') : field.value || ''}
                    onChange={(e) => {
                      const text = e.target.value;
                      const findings = text.split('\n\n').filter(finding => finding.trim() !== '');
                      field.onChange(findings);
                    }}
                    disabled={isUploading}
                    helperText="Separate each finding with double line breaks"
                  />
                )}
              />

              <TextField
                {...register('gemini_analysis.research_impact')}
                fullWidth
                label="Research Impact"
                margin="normal"
                multiline
                rows={3}
                disabled={isUploading}
                InputLabelProps={{ shrink: true }}
              />

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={isUploading || (uploadMethod === 'file' && !selectedFile) || (uploadMethod === 'url' && !paperUrl)}
                  sx={{ flexGrow: 1 }}
                >
                  {isUploading ? 'Uploading...' : 'Upload Paper'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </Box>

              {isUploading && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    Uploading and processing your paper...
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UploadPage;