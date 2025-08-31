# Connect 4 Board Customization Guide

This guide explains how to customize the Connect 4 game board layout, spacing, and visual appearance.

## Board Layout Structure

The Connect 4 board consists of:
- **Column Headers**: Top tabs showing vote counts and column numbers
- **Game Board**: The main playing area with 7 columns × 6 rows
- **Board Container**: Wrapper that ensures proper alignment

## Key Dimensions

### Current Configuration
- **Cell Size**: 80px × 80px (5rem × 5rem)
- **Column Gap**: 12px (0.75rem)
- **Board Padding**: 24px (1.5rem)
- **Total Board Width**: 560px (35rem)
- **Column Header Height**: 48px (3rem)

### Calculation Formula
```
Total Width = (7 columns × 80px) + (6 gaps × 12px) + (2 × 24px padding)
Total Width = 560px + 72px + 48px = 680px
```

## Customization Options

### 1. Adjusting Cell Size

To change the size of individual game pieces:

**In `client/src/components/GameView.tsx`:**
```tsx
// Change cell dimensions
<div className="w-20 h-20"> // Current: 80px × 80px
<div className="w-16 h-16"> // Smaller: 64px × 64px
<div className="w-24 h-24"> // Larger: 96px × 96px
```

**In `client/src/index.css`:**
```css
.connect4-cell {
  @apply w-20 h-20; /* Adjust these values */
}
```

**In `client/tailwind.config.js`:**
```js
spacing: {
  'board-cell': '5rem', // Adjust this value
},
width: {
  'board-cell': '5rem', // Adjust this value
},
height: {
  'board-cell': '5rem', // Adjust this value
},
```

### 2. Adjusting Column Spacing

To change the gap between columns:

**In `client/src/components/GameView.tsx`:**
```tsx
// Change grid gap
<div className="grid grid-cols-7 gap-3"> // Current: 12px gap
<div className="grid grid-cols-7 gap-2"> // Smaller: 8px gap
<div className="grid grid-cols-7 gap-4"> // Larger: 16px gap
```

**In `client/tailwind.config.js`:**
```js
spacing: {
  'board-gap': '0.75rem', // Adjust this value
},
```

### 3. Adjusting Board Padding

To change the internal padding of the board:

**In `client/src/components/GameView.tsx`:**
```tsx
// Change board padding
<div className="connect4-board overflow-hidden border-t-0 p-6"> // Current: 24px
<div className="connect4-board overflow-hidden border-t-0 p-4"> // Smaller: 16px
<div className="connect4-board overflow-hidden border-t-0 p-8"> // Larger: 32px
```

**In `client/tailwind.config.js`:**
```js
spacing: {
  'board-padding': '1.5rem', // Adjust this value
},
```

### 4. Adjusting Column Header Height

To change the height of the column tabs:

**In `client/src/components/GameView.tsx`:**
```tsx
// Change header height
<div className="connect4-column-header w-20 h-12"> // Current: 48px height
<div className="connect4-column-header w-20 h-10"> // Smaller: 40px height
<div className="connect4-column-header w-20 h-16"> // Larger: 64px height
```

**In `client/tailwind.config.js`:**
```js
height: {
  'board-header': '3rem', // Adjust this value
},
```

### 5. Adjusting Board Container Width

To change the overall board width:

**In `client/src/components/GameView.tsx`:**
```tsx
// Change container max-width
<div className="w-full max-w-[560px]"> // Current: 560px
<div className="w-full max-w-[640px]"> // Larger: 640px
<div className="w-full max-w-[480px]"> // Smaller: 480px
```

**In `client/tailwind.config.js`:**
```js
width: {
  'board-container': '35rem', // Adjust this value
},
```

## Visual Styling Customization

### 1. Board Colors

**In `client/tailwind.config.js`:**
```js
colors: {
  'connect-red': '#e53e3e',      // Red team pieces
  'connect-yellow': '#ecc94b',   // Yellow team pieces
  'board-blue': '#2d3748',       // Board background
  'board-dark': '#1a202c',       // Board border
},
```

### 2. Column Header Styling

**In `client/src/index.css`:**
```css
.connect4-column-header {
  @apply bg-gradient-to-b from-gray-50 to-gray-100 rounded-t-xl border-2 border-b-0 border-gray-300 shadow-sm;
}
```

### 3. Game Cell Styling

**In `client/src/index.css`:**
```css
.connect4-cell {
  @apply w-20 h-20 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200;
}

.connect4-cell.red {
  @apply bg-red-500 border-red-600;
}

.connect4-cell.yellow {
  @apply bg-yellow-500 border-yellow-600;
}

.connect4-cell.empty {
  @apply bg-gray-100 border-gray-300;
}
```

## Responsive Design

The board automatically adjusts for different screen sizes using Tailwind's responsive prefixes:

- `lg:` - Large screens (1024px+)
- `xl:` - Extra large screens (1280px+)
- `2xl:` - 2X large screens (1536px+)

## Best Practices

1. **Maintain Proportions**: Keep cell width and height equal for circular pieces
2. **Consistent Spacing**: Use the same gap values for both column headers and game cells
3. **Proper Alignment**: Ensure column headers align perfectly with game columns
4. **Adequate Padding**: Provide enough board padding so headers don't overlap with rounded corners
5. **Visual Hierarchy**: Use horizontal padding slightly larger than vertical padding to emphasize columns

## Example: Creating a Larger Board

To create a larger board with 96px cells and 16px gaps:

1. Update cell dimensions to `w-24 h-24`
2. Update grid gap to `gap-4`
3. Update board padding to `p-8`
4. Update column header dimensions to `w-24 h-16`
5. Recalculate container width: `(7 × 96px) + (6 × 16px) + (2 × 32px) = 800px`
6. Update container max-width to `max-w-[800px]`

## Troubleshooting

- **Misaligned Columns**: Ensure column headers and game cells use the same width and gap values
- **Overlapping Headers**: Increase board padding or reduce header height
- **Responsive Issues**: Test on different screen sizes and adjust breakpoint values
- **Performance**: Large cell sizes may impact performance on mobile devices
