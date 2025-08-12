import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  BottomNavigation,
  BottomNavigationAction,
  Paper as MuiPaper,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home,
  Article,
  Person,
  Logout,
  CloudUpload,
  LibraryBooks,
  Favorite as FavoriteIcon,
  AccountCircle,
  SmartToy,
} from '@mui/icons-material';
const logo = '/logo.png';
import { styled } from '@mui/material/styles';
import ListSubheader from '@mui/material/ListSubheader';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/constants/routes';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';

const drawerWidth = 240;

const MainContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
}));

const ContentArea = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  marginLeft: 0,
  [theme.breakpoints.up('md')]: {
    marginLeft: 0,
  },
}));

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
}));

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
  },
}));

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem('theme') === 'dark');
  const [topSearch, setTopSearch] = useState('');

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseProfileMenu = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const groupedMenu: Array<{ header: string; items: Array<{ text: string; icon: React.ReactNode; path: string }> }> = [
    {
      header: 'Primary',
      items: [
        { text: 'Dashboard', icon: <Home />, path: ROUTES.DASHBOARD },
        { text: 'All Papers', icon: <Article />, path: ROUTES.PAPERS.ALL },
        { text: 'Upload', icon: <CloudUpload />, path: ROUTES.PAPERS.UPLOAD },
      ],
    },
    {
      header: 'My Library',
      items: [
        { text: 'My Papers', icon: <LibraryBooks />, path: ROUTES.PAPERS.MY_PAPERS },
        { text: 'Favorites', icon: <FavoriteIcon />, path: ROUTES.PAPERS.FAVORITES },
      ],
    },
    {
      header: 'Tools',
      items: [
        { text: 'AI Assistant', icon: <SmartToy />, path: ROUTES.CHATBOT },
      ],
    },
  ];

  // Ensure only the correct sidebar item is highlighted.
  // Some routes are parents of others (e.g., '/papers' vs '/papers/my').
  // For these, require an exact match so we don't highlight multiple items.
  const exactOnly = new Set<string>([ROUTES.DASHBOARD, ROUTES.PAPERS.ALL]);
  const isSelected = (path: string) => {
    if (exactOnly.has(path)) {
      return location.pathname === path || location.pathname === path + '/';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Box
            component="img"
            src={logo}
            alt="Research Companion"
            sx={{
              height: 32,
              width: 'auto',
              mr: 2
            }}
          />
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
            Research Companion
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      {groupedMenu.map((group) => (
        <List
          key={group.header}
          subheader={
            <ListSubheader component="div" sx={{ bgcolor: 'transparent', lineHeight: 2, fontWeight: 600 }}>
              {group.header}
            </ListSubheader>
          }
        >
          {group.items.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isSelected(item.path)}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.light + '20',
                    '&:hover': {
                      backgroundColor: theme.palette.primary.light + '30',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isSelected(item.path) ? theme.palette.primary.main : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    '& .MuiTypography-root': {
                      fontWeight: isSelected(item.path) ? 600 : 400,
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      ))}
    </Box>
  );

  return (
    <MainContainer>
      <StyledAppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box
              component="img"
              src={logo}
              alt="Research Companion"
              sx={{
                height: 40,
                width: 'auto',
                mr: 2,
                display: { xs: 'none', sm: 'block' }
              }}
            />
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                fontWeight: 600,
                display: { xs: 'none', md: 'block' }
              }}
            >
              Research Companion
            </Typography>
            {/* Top Search */}
            <Box sx={{ display: { xs: 'none', md: 'block' }, ml: 3, flexGrow: 1, maxWidth: 520 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search papers..."
                value={topSearch}
                onChange={(e) => setTopSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const q = topSearch.trim();
                    if (!q) return;
                    // Avoid pushing duplicate route for same query quickly
                    const current = new URLSearchParams(location.search).get('q') || '';
                    if (location.pathname.startsWith(ROUTES.PAPERS.ALL) && current.trim() === q) return;
                    navigate(`${ROUTES.PAPERS.ALL}?q=${encodeURIComponent(q)}`);
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>

          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="profile-menu"
            aria-haspopup="true"
            onClick={handleProfileMenu}
            color="inherit"
          >
            <Avatar
              sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: theme.palette.secondary.main,
                color: theme.palette.secondary.contrastText
              }}
            >
              <AccountCircle />
            </Avatar>
          </IconButton>
          
          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleCloseProfileMenu}
          >
            <MenuItem onClick={() => { handleCloseProfileMenu(); navigate(ROUTES.PROFILE); }}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => { handleCloseProfileMenu(); const next = !darkMode; setDarkMode(next); localStorage.setItem('theme', next ? 'dark' : 'light'); window.location.reload(); }}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { handleCloseProfileMenu(); logout(); }}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </StyledAppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <StyledDrawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
        >
          {drawer}
        </StyledDrawer>
      </Box>

      <ContentArea component="main" sx={{ pb: { xs: 8, md: 0 } }}>
        <Toolbar /> {/* Spacer for fixed AppBar */}
        {children}
      </ContentArea>

      {isMobile && (
        <MuiPaper
          elevation={3}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <BottomNavigation
            showLabels
            value={(() => {
              const items = [
                ROUTES.DASHBOARD,
                ROUTES.PAPERS.ALL,
                ROUTES.PAPERS.UPLOAD,
                ROUTES.CHATBOT,
                ROUTES.PROFILE,
              ];
              return items.find((p) =>
                location.pathname === p || location.pathname.startsWith(p)
              ) || '';
            })()}
            onChange={(_e, newValue) => handleNavigation(newValue)}
          >
            <BottomNavigationAction label="Home" value={ROUTES.DASHBOARD} icon={<Home />} />
            <BottomNavigationAction label="Papers" value={ROUTES.PAPERS.ALL} icon={<Article />} />
            <BottomNavigationAction label="Upload" value={ROUTES.PAPERS.UPLOAD} icon={<CloudUpload />} />
            <BottomNavigationAction label="AI" value={ROUTES.CHATBOT} icon={<SmartToy />} />
            <BottomNavigationAction label="Profile" value={ROUTES.PROFILE} icon={<Person />} />
          </BottomNavigation>
        </MuiPaper>
      )}
    </MainContainer>
  );
};

export default MainLayout;