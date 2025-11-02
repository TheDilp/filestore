# ☁️ FileStore

An open-source, self-hosted file storage and sharing platform. Your files, your server, your rules.

## ✨ Features

- **Simple File Management** - Upload, download, organize files and folders with an intuitive web interface
- **Chunked Uploads** - Reliable uploads for large files with automatic resume capability
- **Secure Sharing** - Generate shareable links with optional expiration dates
- **User Management** - Multi-user support with individual storage quotas
- **S3 Compatible** - Works with any S3-compatible storage (AWS S3, MinIO, Backblaze B2, Wasabi)
- **Fast & Efficient** - Built with Rust for performance, DragonflyDB for caching
- **Self-Hosted** - Complete control over your data and privacy

## 🏗️ Architecture

**Backend**

- [Rust](https://www.rust-lang.org/) + [Axum](https://github.com/tokio-rs/axum) - High-performance async web framework
- [PostgreSQL](https://www.postgresql.org/) - Reliable metadata and user storage
- [DragonflyDB](https://www.dragonflydb.io/) - Ultra-fast caching for sessions and temporary data
- S3-compatible storage - Flexible object storage backend

**Frontend**

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) - Type-safe, modern web interface
- Chunked upload with progress tracking and retry logic
- Responsive design for desktop and mobile browsers

## 🚀 Quick Start

### Prerequisites

- Rust 1.75+
- Node.js 20+
- PostgreSQL 15+
- DragonflyDB (or Redis)
- S3-compatible storage account
