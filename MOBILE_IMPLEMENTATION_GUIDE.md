# Mobile Implementation Guide

## Quick Start

### 1. Using Mobile-Optimized Buttons

```tsx
import Button from './components/ui/Button'

// Mobile-optimized button
<Button 
  variant="mobile-primary" 
  size="mobile"
  fullWidth={true}
>
  Check In
</Button>

// Or use the mobileOptimized prop
<Button 
  variant="primary" 
  mobileOptimized={true}
  fullWidth={true}
>
  Upload Photo
</Button>
```

### 2. Using Mobile Image Components

```tsx
import { GalleryImage, ProfileImage, HeroImage } from './components/ui/MobileImage'

// For gallery photos
<GalleryImage
  src={photo.url}
  alt={photo.caption}
  onClick={() => setSelectedPhoto(photo)}
/>

// For profile pictures
<ProfileImage
  src={user.avatar}
  alt={user.name}
  size="md"
/>

// For hero/banner images
<HeroImage
  src={banner.url}
  alt="Camp Banner"
/>
```

### 3. Using Mobile Gestures

```tsx
import { useSwipeGesture } from './hooks/useMobileGestures'

function Gallery() {
  const galleryRef = useRef<HTMLDivElement>(null)
  
  useSwipeGesture(galleryRef, {
    onSwipeLeft: () => nextPhoto(),
    onSwipeRight: () => previousPhoto(),
  })

  return (
    <div ref={galleryRef} className="mobile-swipeable">
      {/* Gallery content */}
    </div>
  )
}
```

### 4. Using Pull-to-Refresh

```tsx
import { usePullToRefresh } from './hooks/useMobileGestures'

function Dashboard() {
  const { elementRef, isRefreshing, shouldShowRefreshIndicator } = usePullToRefresh(
    async () => {
      await refreshData()
    }
  )

  return (
    <div ref={elementRef} className="mobile-pull-to-refresh">
      {shouldShowRefreshIndicator && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      )}
      {/* Dashboard content */}
    </div>
  )
}
```

### 5. Using Mobile Layouts

```tsx
import { MobileLayout, CompactLayout, FullWidthLayout } from './components/Layout'

// Standard mobile-optimized layout
<Layout mobileOptimized={true}>
  {/* Content */}
</Layout>

// Mobile-specific layout
<MobileLayout>
  {/* Content */}
</MobileLayout>

// Compact layout for mobile
<CompactLayout>
  {/* Content */}
</CompactLayout>

// Full-width layout
<FullWidthLayout>
  {/* Content */}
</FullWidthLayout>
```

## CSS Classes Reference

### Mobile Button Classes
```css
.btn-mobile          /* Base mobile button */
.btn-mobile-primary  /* Primary mobile button */
.btn-mobile-secondary /* Secondary mobile button */
.btn-mobile-outline  /* Outline mobile button */
```

### Mobile Layout Classes
```css
.grid-mobile         /* Mobile-optimized grid */
.grid-mobile-compact /* Compact mobile grid */
.card-mobile         /* Mobile-optimized card */
.card-mobile-interactive /* Interactive mobile card */
```

### Mobile Spacing Classes
```css
.space-mobile        /* Mobile spacing */
.space-mobile-compact /* Compact mobile spacing */
.mobile-p-2          /* Mobile padding 2 */
.mobile-p-4          /* Mobile padding 4 */
.mobile-m-2          /* Mobile margin 2 */
.mobile-m-4          /* Mobile margin 4 */
```

### Mobile Text Classes
```css
.text-mobile-title   /* Mobile title text */
.text-mobile-subtitle /* Mobile subtitle text */
.text-mobile-body    /* Mobile body text */
.text-mobile-caption /* Mobile caption text */
```

### Mobile Animation Classes
```css
.animate-mobile-slide-up    /* Mobile slide up animation */
.animate-mobile-scale-tap   /* Mobile tap scale animation */
.animate-mobile-bounce-gentle /* Mobile gentle bounce */
```

### Mobile Utility Classes
```css
.touch-target        /* 48px minimum touch target */
.touch-target-lg     /* 56px minimum touch target */
.mobile-safe-area    /* Safe area padding */
.mobile-scroll       /* Mobile scroll optimization */
.mobile-tap-highlight /* Remove tap highlight */
.mobile-text-size-adjust /* Prevent text size adjustment */
```

