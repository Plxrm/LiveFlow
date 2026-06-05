---
name: Pluem Management System
colors:
  surface: '#f9f9ff'
  surface-dim: '#d8d9e3'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3fd'
  surface-container: '#ecedf7'
  surface-container-high: '#e6e8f2'
  surface-container-highest: '#e0e2ec'
  on-surface: '#191c23'
  on-surface-variant: '#414754'
  inverse-surface: '#2d3038'
  inverse-on-surface: '#eff0fa'
  outline: '#727785'
  outline-variant: '#c1c6d6'
  surface-tint: '#005bc0'
  primary: '#005bbf'
  on-primary: '#ffffff'
  primary-container: '#1a73e8'
  on-primary-container: '#ffffff'
  inverse-primary: '#adc7ff'
  secondary: '#2b5bb5'
  on-secondary: '#ffffff'
  secondary-container: '#759efd'
  on-secondary-container: '#00337c'
  tertiary: '#9e4300'
  on-tertiary: '#ffffff'
  tertiary-container: '#c55500'
  on-tertiary-container: '#0e0200'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc7ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#d9e2ff'
  secondary-fixed-dim: '#b0c6ff'
  on-secondary-fixed: '#001945'
  on-secondary-fixed-variant: '#00429c'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb691'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#783100'
  background: '#f9f9ff'
  on-background: '#191c23'
  surface-variant: '#e0e2ec'
typography:
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: IBM Plex Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-lg:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: IBM Plex Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  sidebar-width: 260px
  container-max-width: 1440px
  gutter: 24px
---

## Brand & Style

The design system is engineered for high-velocity e-commerce management, specifically tailored for the TikTok Live ecosystem. The brand personality is **Professional, Efficient, and Reliable**, prioritizing data density without sacrificing clarity. 

The aesthetic follows a **Corporate Modern** approach with **Minimalist** sensibilities. It utilizes a card-based architecture to organize complex logistical data into digestible modules. The interface aims to reduce cognitive load for sellers during live sessions, evoking a sense of calm control through ample white space, a cool-toned palette, and precise geometric alignment.

## Colors

The palette is anchored in a spectrum of blues to communicate stability and technical sophistication. 

- **Primary & Secondary:** Used for core branding, active states, and primary actions. The Deep Navy Blue (#0d47a1) provides high-contrast grounding for navigation.
- **Surface & Background:** A clear distinction is made between the pure white (#ffffff) workspace and the cool-tinted surface (#f8f9ff) used for grouping related content and sidebar areas.
- **Semantic Colors:** Success, Warning, and Error colors follow industry standards but are calibrated for maximum legibility against the light surface backgrounds to ensure critical live-selling alerts are never missed.

## Typography

The design system utilizes **IBM Plex Sans** to provide a technical, structured feel that ensures exceptional legibility for both English and Thai characters. 

- **Headlines:** Use SemiBold (600) weights with slight negative letter spacing to create a modern, authoritative look for page titles and section headers.
- **Body:** Set at 14px (md) and 16px (lg) for optimal readability in data-heavy tables and forms.
- **Labels:** Small, uppercase labels are used for table headers and metadata to distinguish them from actionable content.
- **Scale:** On mobile devices, large headlines scale down to maintain a balanced visual hierarchy within the smaller viewport.

## Layout & Spacing

This design system employs a **Fixed Grid** layout for the main content area to ensure dashboard widgets remain consistent across desktop monitors.

- **Grid System:** A 12-column grid with 24px gutters. Content cards typically span 3, 4, 6, or 12 columns.
- **Sidebar:** A fixed 260px sidebar persists on the left, housing the primary navigation.
- **Breakpoints:**
  - **Desktop (1200px+):** Full 12-column layout with 32px margins.
  - **Tablet (768px - 1199px):** Sidebar collapses to icons only; 8-column layout; 24px margins.
  - **Mobile (<767px):** Single column layout; 16px margins; sidebar moves to a hidden drawer (hamburger menu).
- **Rhythm:** All margins and padding follow a 4px or 8px base increment to maintain mathematical harmony.

## Elevation & Depth

Visual hierarchy is established through a combination of **Tonal Layers** and **Ambient Shadows**.

- **Level 0 (Background):** The base layer uses the Surface color (#f8f9ff) to provide a soft, low-glare canvas.
- **Level 1 (Cards):** Main content cards are pure white (#ffffff) with a subtle, highly-diffused shadow (`0 4px 12px rgba(26, 73, 232, 0.05)`). This blue-tinted shadow ensures the UI feels cohesive with the primary brand color.
- **Level 2 (Dropdowns/Modals):** Elements that float above the main UI use a more pronounced shadow (`0 8px 24px rgba(0, 0, 0, 0.08)`) and a 1px border using the Surface color to define edges against white cards.
- **Interactions:** Hover states on cards should slightly increase the shadow spread to simulate physical lift.

## Shapes

The design system utilizes a **Rounded** shape language to soften the density of the administrative data.

- **Core Elements:** A standard 12px (0.75rem) radius is applied to all primary cards, action panels, and input fields.
- **Small Elements:** Buttons, tags, and badges use a 8px (0.5rem) radius for a tighter, more precise appearance.
- **Pill Shapes:** Status badges (e.g., "Active", "Shipped") use fully rounded corners (pill-style) to distinguish them from interactive buttons.

## Components

### Buttons
- **Primary:** Solid #1a73e8 with white text. 8px border radius.
- **Secondary:** Outline style with 1px border in Primary color.
- **Ghost:** No background or border, used for low-priority actions in tables.

### Data Tables
- Header background uses Surface color (#f8f9ff) with uppercase Label-MD typography.
- Row height: 56px for standard density; 48px for compact views.
- Dividers: 1px solid line in #f0f2f5.

### Stat Cards
- Featured prominently at the top of dashboards. 
- Icons should be placed in a 40x40px rounded box with a 10% opacity background of the icon's semantic color.
- Primary metric in Headline-MD; secondary trend text in Label-SM (Success green or Error red).

### Input Fields
- Background: #ffffff. Border: 1px solid #d1d5db.
- Active state: 2px solid #1a73e8 with a 4px soft blue outer glow.
- Labels sit above the field in Label-MD weight.

### Status Badges
- Small, pill-shaped markers with 10% background opacity of their semantic color and 100% opacity for the text (e.g., Success text on light green background).