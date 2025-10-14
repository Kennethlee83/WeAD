# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to security@wead.io

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

## Bug Bounty Program

We take security seriously and appreciate the security community's efforts. We offer rewards for valid security findings:

### Reward Levels

- **Critical**: $5,000 - $10,000 in WEAD tokens
  - Smart contract vulnerabilities allowing theft of funds
  - Authentication bypass
  - Remote code execution

- **High**: $2,000 - $5,000 in WEAD tokens
  - Smart contract logic errors leading to loss
  - Privilege escalation
  - SQL injection

- **Medium**: $500 - $2,000 in WEAD tokens
  - Cross-site scripting (XSS)
  - CSRF vulnerabilities
  - Information disclosure

- **Low**: $100 - $500 in WEAD tokens
  - Minor security issues
  - Best practice violations

### Scope

**In Scope:**
- Smart contracts deployed on BSC Mainnet
- Backend API (bot_simple.py)
- Web application frontend
- Blockchain integration code

**Out of Scope:**
- Third-party services
- DDoS attacks
- Social engineering
- Physical attacks

### Rules

1. Do not access or modify data belonging to others
2. Do not perform actions that could harm the availability of our services
3. Do not use automated scanners without permission
4. Provide detailed reports with reproducible steps
5. Give us reasonable time to fix the issue before public disclosure
6. Act in good faith and avoid violating privacy

## Security Best Practices

### For Users

- **Never share your private keys**
- Use hardware wallets for large amounts
- Enable 2FA where available
- Keep your software up to date
- Be cautious of phishing attempts
- Verify contract addresses before interacting

### For Developers

- **Never commit sensitive data** (.env files, private keys)
- Use environment variables for secrets
- Follow the principle of least privilege
- Validate all user inputs
- Use prepared statements for database queries
- Keep dependencies updated
- Implement rate limiting
- Use HTTPS for all communications

## Smart Contract Security

Our smart contracts follow these security practices:

- **OpenZeppelin Standards**: Using battle-tested libraries
- **Reentrancy Guards**: Protection against reentrancy attacks
- **Access Controls**: Proper permission management
- **Pausable**: Emergency stop functionality
- **Upgradability**: Safe upgrade patterns
- **Gas Optimization**: Efficient code to prevent DoS
- **Comprehensive Testing**: 95%+ test coverage
- **External Audits**: Regular security audits

## Incident Response

In case of a security incident:

1. **Detection**: Monitoring systems alert the team
2. **Assessment**: Team evaluates the severity and impact
3. **Containment**: Immediate actions to prevent further damage
4. **Eradication**: Remove the vulnerability
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Post-incident review and improvements

## Security Updates

Security updates are released as soon as possible after a vulnerability is confirmed. Users will be notified through:

- GitHub Security Advisories
- Twitter (@WeADPlatform)
- Telegram announcements
- Email to registered users

## Contact

- **Security Email**: security@wead.io
- **PGP Key**: [Available on request]
- **Response Time**: Within 48 hours

## Acknowledgments

We thank the following security researchers for their contributions:

- [List will be updated as researchers are acknowledged]

---

**Stay safe and thank you for helping keep WeAD secure!** 🔒

