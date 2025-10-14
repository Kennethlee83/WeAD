# Contributing to WeAD

First off, thank you for considering contributing to WeAD! It's people like you that make WeAD such a great platform.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:
- Be respectful and inclusive
- Welcome newcomers
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if applicable**
- **Note your environment** (OS, Python version, Node version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any similar features in other projects**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Make sure your code follows the existing code style
5. Write a clear and descriptive commit message
6. Update documentation if needed

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/WeAD.git
cd WeAD

# Add upstream remote
git remote add upstream https://github.com/Kennethlee83/WeAD.git

# Create a branch
git checkout -b feature/your-feature-name

# Install dependencies
pip install -r requirements.txt
cd blockchain && npm install
```

## Coding Standards

### Python
- Follow PEP 8 style guide
- Use meaningful variable names
- Add docstrings to functions and classes
- Keep functions small and focused
- Write unit tests for new features

### Solidity
- Follow Solidity style guide
- Use NatSpec comments
- Write comprehensive tests
- Optimize for gas efficiency
- Include security considerations

### JavaScript
- Use ES6+ features
- Follow consistent naming conventions
- Add JSDoc comments
- Handle errors properly

## Testing

### Smart Contracts
```bash
cd blockchain
npm test
npm run test:gas
npm run coverage
```

### Python Backend
```bash
pytest tests/
python -m pytest --cov=.
```

## Commit Message Guidelines

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues and pull requests after the first line

Examples:
```
Add batch payment functionality

Implement batch micro-payments for multiple ad views
Fixes #123
```

## Smart Contract Development

### Before Submitting
- [ ] Contracts compile without errors
- [ ] All tests pass
- [ ] Gas optimization considered
- [ ] Security best practices followed
- [ ] NatSpec documentation complete

### Security Checklist
- [ ] No reentrancy vulnerabilities
- [ ] Integer overflow/underflow protected
- [ ] Access controls properly implemented
- [ ] Events emitted for important state changes
- [ ] Input validation performed

## Review Process

1. A maintainer will review your PR
2. Changes may be requested
3. Once approved, your PR will be merged
4. Your contribution will be recognized in the release notes

## Getting Help

- Join our [Telegram](https://t.me/WeADCommunity)
- Join our [Discord](https://discord.gg/WeAD)
- Email: dev@wead.io

## Recognition

Contributors will be:
- Listed in the project README
- Mentioned in release notes
- Eligible for community rewards
- Invited to contributor-only channels

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to WeAD! 🚀

