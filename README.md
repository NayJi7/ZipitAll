# ZipitAll

Compress, decompress and preview archives directly from VS Code.

Supports `.zip`, `.vsix`, `.crx` (v3), `.asar`, `.tgz`, `.gzip`, `.br`, `.tar`, `.bz2`, `.7z`.

> This extension is based on [vscode-archive](https://github.com/tjx666/vscode-archive) by [YuTengjing](https://github.com/tjx666).

## Features

### Decompress

Decompress `.zip`, `.vsix`, `.crx` (v3), `.asar`, `.tgz`, `.gzip`, `.br`, `.tar`, `.bz2`, `.7z` — right-click any archive in the explorer and select **Decompress Here**.

#### Smart Flatten

Automatically flattens redundant top-level folders that share the archive name, avoiding unnecessary nesting:

```
Before: archive.zip → archive/ → archive/ → files...
After:  archive.zip → archive/ → files...
```

Enabled by default. Disable via the `zipitall.smartFlatten` setting.

### Compress

Compress files or folders to `.zip`, `.vsix`, `.asar`, `.tgz`, `.gzip`, `.br`, `.tar`, `.bz2`, `.7z` — right-click in the explorer and pick a format from the **Compress** submenu.

### Archive Preview

Open any supported archive to browse its contents in a tree view, preview files inline, and extract individual entries.

## Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `zipitall.smartFlatten` | `boolean` | `true` | Flatten single top-level folder matching archive name |
| `zipitall.preview.enabled` | `boolean` | `true` | Enable archive preview editor |
| `zipitall.preview.filePreviewEnabled` | `boolean` | `true` | Enable file preview from within archives |
| `zipitall.preview.maxArchiveSizeMB` | `number` | `100` | Max archive size (MB) before confirmation dialog |
| `zipitall.preview.maxFileSizeMB` | `number` | `10` | Max file size (MB) before confirmation dialog |

## Requirements

### Bzip2

The `bzip2` executable must be available in your shell.

- **macOS / Linux**: usually pre-installed.
- **Windows**: [install bzip2](https://www.google.com/search?q=bzip2+windows).

### 7zip

The `7z` executable must be available in your shell.

Download from the [7-zip official website](https://www.7-zip.org/).

## Acknowledgements

- Based on [vscode-archive](https://github.com/tjx666/vscode-archive) by [YuTengjing](https://github.com/tjx666) — thank you for the original work.
- [compressing](https://github.com/node-modules/compressing) — easy-to-use compress/decompress API.

## License

[MIT](LICENSE)
