# vscreen

Turn your Android tablet or phone into a secondary virtual monitor for Linux/Wayland — streamed seamlessly over USB via ADB and VNC.

## Features

- **Wayland Native**: Works with modern Wayland compositors like Hyprland, GNOME, Sway, and Wayfire.
- **Low Latency**: Streams over a USB connection using `adb`, avoiding Wi-Fi network congestion and lag.
- **Automated Setup**: Automatically creates the virtual headless display, starts a VNC server (`wayvnc` / `gnome-remote-desktop`), and configures ADB port forwarding.
- **Interactive CLI**: Simple commands to start, stop, and check the status of your virtual displays and connections.

## Prerequisites

Before using `vscreen`, ensure you have the following installed on your Linux machine:

- **Node.js** (v18 or higher)
- **Android SDK Platform-Tools** (`adb` must be installed and available in your PATH)
- **Wayland Compositor** (Hyprland, GNOME, etc.)
- **wayvnc** (if you are using wlroots-based compositors like Hyprland or Sway)
- **VNC Viewer App**: A VNC client app installed on your Android device (e.g., AVNC, VNC Viewer).

*Note: USB Debugging must be enabled on your Android device.*

## Installation

You can install dependencies and build the project using `pnpm`. To use `vscreen` globally from any folder in your terminal, you can install it using `pnpm install -g .`:

```bash
git clone https://github.com/joelpn/vscreen.git
cd vscreen
pnpm install
pnpm run build
pnpm install -g .
```

## Usage

If you installed `vscreen` globally, you can run it directly as `vscreen`. If you prefer to run it locally without installing globally, you can use `pnpm dev <command>`.

### Start a Session

Start the virtual display, initialize VNC, and connect your Android device:

```bash
vscreen start
```

You can pass specific options to bypass the interactive prompts:

```bash
vscreen start --resolution 1920x1080 --refresh 60 --vnc-port 5900
```

**Options:**
- `-r, --resolution <res>`: Display resolution (e.g., 1920x1080)
- `--refresh <hz>`: Refresh rate in Hz (e.g., 60)
- `-p, --vnc-port <port>`: VNC port to use (default: 5900)
- `-s, --device-serial <serial>`: Specific Android device serial to use if multiple are connected
- `-c, --compositor <type>`: Force compositor type (sway, hyprland, wayfire, etc)
- `-n, --name <name>`: Name of the virtual display (e.g., HEADLESS-2)
- `-d, --daemon`: Run the session in the background (detached from the terminal)

### Run in the Background (Daemon Mode)

If you want to close the terminal without killing the session, use the `-d` flag:

```bash
vscreen start -d
```

The process will detach from the terminal and keep running silently. All output is saved to `~/.config/vscreen/vscreen.log`.

To monitor the background session:

```bash
# Check if vscreen is active
vscreen status

# Watch the live log output
tail -f ~/.config/vscreen/vscreen.log

# Stop the background session
vscreen stop
```


### Check Status

Show the current status of ADB devices, USB tunnels, active VNC servers, and virtual displays:

```bash
vscreen status
```

### Stop a Session

Clean up any active `vscreen` resources, close VNC servers, remove virtual displays, and kill ADB tunnels:

```bash
vscreen stop
```

### Manage Virtual Displays Manually

If you only want to create, list, or remove virtual displays without starting the VNC or ADB tunnel, you can use the `display` command:

```bash
# Create a headless monitor
vscreen display create --resolution 1920x1080 --refresh 60

# List active virtual monitors
vscreen display list

# Remove a specific monitor
vscreen display remove HEADLESS-1
```

## How it works

1. **Virtual Display Creation**: `vscreen` hooks into your compositor (e.g., via `hyprctl`) to spawn a headless output.
2. **VNC Server**: It launches a VNC server bound to the newly created headless output.
3. **ADB Tunneling**: It uses `adb reverse` or `adb forward` to tunnel the VNC port securely over USB to your Android device.
4. **Connecting**: Open your VNC client on Android and connect to `localhost:<port>` to view and interact with your new screen!

## Configuration

You can define default settings for your monitors and connections by creating or editing the configuration file located at `~/.config/vscreen/config.json`. This way, you don't need to pass the arguments every time you start a session.

Example `config.json`:

```json
{
  "defaultResolution": "1920x1080",
  "defaultRefresh": 60,
  "defaultVncPort": 5900,
  "vncPassword": "your_secure_password"
}
```

If these values are set in the configuration file, running a simple `vscreen start` will automatically use them. You can always override them on the fly using the CLI options.

## License

MIT
