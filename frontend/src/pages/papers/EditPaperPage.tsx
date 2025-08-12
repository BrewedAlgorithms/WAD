import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Grid,
  Chip,
  Button,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import Autocomplete from '@mui/material/Autocomplete';
import { toast } from 'react-toastify';
import { useGetPaperByIdQuery, useUpdatePaperMutation } from '@/services/api/papersApi';
import { ROUTES } from '@/utils/constants/routes';

type EditFormData = {
  title: string;
  abstract?: string;
  detailed_summary?: string;
  keywords?: string[];
  authors?: string[];
  journalName?: string;
  paperLink?: string;
  publication_date?: string; // ISO date (yyyy-mm-dd)
  isPublic: boolean;
};

const EditPaperPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetPaperByIdQuery(id!, { skip: !id });
  const [updatePaper, { isLoading: isSaving }] = useUpdatePaperMutation();

  const paper = data?.data.paper;

  const { control, handleSubmit, reset } = useForm<EditFormData>({
    defaultValues: {
      title: '',
      abstract: '',
      detailed_summary: '',
      keywords: [],
      authors: [],
      journalName: '',
      paperLink: '',
      publication_date: '',
      isPublic: true,
    },
  });

  useEffect(() => {
    if (paper) {
      reset({
        title: paper.title || '',
        abstract: paper.abstract || '',
        detailed_summary: paper.detailed_summary || '',
        keywords: paper.keywords || [],
        authors: paper.authors || [],
        journalName: paper.journalName || '',
        paperLink: paper.paperLink || '',
        publication_date: paper.publication_date ? String(paper.publication_date).slice(0, 10) : '',
        isPublic: paper.isPublic,
      });
    }
  }, [paper, reset]);

  const onSubmit = async (values: EditFormData) => {
    try {
      const payload: any = {
        ...values,
        publication_date: values.publication_date || undefined,
      };
      const result = await updatePaper({ id: id!, data: payload }).unwrap();
      if (result.success) {
        toast.success('Paper updated');
        navigate(ROUTES.PAPERS.DETAIL(id!));
      }
    } catch (e: any) {
      toast.error(e?.data?.error?.message || 'Failed to update paper');
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !paper) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography color="error">Paper not found or you do not have permission.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>Edit Paper</Typography>
      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="title"
            control={control}
            rules={{ required: 'Title is required' }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Title *"
                fullWidth
                margin="normal"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                disabled={isSaving}
              />
            )}
          />

          <Controller
            name="abstract"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Abstract" fullWidth margin="normal" multiline rows={6} disabled={isSaving} />
            )}
          />

          <Controller
            name="detailed_summary"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Detailed Summary" fullWidth margin="normal" multiline rows={8} disabled={isSaving} />
            )}
          />

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Controller
                name="authors"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    freeSolo
                    options={[]}
                    value={field.value || []}
                    onChange={(_, val) => field.onChange(val)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} key={`${option}-${index}`} />
                      ))
                    }
                    renderInput={(params) => <TextField {...params} label="Authors" />}
                    disabled={isSaving}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="keywords"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    freeSolo
                    options={[]}
                    value={field.value || []}
                    onChange={(_, val) => field.onChange(val)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} key={`${option}-${index}`} />
                      ))
                    }
                    renderInput={(params) => <TextField {...params} label="Keywords" />}
                    disabled={isSaving}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Controller
                name="journalName"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Journal" fullWidth disabled={isSaving} />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="paperLink"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Paper Link (URL)" fullWidth disabled={isSaving} />
                )}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Controller
                name="publication_date"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Publication Date" type="date" fullWidth InputLabelProps={{ shrink: true }} disabled={isSaving} />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="isPublic"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    SelectProps={{ native: true }}
                    label="Visibility"
                    fullWidth
                    value={field.value ? 'public' : 'private'}
                    onChange={(e) => field.onChange(e.target.value === 'public')}
                    disabled={isSaving}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </TextField>
                )}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button type="submit" variant="contained" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button variant="outlined" onClick={() => navigate(ROUTES.PAPERS.DETAIL(id!))} disabled={isSaving}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default EditPaperPage;

