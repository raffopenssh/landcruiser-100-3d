# Contributing to Land Cruiser 100 3D Parts Catalog

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Ways to Contribute

- 🐛 Report bugs
- 💡 Suggest features
- 📝 Improve documentation
- 🔧 Submit code changes
- 🚗 Add or correct parts data

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/landcruiser-100-3d.git
   ```
3. Create a branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

```bash
# Install dependencies (for geometry tools)
cd tools
npm install  # if package.json exists

# Run the server
cd ..
go run server.go
```

## Code Style

### JavaScript

- Use ES6+ features
- Use `const` and `let`, avoid `var`
- Use meaningful variable names
- Add comments for complex logic

### Go

- Follow standard Go formatting (`go fmt`)
- Handle errors appropriately
- Add comments for exported functions

### HTML/CSS

- Use semantic HTML5 elements
- Keep CSS organized by component
- Use CSS custom properties for colors/sizing

## Submitting Changes

### Pull Request Process

1. Update documentation if needed
2. Test your changes locally
3. Commit with clear messages:
   ```
   feat: add part search by category
   fix: correct oil filter part number
   docs: update installation guide
   ```
4. Push to your fork
5. Open a Pull Request

### Commit Message Format

Use conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Formatting, no code change
- `refactor:` - Code change that neither fixes nor adds
- `test:` - Adding tests
- `chore:` - Maintenance tasks

## Adding Parts Data

Parts are stored in `parts-data.js`. To add or correct parts:

1. Find the correct category in the file
2. Add/edit the part object:
   ```javascript
   {
     "partNumber": "12345-67890",
     "name": "PART NAME IN CAPS",
     "description": "Optional description",
     "quantity": 1,
     "category": "engine"
   }
   ```
3. Regenerate geometries if adding new parts:
   ```bash
   cd tools
   node generate-part-geometries.js
   ```

## Reporting Bugs

Please include:

1. **Description**: What happened vs what you expected
2. **Steps to reproduce**: How to trigger the bug
3. **Environment**: Browser, OS, device
4. **Screenshots**: If applicable
5. **Console errors**: From browser dev tools (F12)

## Feature Requests

Please include:

1. **Problem**: What problem does this solve?
2. **Solution**: How would it work?
3. **Alternatives**: Other approaches considered
4. **Priority**: Nice-to-have or essential?

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Keep discussions on-topic

## Questions?

Open an issue with the "question" label or reach out to the maintainers.

Thank you for contributing! 🚙
