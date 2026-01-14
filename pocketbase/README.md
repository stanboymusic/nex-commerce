# PocketBase for NexCommerce

## Quick Start

### Starting the Server

```bash
# From project root
npm run pocketbase

# Or navigate to this directory
cd pocketbase
./pocketbase.exe serve
```

The server will start on **http://127.0.0.1:8090**

### Admin Access

- **Admin Panel**: http://127.0.0.1:8090/_/
- **Email**: nexcommerce9@gmail.com
- **Password**: 31671702!!

## Directory Structure

```
pocketbase/
├── pocketbase.exe       # PocketBase executable (v0.33.0)
├── pb_data/            # Database and uploaded files (gitignored)
│   ├── data.db         # SQLite database
│   └── storage/        # File uploads
└── pb_migrations/      # Database migrations (gitignored)
```

## Important Notes

> **⚠️ Data Directory**
> 
> The `pb_data` directory contains your database and uploaded files. This directory is gitignored to prevent committing sensitive data. Make sure to back it up regularly.

> **🚀 Production Deployment**
> 
> PocketBase cannot be deployed to Vercel. For production, use:
> - Fly.io (recommended)
> - Railway
> - Render
> - VPS (DigitalOcean, Linode, etc.)

## Creating Collections

1. Access the admin panel
2. Click "New collection"
3. Choose collection type (Base, Auth, or View)
4. Define your schema
5. Set up API rules

## API Endpoints

Once running, your API is available at:

- **Base URL**: http://127.0.0.1:8090/api/
- **Collections**: http://127.0.0.1:8090/api/collections/{collection}/records
- **Auth**: http://127.0.0.1:8090/api/collections/{collection}/auth-with-password

## Backup

To backup your database:

```bash
# Copy the entire pb_data directory
cp -r pb_data pb_data_backup_$(date +%Y%m%d)
```

## Resources

- [Official Documentation](https://pocketbase.io/docs/)
- [JavaScript SDK](https://github.com/pocketbase/js-sdk)
- [API Reference](https://pocketbase.io/docs/api-records/)
