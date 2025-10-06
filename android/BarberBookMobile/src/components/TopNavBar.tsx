import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageSourcePropType,
  Image,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../styles/theme';

const menuIcon: ImageSourcePropType = require('../assets/icons/Menu.png');

export interface NavItem {
  key: string;
  label: string;
  icon?: string;
  asset?: ImageSourcePropType;
  disabled?: boolean;
}

interface TopNavBarProps {
  navItems: NavItem[];
  activeItem: string;
  onItemPress: (key: string) => void;
  onLogout?: () => void;
}

export default function TopNavBar({ navItems, activeItem, onItemPress, onLogout }: TopNavBarProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  const menuWidth = 320; // theme.spacing(40)
  
  // Animation values
  const slideAnim = React.useRef(new Animated.Value(screenWidth)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  const openMenu = () => {
    setMenuVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenWidth - menuWidth,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenWidth,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setMenuVisible(false);
    });
  };

  // Reset animation when component unmounts or menu closes
  useEffect(() => {
    if (!menuVisible) {
      slideAnim.setValue(screenWidth);
      opacityAnim.setValue(0);
    }
  }, [menuVisible, slideAnim, opacityAnim, screenWidth]);

  const handleItemPress = (key: string) => {
    onItemPress(key);
    closeMenu();
  };

  const handleLogout = () => {
    onLogout?.();
    closeMenu();
  };

  return (
    <>
      {/* Status Bar */}
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Top Navigation Bar */}
      <View style={[styles.navbar, { paddingTop: insets.top }]}>
        <View style={styles.navContent}>
          {/* App Title */}
          <Text style={styles.appTitle}>BarberBook</Text>
          
          {/* Hamburger Menu Button */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={openMenu}
            accessibilityRole="button"
            accessibilityLabel="Otvori meni"
          >
            <Image 
              source={menuIcon}
              style={styles.menuIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hamburger Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.overlayTouchable,
              { opacity: opacityAnim }
            ]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={closeMenu}
              activeOpacity={1}
            />
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.menuContainer,
              { 
                transform: [{ translateX: slideAnim }]
              }
            ]}
          >
            {/* Menu Header */}
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Navigacija</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeMenu}
                accessibilityRole="button"
                accessibilityLabel="Zatvori meni"
              >
                <MaterialCommunityIcons 
                  name="close" 
                  size={theme.typography.headline.fontSize} 
                  color={theme.colors.secondary} 
                />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <View style={styles.menuItems}>
              {navItems.map(item => {
                const isActive = item.key === activeItem;
                const isDisabled = item.disabled;
                
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.menuItem,
                      isActive && styles.menuItemActive,
                      isDisabled && styles.menuItemDisabled,
                    ]}
                    onPress={() => !isDisabled && handleItemPress(item.key)}
                    disabled={isDisabled}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected: isActive, disabled: isDisabled }}
                  >
                    <View style={styles.menuItemContent}>
                      {/* Icon */}
                      <View style={[styles.menuItemIcon, isActive && styles.menuItemIconActive]}>
                        {item.asset ? (
                          <Image
                            source={item.asset}
                            style={[
                              styles.menuItemImage,
                              {
                                tintColor: isDisabled
                                  ? theme.colors.tertiary
                                  : isActive
                                  ? theme.colors.accent
                                  : theme.colors.secondary,
                              },
                            ]}
                            resizeMode="contain"
                          />
                        ) : (
                          <MaterialCommunityIcons
                            name={item.icon ?? 'circle'}
                            size={theme.typography.headline.fontSize}
                            color={
                              isDisabled
                                ? theme.colors.tertiary
                                : isActive
                                ? theme.colors.accent
                                : theme.colors.secondary
                            }
                          />
                        )}
                      </View>

                      {/* Label */}
                      <Text
                        style={[
                          styles.menuItemText,
                          isActive && styles.menuItemTextActive,
                          isDisabled && styles.menuItemTextDisabled,
                        ]}
                      >
                        {item.label}
                      </Text>

                      {/* Active Indicator */}
                      {isActive && <View style={styles.activeIndicator} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Logout Section */}
            {onLogout && (
              <View style={styles.logoutSection}>
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={handleLogout}
                  accessibilityRole="button"
                  accessibilityLabel="Odjavi se"
                >
                  <MaterialCommunityIcons
                    name="logout"
                    size={theme.typography.headline.fontSize}
                    color={theme.colors.danger}
                  />
                  <Text style={styles.logoutText}>Odjavi se</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Top Navigation Bar
  navbar: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(2),
    minHeight: theme.spacing(6),
  },
  appTitle: {
    ...theme.typography.title3,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  menuButton: {
    padding: theme.spacing(1),
    borderRadius: theme.radius.continuous.sm,
    backgroundColor: theme.colors.fill,
  },
  menuIcon: {
    width: theme.typography.title2.fontSize,
    height: theme.typography.title2.fontSize,
    tintColor: theme.colors.primary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.blur.prominent,
  },
  menuContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 320, // theme.spacing(40)
    height: '100%',
    backgroundColor: theme.colors.surface,
    ...theme.shadows.xl,
    paddingTop: StatusBar.currentHeight || 0,
  },
  
  // Menu Header
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(3),
    marginTop: theme.spacing(2),
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  menuTitle: {
    ...theme.typography.headline,
    color: theme.colors.primary,
  },
  closeButton: {
    padding: theme.spacing(0.5),
    borderRadius: theme.radius.continuous.sm,
  },

  // Menu Items
  menuItems: {
    paddingVertical: theme.spacing(1),
  },
  menuItem: {
    marginHorizontal: theme.spacing(1),
    borderRadius: theme.radius.continuous.md,
    overflow: 'hidden',
  },
  menuItemActive: {
    backgroundColor: theme.colors.fillSecondary,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing(2.5),
    paddingVertical: theme.spacing(2),
    position: 'relative',
  },
  menuItemIcon: {
    width: theme.spacing(4),
    height: theme.spacing(4),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing(2),
    borderRadius: theme.radius.continuous.sm,
    backgroundColor: theme.colors.fillQuaternary,
  },
  menuItemIconActive: {
    backgroundColor: theme.colors.fillSecondary,
  },
  menuItemImage: {
    width: theme.spacing(2.5),
    height: theme.spacing(2.5),
  },
  menuItemText: {
    ...theme.typography.callout,
    color: theme.colors.secondary,
    flex: 1,
  },
  menuItemTextActive: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
  menuItemTextDisabled: {
    color: theme.colors.tertiary,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.accent,
    position: 'absolute',
    right: theme.spacing(2.5),
  },

  // Logout Section
  logoutSection: {
    borderTopWidth: 0.5,
    borderTopColor: theme.colors.border,
    padding: theme.spacing(1),
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing(2.5),
    paddingVertical: theme.spacing(2),
    borderRadius: theme.radius.continuous.md,
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
  },
  logoutText: {
    ...theme.typography.callout,
    color: theme.colors.danger,
    marginLeft: theme.spacing(2),
    fontWeight: '600',
  },
});