# Puck Editor Integration

This document provides detailed information about the Puck editor integration in Dokploy.

## Overview

Dokploy now includes a visual page builder powered by [Puck](https://puckeditor.com/), allowing administrators to create custom dashboards with a drag-and-drop interface.

## Features

- **Visual Editing**: Build custom dashboards with an intuitive drag-and-drop interface
- **Built-in Blocks**: Pre-configured components for common use cases
- **Persistent Storage**: Dashboard configurations are stored as JSON files
- **Role-Based Access**: Only users with the "owner" (admin) role can edit dashboards
- **Real-time Preview**: See changes immediately as you edit

## Components

### StatCard
Displays a statistic with a title, value, and optional description.

**Fields:**
- `title` (text): The card title
- `value` (text): The statistic value
- `description` (text, optional): Additional context

### Grid
A responsive grid layout container.

**Fields:**
- `columns` (number, 1-6): Number of columns in the grid

### Markdown
Render Markdown content.

**Fields:**
- `content` (textarea): Markdown text to render

### ChartStub
A placeholder for chart visualizations.

**Fields:**
- `title` (text): Chart title
- `type` (select): Chart type (line, bar, pie)

## Usage

### Accessing the Editor

1. Navigate to `/edit/dashboard` (requires admin/owner role)
2. You'll see the Puck editor interface with your dashboard content
3. Drag components from the left sidebar onto the canvas
4. Configure each component using the fields panel
5. Click "Publish" to save your changes

### Viewing the Dashboard

1. Navigate to `/dashboard/projects`
2. The custom dashboard content will be displayed above the projects list
3. Only visible if Puck data exists for the dashboard

### Edit Button

Admin users will see an "Edit Dashboard" button on the `/dashboard/projects` page that links directly to the editor.

## Architecture

### File Structure

```
apps/dokploy/
├── lib/puck/
│   ├── config.ts          # Puck configuration and component definitions
│   └── store.ts           # File-based storage operations
├── pages/
│   ├── api/puck/
│   │   └── [...id].ts     # API routes for GET/POST operations
│   ├── edit/
│   │   └── [[...puckPath]].tsx  # Editor page
│   └── dashboard/
│       └── projects.tsx   # Updated to render Puck content
├── scripts/
│   └── seed-puck.ts       # Seed script for initial data
└── __test__/puck/
    ├── store.test.ts      # Store unit tests
    └── api.test.ts        # API route tests
```

### Data Storage

Dashboard configurations are stored as JSON files in the directory specified by the `PUCK_DATA_DIR` environment variable.

**Default locations:**
- Development: `./data/puck`
- Production: `/var/lib/dokploy/puck`

**File naming:** Each dashboard has its own JSON file named `{id}.json` (e.g., `dashboard.json`)

**Data structure:**
```json
{
  "content": [
    {
      "type": "ComponentType",
      "props": {
        "id": "unique-id",
        // component-specific props
      }
    }
  ],
  "root": {
    "props": {}
  }
}
```

### API Routes

**GET `/api/puck/[...id]`**
- Retrieves dashboard data for the given ID
- Returns 404 if the file doesn't exist
- Requires authentication and owner role

**POST `/api/puck/[...id]`**
- Saves dashboard data for the given ID
- Creates the file if it doesn't exist
- Requires authentication and owner role

### Authentication

All Puck routes are protected by authentication middleware:

1. **Editor route** (`/edit/*`): Redirects to home if not authenticated or not an owner
2. **API routes**: Returns 401 if not authenticated, 403 if not an owner
3. **Dashboard render**: Safely handles missing data (no error if Puck data doesn't exist)

## Environment Variables

| Variable | Description | Default | Production |
|----------|-------------|---------|------------|
| `PUCK_DATA_DIR` | Directory for Puck JSON files | `./data/puck` | `/var/lib/dokploy/puck` |

## Docker Configuration

### Dockerfile

The Dockerfile has been updated to:
1. Set `PUCK_DATA_DIR=/var/lib/dokploy/puck`
2. Create the puck data directory with `mkdir -p /var/lib/dokploy/puck`

### Docker Compose

If deploying with Docker Compose, add a volume for persistent storage:

```yaml
volumes:
  - dokploy-puck:/var/lib/dokploy/puck

volumes:
  dokploy-puck:
```

## Seeding Data

To initialize the dashboard with sample data:

```bash
# From the dokploy app directory
pnpm tsx scripts/seed-puck.ts
```

This creates a sample dashboard with:
- A 3-column grid
- Three stat cards (Projects, Deployments, Services)
- A chart placeholder
- Markdown welcome text

## Testing

### Running Tests

```bash
# Run all Puck tests
pnpm test -- __test__/puck/

# Run store tests only
pnpm test -- __test__/puck/store.test.ts

# Run API tests only
pnpm test -- __test__/puck/api.test.ts
```

### Test Coverage

- **Store tests**: File operations, sanitization, error handling
- **API tests**: Authentication, authorization, CRUD operations, error handling

All tests include cleanup to avoid test pollution.

## Security Considerations

1. **Path Traversal Protection**: IDs are sanitized to prevent directory traversal attacks
2. **Role-Based Access**: Only owner role can access editor and API
3. **Input Validation**: Puck handles component validation internally
4. **Authentication Required**: All routes require valid session

## Extending

### Adding New Components

1. Define the component render function in `lib/puck/config.ts`
2. Add the component configuration to `puckConfig.components`
3. Specify fields, default props, and render function
4. Update documentation

Example:
```typescript
export const puckConfig: Config = {
  components: {
    MyComponent: {
      fields: {
        text: { type: "text", label: "Text" }
      },
      defaultProps: {
        text: "Default text"
      },
      render: ({ text }) => <div>{text}</div>
    }
  }
};
```

### Custom Storage Backend

The current implementation uses file-based storage. To use a different backend (e.g., database):

1. Modify `lib/puck/store.ts` to use your storage system
2. Keep the same interface (readPuckData, writePuckData, etc.)
3. Update tests to mock your new storage system

## Troubleshooting

### Dashboard not loading
- Check that the Puck data file exists
- Verify `PUCK_DATA_DIR` points to the correct directory
- Check browser console for errors

### Edit button not visible
- Ensure you're logged in with owner role
- Check that the route `/edit/dashboard` is accessible

### Changes not saving
- Check browser network tab for API errors
- Verify write permissions on the data directory
- Check server logs for errors

### Tests failing
- Ensure test data directory is cleaned between runs
- Check that `PUCK_DATA_DIR` environment variable is set for tests
- Verify all dependencies are installed

## Future Enhancements

Potential improvements for the Puck integration:

- [ ] More built-in components (tables, forms, charts with real data)
- [ ] Database storage backend option
- [ ] Multi-user editing with conflict resolution
- [ ] Component library/marketplace
- [ ] Version history and rollback
- [ ] Preview mode before publishing
- [ ] Multiple dashboard pages
- [ ] Export/import dashboard configurations
- [ ] Real-time collaboration
- [ ] Custom CSS styling per component

## References

- [Puck Documentation](https://puckeditor.com/docs)
- [Puck GitHub](https://github.com/measuredco/puck)
- [Next.js Pages Router](https://nextjs.org/docs/pages)
