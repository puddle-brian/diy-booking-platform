# Timeline Unification Refactor - MINIMAL SCOPE ONLY

## 🚨 **CRITICAL: WHAT NOT TO TOUCH**

**DO NOT MODIFY:**
- ❌ Artist pages or artist timelines
- ❌ Offer rows or venue offer functionality  
- ❌ Any existing row expansion content
- ❌ Any styling or visual appearance
- ❌ Any data fetching or API calls
- ❌ Any file extensions (.ts to .tsx)
- ❌ Any complex JSX or clickable links
- ❌ Any transform functions with React components

**ONLY MODIFY:**
- ✅ The conditional rendering in `TabbedTourItinerary.tsx` that chooses between two timeline components
- ✅ Create ONE simple unified component that renders identical rows

---

## 🎯 **The Simple Problem**

In `TabbedTourItinerary.tsx`, there are two different timeline components being used:

```tsx
// THE PROBLEM - Two different components for the same thing
if (entry.type === 'show') {
  return <ShowTimelineItem ... />        // ← Confirmed shows
} else if (entry.type === 'show-request') {
  return <BookingRequestTimelineItem ... /> // ← Open requests  
}
```

This causes:
- Different fonts between confirmed shows and open requests
- Different row heights and spacing
- Visual inconsistency in the timeline

---

## 🎯 **The Simple Solution**

Replace the conditional rendering with ONE component that handles both:

```tsx
// THE SOLUTION - One component for everything
const unifiedEntry = transformToUnified(entry);
return <UnifiedTimelineItem entry={unifiedEntry} ... />
```

---

## 🛠️ **Implementation Steps (MINIMAL)**

### **Step 1: Create Simple Unified Component**
**File: `src/components/TimelineItems/UnifiedTimelineItem.tsx`**

- Copy the EXACT row structure from existing open request rows
- Use simple string props, NO React components or JSX
- Keep identical column widths and CSS classes
- Use placeholder text for expanded content (don't hook up real data yet)

### **Step 2: Create Simple Transform Function**
**File: `src/utils/timelineTransforms.ts`** (keep as .ts, not .tsx)

- Simple functions that convert data to strings
- No React components, no JSX, no clickable links
- Just return plain text for artist names and venue names
- Keep it minimal - just enough to render basic info

### **Step 3: Update TabbedTourItinerary (Minimal Change)**
**File: `src/components/TabbedTourItinerary.tsx`**

- Replace ONLY the conditional rendering section
- Add feature flag to toggle between old and new
- Keep all existing data fetching unchanged
- Don't modify any other functionality

---

## 📋 **Success Criteria (Simple)**

The refactor is complete when:

1. **Visual Consistency**: All timeline rows look identical (same fonts, spacing, height)
2. **No Regressions**: Everything else works exactly the same
3. **Feature Flag**: Can toggle between old and new rendering
4. **No Breaking Changes**: Artist pages, venue pages, offers all unchanged

---

## 🚫 **What This Refactor Does NOT Do**

- Does NOT add clickable links
- Does NOT modify offer rows or expansion content  
- Does NOT change artist or venue pages
- Does NOT modify any APIs or data fetching
- Does NOT change file extensions
- Does NOT add complex JSX transforms
- Does NOT redesign anything

---

## 🎯 **The End Goal**

After this refactor:
- Timeline rows look visually consistent
- Same fonts and spacing everywhere
- No functional changes to anything else
- Can be extended later for clickable links, better expansion, etc.

**This is a VISUAL CONSISTENCY fix only, not a feature enhancement.** 