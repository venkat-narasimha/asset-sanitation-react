# asset-sanitation-react

React SPA frontend for ERPClaw asset sanitation app — manages BOMs, asset groups, sanitation orders, workstations.

## Tech Stack

- **React 18** — UI framework
- **React Router v6** — client-side routing
- **Vite** — build tool and dev server
- **ECharts** — charts and visualizations
- **CSS Modules** — component-scoped styling

## Features

- **Dashboard** — KPI cards, order status chart, daily volume chart, orders by group
- **Sanitation Orders** — list, filter, search, pagination, detail view, start/complete/cancel workflow
- **Asset Groups** — create, edit, view linked ERPNext assets
- **BOMs** — view BOMs with allergen flags, BOM items, linked work orders
- **Work Orders** — list ERPNext work orders, create sanitation orders
- **Workstations** — manage production line workstations
- **ERPNext Assets** — view cached asset data

## Architecture

```
User Browser
    ↓ HTTPS
nginx (pbapps.duckdns.org)
    ↓ /asset-sanitation/*
FastAPI (erp_custom_apps_api)
    ↓               ↓
Custom MariaDB    ERPNext (read-only)
```

## Auth

Token-based authentication via FastAPI backend. Token stored in localStorage as `auth_token`.

## API Base

`/api/v1/` — proxied through nginx to FastAPI container

## Related

- Backend: [erp-custom-backend](https://github.com/venkat-narasimha/erp-custom-backend)
