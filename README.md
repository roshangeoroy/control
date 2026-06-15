# Pixel Home Control

A visually unique, pixel-art styled web application serving as a home control wrapper for smart lights.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

## Deployment to ARM Board (am62bp1)

### 1. Initial Setup on the Board

1. **Install Node.js & npm:**
   Ensure Node.js and npm are installed on the board. On Armbian:
   ```bash
   sudo apt update
   sudo apt install nodejs npm
   ```

2. Create the target directory:
   ```bash
   mkdir -p ~/control-app
   ```

3. Install the systemd service:
   - Copy `scripts/control-home.service` to the board.
   - The service is configured for the user `orion`. Edit `scripts/control-home.service` if your username is different.
   - Move it to `/etc/systemd/system/`:
     ```bash
     sudo mv control-home.service /etc/systemd/system/
     sudo systemctl daemon-reload
     sudo systemctl enable control-home.service
     ```

### 2. Deploying Changes

Use the `deploy.sh` script (located in the `scripts/` folder) to push the latest code and restart the service. It defaults to using your local username, but you can specify `orion`:

```bash
./scripts/deploy.sh orion
```

The script will:
- Sync files using `rsync` (excluding `node_modules`, `.git`, etc.).
- Run `npm install --omit=dev` on the board.
- Restart `control-home.service`.
