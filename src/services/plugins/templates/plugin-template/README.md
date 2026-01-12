# Plugin Template

This is a template for creating Dev Forge plugins.

## Structure

```
my-plugin/
├── plugin.json      # Plugin manifest
├── index.js         # Plugin entry point
├── package.json     # Dependencies (optional)
└── README.md        # Documentation
```

## plugin.json

The plugin manifest defines:
- Plugin metadata (id, name, version, etc.)
- Permissions
- Contributed features (commands, webviews, etc.)

## index.js

The plugin entry point exports a plugin object with:
- `activate(context)` - Called when plugin is activated
- `deactivate()` - Called when plugin is deactivated

## Permissions

Define what your plugin can access:
- `readFiles` - File paths your plugin can read
- `writeFiles` - File paths your plugin can write
- `networkAccess` - Whether plugin can access network
- `modelAccess` - Model IDs your plugin can use
- `apiAccess` - API provider IDs your plugin can use

## API

Access Dev Forge features through `context.devForge`:
- `models` - Model management
- `apis` - API provider management
- `commands` - Command registration
- `ui` - UI creation
- `config` - Configuration access
- `events` - Event system
- `logger` - Logging

## Example

See `index.js` for a complete example.

