import React from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  Chip,
  Autocomplete,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Person as PersonIcon } from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfileMutation } from '@/services/api/authApi';
import { toast } from 'react-toastify';

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  institution: yup.string(),
  researchInterests: yup.array().of(yup.string()),
});

const commonResearchInterests = [
  'Artificial Intelligence',
  'Machine Learning',
  'Deep Learning',
  'Computer Vision',
  'Natural Language Processing',
  'Data Science',
  'Bioinformatics',
  'Quantum Computing',
  'Cybersecurity',
  'Software Engineering',
];

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      institution: user?.institution || '',
      researchInterests: (user?.researchInterests || []) as string[],
    },
  });

  const onSubmit = async (data: any) => {
    try {
      const result = await updateProfile(data).unwrap();
      if (result.success) {
        updateUser(result.data.user);
        toast.success('Profile updated successfully!');
      }
    } catch (error: any) {
      toast.error(error?.data?.error?.message || 'Failed to update profile');
    }
  };

  if (!user) return null;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
        Profile Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 2,
                bgcolor: 'primary.main',
                fontSize: '3rem',
              }}
            >
              <PersonIcon fontSize="large" />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              {user.fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {user.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...register('firstName')}
                    fullWidth
                    label="First Name"
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                    disabled={isLoading}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...register('lastName')}
                    fullWidth
                    label="Last Name"
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                    disabled={isLoading}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    {...register('institution')}
                    fullWidth
                    label="Institution"
                    disabled={isLoading}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                                      <Controller
                    name="researchInterests"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        multiple
                        options={commonResearchInterests}
                        freeSolo
                        value={(field.value || []).filter((item): item is string => typeof item === 'string')}
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
                            label="Research Interests"
                            placeholder="Add your research interests"
                            InputLabelProps={{ shrink: true }}
                          />
                        )}
                        onChange={(_, newValue) => field.onChange(newValue || [])}
                        disabled={isLoading}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update Profile'}
                </Button>
                <Button variant="outlined" disabled={isLoading}>
                  Cancel
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;