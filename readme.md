# U.S. Housing Affordability Dashboard - Lab 6

**Live URL:** https://NaamaAl12.github.io/Housing-Dashboard

## Overview

This smart dashboard visualizes housing affordability across U.S. states using median household income as the primary metric. The dashboard is built with Mapbox GL JS for the interactive map and C3.js for the data visualizations.

All income data comes from the **U.S. Census Bureau, American Community Survey (ACS) 1-Year Estimates, 2023**.

---

## Features

- **Choropleth Map** - All 50 U.S. states shaded by median household income, with hover tooltips showing the state name and income value.
- **Dynamic Income Counter** - Displays the average median income for states currently visible in the map viewport, updates automatically as you zoom and pan.
- **Bar Chart** - Top states by income in the current map view, updates dynamically.
- **Income by Age Group** - Click any state to see median income broken down by age group (15-24, 25-44, 45-64, 65+).
- **Income by Race** - Click any state to see median income broken down by race and ethnicity.

---

## Why a Choropleth Map?

A choropleth map was chosen for this dashboard for the following reasons:

1. **State-level aggregated data** - Median household income is a continuous value aggregated at the state level. Choropleth maps are specifically designed for showing how a single variable varies across predefined geographic regions.

2. **Regional patterns are immediately visible** - Shading entire regions by color makes it easy to spot geographic clusters at a glance, such as higher incomes in the Northeast and Pacific Coast vs. lower incomes in the South or East Coast.

3. **Familiar and accessible** - Choropleth maps are widely understood by general audiences for state and county level statistics, which makes the dashboard more readable.

> **Limitation acknowledged:** Choropleth maps can draw more visual attention to larger states regardless of their income value. This is a pretty known cartographic trade-off.

---

## Data Sources

| Dataset | Source | Link |
|---------|--------|-------|
| Median Household Income by State (2023) | U.S. Census Bureau, ACS 1-Year Estimates | [data.census.gov](https://data.census.gov/table/ACSST1Y2024.S1903) |
| U.S. States GeoJSON Boundaries | PublicaMundi / Natural Earth | [GitHub](https://github.com/PublicaMundi/MappingAPI) |

---

## File Structure
```
Housing-Dashboard/
│   index.html
│   readme.md
├── css/
│       style.css
├── data/
│       ACSST1Y2024.S1903-2026-02-19T050443.csv
└── js/
        main.js
```

---

## How to Use

- **Hover** over any state to see its median household income.
- **Zoom and pan** the map to filter the bar chart and income counter to visible states.
- **Click** any state to see income breakdowns by age group and race.

---

## Author/Credits

- Naama Al-Musawi
- GEOG 458, University of Washington
- Instructor: Bo Zhao
