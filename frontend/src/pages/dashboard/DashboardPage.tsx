import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Skeleton,
} from '@mui/material';
import {
  Description as PaperIcon,
  Upload as UploadIcon,
  Search as SearchIcon,
  TrendingUp,
  Download,
  Description,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGetUserPapersQuery } from '@/services/api/papersApi';
import { useGetUploadStatsQuery } from '@/services/api/analyticsApi';
import { ROUTES } from '@/utils/constants/routes';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onClick }) => (
  <Card 
    sx={{ 
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: 3 } : {},
      transition: 'all 0.2s ease-in-out',
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            backgroundColor: `${color}20`,
            color: color,
            mr: 2,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: userPapers, isLoading: papersLoading } = useGetUserPapersQuery(undefined);
  const { data: uploadStats, isLoading: statsLoading } = useGetUploadStatsQuery();

  const quickActions = [
    {
      title: 'Upload Paper',
      description: 'Add a new research paper',
      icon: <UploadIcon />,
      color: '#1976d2',
      action: () => navigate(ROUTES.PAPERS.UPLOAD),
    },
    {
      title: 'Search Papers',
      description: 'Find research papers',
      icon: <SearchIcon />,
      color: '#2e7d32',
      action: () => navigate(ROUTES.PAPERS.ALL),
    },

  ];

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Welcome back, {user?.firstName}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your research papers today.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          {papersLoading ? (
            <Skeleton variant="rectangular" height={120} />
          ) : (
            <StatCard
              title="My Papers"
              value={userPapers?.data.papers.length || 0}
              icon={<PaperIcon />}
              color="#1976d2"
              onClick={() => navigate(ROUTES.PAPERS.MY_PAPERS)}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {statsLoading ? (
            <Skeleton variant="rectangular" height={120} />
          ) : (
            <StatCard
              title="Total Papers"
              value={uploadStats?.data.totalPapers || 0}
              icon={<Description />}
              color="#2e7d32"
              onClick={() => navigate(ROUTES.PAPERS.ALL)}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {statsLoading ? (
            <Skeleton variant="rectangular" height={120} />
          ) : (
            <StatCard
              title="This Month"
              value={uploadStats?.data.papersThisMonth || 0}
              icon={<TrendingUp />}
              color="#ed6c02"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {papersLoading ? (
            <Skeleton variant="rectangular" height={120} />
          ) : (
            <StatCard
              title="Total Downloads"
              value={userPapers?.data.papers.reduce((sum, paper) => sum + paper.downloadCount, 0) || 0}
              icon={<Download />}
              color="#9c27b0"
            />
          )}
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {quickActions.map((action, index) => (
                <Grid item xs={12} key={index}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { transform: 'translateX(4px)', boxShadow: 2 },
                      transition: 'all 0.2s ease-in-out',
                    }}
                    onClick={action.action}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          backgroundColor: `${action.color}20`,
                          color: action.color,
                          mr: 2,
                        }}
                      >
                        {action.icon}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {action.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" component="span">
                          {action.description}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Recent Papers */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Recent Papers
              </Typography>
              <Button size="small" onClick={() => navigate(ROUTES.PAPERS.MY_PAPERS)}>
                View All
              </Button>
            </Box>
            {papersLoading ? (
              <Box>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} variant="text" height={60} sx={{ mb: 1 }} />
                ))}
              </Box>
            ) : (
              <List>
                {userPapers?.data.papers.slice(0, 5).map((paper) => (
                  <ListItem
                    key={paper._id}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 1,
                      '&:hover': { backgroundColor: 'action.hover' },
                    }}
                    onClick={() => navigate(`/papers/${paper._id}`)}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" noWrap>
                          {paper.title}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary" component="span">
                            {new Date(paper.createdAt).toLocaleDateString()}
                          </Typography>
                          {paper.keywords.slice(0, 2).map((keyword) => (
                            <Chip key={keyword} label={keyword} size="small" variant="outlined" />
                          ))}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
                {!userPapers?.data.papers.length && (
                  <ListItem>
                    <ListItemText
                      primary="No papers uploaded yet"
                      secondary="Upload your first research paper to get started"
                    />
                  </ListItem>
                )}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;