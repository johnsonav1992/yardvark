# Auth0 Actions

This directory contains Auth0 Actions that can be managed in code and deployed via the Auth0 CLI.

## Setup

1. Install Auth0 CLI:
```bash
npm install -g @auth0/auth0-cli
```

2. Login to Auth0:
```bash
auth0 login
```

## Usage

### Deploy All Actions
```bash
npm run auth0:deploy
```

### Deploy Single Action
```bash
cd auth0-actions
auth0 actions deploy --name "allowed-signup-filters" --trigger "pre-user-registration" --code "./pre-user-registration/allowed-signup-filters.js" --runtime "node18"
```

## Directory Structure

- `pre-user-registration/` - Actions that run during user registration
  - `allowed-signup-filters.js` - Main action code
  - `allowed-signup-filters.json` - Action configuration

## Adding New Actions

1. Create a new directory for the trigger type (e.g., `post-login/`)
2. Add your action code (e.g., `my-action.js`)
3. Create a config file (e.g., `my-action.json`) with the action metadata
4. Run `npm run auth0:deploy` to deploy

## Configuration

Each action needs a JSON config file with:
- `name`: Action name in Auth0
- `code`: Path to the JS file (relative to config file)
- `supported_triggers`: Array with trigger ID and version
- `secrets`: Array of secret names used by the action
- `dependencies`: NPM dependencies (if any)
- `runtime`: Node.js runtime version