import React from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Autocomplete,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/constants/routes';
import type { RegisterRequest } from '@/utils/types';

const schema = yup.object({
  firstName: yup
    .string()
    .required('First name is required')
    .max(50, 'First name cannot exceed 50 characters'),
  lastName: yup
    .string()
    .required('Last name is required')
    .max(50, 'Last name cannot exceed 50 characters'),
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  institution: yup
    .string()
    .max(100, 'Institution name cannot exceed 100 characters'),
});

// Common research interests for autocomplete
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
  'Human-Computer Interaction',
  'Robotics',
  'Blockchain',
  'Cloud Computing',
  'Internet of Things',
  'Distributed Systems',
  'Computer Graphics',
  'Database Systems',
  'Information Retrieval',
  'Computer Networks',
];

const RegisterPage: React.FC = () => {
  const { register: registerUser, isLoading, error, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterRequest & { confirmPassword: string }>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: RegisterRequest & { confirmPassword: string }) => {
    clearError();
    const { confirmPassword, ...registerData } = data;
    await registerUser(registerData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
        Create Account
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Join Research Companion to manage your research papers
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            {...register('firstName')}
            autoComplete="given-name"
            name="firstName"
            required
            fullWidth
            id="firstName"
            label="First Name"
            autoFocus
            error={!!errors.firstName}
            helperText={errors.firstName?.message}
            disabled={!!isLoading}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            {...register('lastName')}
            required
            fullWidth
            id="lastName"
            label="Last Name"
            name="lastName"
            autoComplete="family-name"
            error={!!errors.lastName}
            helperText={errors.lastName?.message}
            disabled={!!isLoading}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            {...register('email')}
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            disabled={!!isLoading}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            {...register('institution')}
            fullWidth
            id="institution"
            label="Institution (Optional)"
            name="institution"
            autoComplete="organization"
            error={!!errors.institution}
            helperText={errors.institution?.message}
            disabled={!!isLoading}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12}>
          <Controller
            name="researchInterests"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <Autocomplete
                {...field}
                multiple
                options={commonResearchInterests}
                freeSolo
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
                    label="Research Interests (Optional)"
                    placeholder="Type or select interests"
                    helperText="Add your research areas of interest"
                    InputLabelProps={{ shrink: true }}
                  />
                )}
                onChange={(_, newValue) => field.onChange(newValue)}
                disabled={!!isLoading}
              />
            )}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            {...register('password')}
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
            error={!!errors.password}
            helperText={errors.password?.message}
            disabled={!!isLoading}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            {...register('confirmPassword')}
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            disabled={!!isLoading}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2, py: 1.5 }}
        disabled={!!isLoading}
        startIcon={isLoading ? <CircularProgress size={20} /> : null}
      >
        {isLoading ? 'Creating Account...' : 'Sign Up'}
      </Button>

      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Link component={RouterLink} to={ROUTES.LOGIN} variant="body2">
          Already have an account? Sign In
        </Link>
      </Box>
    </Box>
  );
};

export default RegisterPage;