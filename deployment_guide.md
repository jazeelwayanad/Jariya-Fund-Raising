# Deployment Guide: Jariya App on DigitalOcean (Systemd + Nginx)

This guide outlines the steps to deploy your Next.js application to a DigitalOcean droplet that already hosts other applications. We will use `systemd` to manage the process instead of PM2.

v## 1. Prerequisites & DNS Setup

1.  **Node.js (v20+)** installed on the server.
2.  **PostgreSQL Database** access.
3.  **DNS Configuration**:
    *   Go to your Domain Registrar (Godaddy, Namecheap, etc.) or DigitalOcean Networking.
    *   Add an **A Record** for your domain (e.g., `donate` or `@` for root).
    *   **Value/Target**: Your DigitalOcean Droplet IP Address (e.g., `123.45.67.89`).
    *   *Wait for a few minutes for propagation.*

## 2. Prepare the Application on Server

1.  **Clone or Upload** your project code to the server (e.g., `/var/www/jariya`).
    ```bash
    cd /var/www/jariya
    git pull origin main  # or upload files via SFTP
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**:
    Create a `.env` file with your production secrets.
    ```bash
    nano .env
    ```
    Content:
    ```env
    DATABASE_URL="postgresql://user:password@host:port/database"
    NEXTAUTH_SECRET="your-production-secret"
    NEXTAUTH_URL="https://donate.yourdomain.com"
    # Add other keys (RAZORPAY_KEY_ID, etc.)
    ```

4.  **Build the Application**:
    ```bash
    npm run build
    ```

5.  **Database Migration**:
    Apply the schema to your production database.
    ```bash
    npx prisma db push
    ```

## 3. Configure Systemd Service

Since you have other apps running, we need to ensure this app runs on a unique port (e.g., **3001**).

1.  **Create the service file**:
    ```bash
    sudo nano /etc/systemd/system/jariya.service
    ```

2.  **Paste the following configuration**:
    *Replace `/var/www/jariya` with your actual project path and `root` with your user if different.*

    ```ini
    [Unit]
    Description=Jariya Next.js Application
    After=network.target

    [Service]
    User=root
    Group=root
    WorkingDirectory=/var/www/jariya
    Environment=NODE_ENV=production
    Environment=PORT=3001
    # You can load env vars from file, but explicit PORT is safer here for Next.js
    # Ensure .env file exists in WorkingDirectory

    ExecStart=/usr/bin/npm start
    
    Restart=always
    RestartSec=3

    [Install]
    WantedBy=multi-user.target
    ```

3.  **Reload Systemd and Start Service**:
    ```bash
    sudo systemctl daemon-reload
    sudo systemctl enable jariya
    sudo systemctl start jariya
    ```

4.  **Check Status**:
    ```bash
    sudo systemctl status jariya
    ```
    You should see `Active: active (running)`.

## 4. Configure Nginx Reverse Proxy

1.  **Create a new Nginx server block**:
    ```bash
    sudo nano /etc/nginx/sites-available/jariya
    ```

2.  **Paste the configuration**:
    *Replace `donate.yourdomain.com` with your actual domain.*

    ```nginx
    server {
        listen 80;
        server_name donate.yourdomain.com;

        location / {
            proxy_pass http://localhost:3001; # Matches the PORT in systemd
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

3.  **Enable the Site**:
    ```bash
    sudo ln -s /etc/nginx/sites-available/jariya /etc/nginx/sites-enabled/
    ```

4.  **Test Nginx Configuration**:
    ```bash
    sudo nginx -t
    ```
    *If successful, restart Nginx:*
    ```bash
    sudo systemctl restart nginx
    ```

## 5. Setup SSL (HTTPS)

Use Certbot to automatically secure your domain.

```bash
sudo certbot --nginx -d donate.yourdomain.com
```

Follow the prompts to redirect HTTP to HTTPS.

---

## 6. Maintenance (Updating the App)

When you have new code changes:

1.  **Pull changes**:
    ```bash
    cd /var/www/jariya
    git pull
    ```
2.  **Install & Build**:
    ```bash
    npm install
    npm run build
    npx prisma generate
    ```
3.  **Restart Service**:
    ```bash
    sudo systemctl restart jariya
    ```

## 7. Troubleshooting

### High CPU Usage
If you notice high CPU usage, it is likely because **sharp** (image optimization library) is missing.
1.  Run `npm install sharp` in your project directory on the server.
2.  Restart the service: `sudo systemctl restart jariya`.

### Logs
Check logs if the app isn't starting:
```bash
journalctl -u jariya -f
```

## 8. Maintenance Operations

### Clear Cache & Fresh Build
If you face weird issues or want to ensure a completely clean start:
1.  Stop the service:
    ```bash
    sudo systemctl stop jariya
    ```
2.  Remove the build folder:
    ```bash
    rm -rf .next
    ```
3.  Install & Build:
    ```bash
    npm install
    npm run build
    ```
4.  Start the service:
    ```bash
    sudo systemctl start jariya
    ```

### Reset Database (Data Loss Warning!)
To wipe the database and start fresh (e.g., re-seeding admin):
*   **WARNING**: This deletes ALL data.

```bash
# 1. Reset Schema and Data
npx prisma db push --force-reset

# 2. Seed Initial Data (Admin, etc.)
npx prisma db seed
```