## Best Practices

### 1. Always Use Mobile-First Design
```tsx
// Good: Mobile-first responsive design
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Avoid: Desktop-first design
<div className="grid grid-cols-3 sm:grid-cols-2 xs:grid-cols-1 gap-4">
```

### 2. Use Appropriate Touch Targets
```tsx
// Good: Large enough touch target
<button className="touch-target px-4 py-3">
  Click me
</button>

// Avoid: Small touch target
<button className="px-2 py-1">
  Click me
</button>
```

### 3. Optimize Images for Mobile
```tsx
// Good: Use mobile image component
<GalleryImage src={image.url} alt={image.alt} />

// Avoid: Direct img tag without optimization
<img src={image.url} alt={image.alt} />
```

### 4. Handle Mobile Interactions
```tsx
// Good: Mobile-optimized interactions
<div className="mobile-touch-feedback" onClick={handleClick}>
  Interactive content
</div>

// Avoid: No mobile interaction handling
<div onClick={handleClick}>
  Interactive content
</div>
```

### 5. Use Mobile-Specific Hooks
```tsx
// Good: Use mobile hooks for device-specific behavior
const orientation = useMobileOrientation()
const isKeyboardOpen = useMobileKeyboard()

// Avoid: Ignoring mobile-specific behaviors
// No mobile considerations
```

## Testing Checklist

### Touch Interactions
- [ ] All buttons are at least 48px in size
- [ ] Touch feedback is visible
- [ ] No accidental touches
- [ ] Gestures work as expected

### Layout
- [ ] Content fits on mobile screens
- [ ] No horizontal scrolling
- [ ] Proper spacing on mobile
- [ ] Safe areas are respected

### Performance
- [ ] Images load efficiently
- [ ] Animations are smooth
- [ ] No layout shifts
- [ ] Fast interaction response

### Accessibility
- [ ] Focus indicators are visible
- [ ] Screen reader compatible
- [ ] Keyboard navigation works
- [ ] Color contrast is sufficient

## Common Patterns

### Mobile Card Pattern
```tsx
<div className="card-mobile">
  <div className="flex items-center space-x-3">
    <div className="flex-shrink-0">
      <ProfileImage src={user.avatar} alt={user.name} size="sm" />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-mobile-subtitle truncate">{user.name}</h3>
      <p className="text-mobile-caption text-gray-600">{user.role}</p>
    </div>
    <Button variant="mobile-outline" size="mobile">
      View
    </Button>
  </div>
</div>
```

### Mobile List Pattern
```tsx
<div className="space-mobile">
  {items.map(item => (
    <div key={item.id} className="card-mobile-interactive">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="text-mobile-body font-medium">{item.title}</h4>
          <p className="text-mobile-caption text-gray-600">{item.description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="mobile-primary" size="mobile">
            Action
          </Button>
        </div>
      </div>
    </div>
  ))}
</div>
```

### Mobile Form Pattern
```tsx
<form className="space-mobile">
  <div>
    <label className="block text-mobile-caption font-medium text-gray-700 mb-2">
      Name
    </label>
    <input 
      type="text" 
      className="input-mobile"
      placeholder="Enter your name"
    />
  </div>
  <Button 
    type="submit" 
    variant="mobile-primary" 
    size="mobile"
    fullWidth={true}
  >
    Submit
  </Button>
</form>
```

## Troubleshooting

### Common Issues

1. **Touch targets too small**
   - Use `touch-target` class
   - Ensure minimum 48px size

2. **Images not loading on mobile**
   - Use `MobileImage` component
   - Check lazy loading implementation

3. **Layout breaking on mobile**
   - Use mobile-first responsive classes
   - Test on actual devices

4. **Performance issues**
   - Implement lazy loading
   - Optimize animations
   - Use intersection observer

### Debug Tools

1. **Chrome DevTools Mobile Emulation**
   - Test different screen sizes
   - Simulate touch interactions

2. **Lighthouse Mobile Auditing**
   - Check performance metrics
   - Validate accessibility

3. **BrowserStack Device Testing**
   - Test on real devices
   - Verify cross-browser compatibility

---

*For more detailed information, refer to the main Mobile Enhancements documentation.*
