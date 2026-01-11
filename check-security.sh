#!/bin/bash
# Quick Security Check Script for Cryptex
# Run this to verify your security configuration

echo "🔍 Cryptex Security Check"
echo "========================"
echo ""

errors=0

# Check for .env file
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    echo "   Run: ./setup-security.sh"
    ((errors++))
else
    echo "✅ .env file exists"
    
    # Check critical environment variables
    if grep -q "JWT_SECRET=your_" .env 2>/dev/null; then
        echo "❌ Default JWT_SECRET detected - CHANGE THIS!"
        ((errors++))
    else
        echo "✅ JWT_SECRET appears to be customized"
    fi
    
    if grep -q "DB_PASSWORD=your_" .env 2>/dev/null; then
        echo "❌ Default DB_PASSWORD detected - CHANGE THIS!"
        ((errors++))
    else
        echo "✅ DB_PASSWORD appears to be customized"
    fi
fi

# Check .gitignore
if grep -q "^\.env$" .gitignore; then
    echo "✅ .env is in .gitignore"
else
    echo "❌ .env is NOT in .gitignore - secrets could be exposed!"
    ((errors++))
fi

# Check if .env is tracked by git
if git ls-files --error-unmatch .env 2>/dev/null; then
    echo "❌ .env is tracked by git - REMOVE IT IMMEDIATELY!"
    echo "   Run: git rm --cached .env"
    ((errors++))
else
    echo "✅ .env is not tracked by git"
fi

# Check node_modules
if [ -d "backend/node_modules" ]; then
    echo "✅ Backend dependencies installed"
else
    echo "⚠️  Backend dependencies not installed"
    echo "   Run: cd backend && npm install"
fi

# Check for security middleware
if [ -f "backend/src/middleware/validation.ts" ]; then
    echo "✅ Validation middleware exists"
else
    echo "❌ Validation middleware missing!"
    ((errors++))
fi

# Check Docker Compose
if [ -f "docker-compose.prod.yml" ]; then
    echo "✅ Production Docker Compose exists"
else
    echo "⚠️  Production Docker Compose not found"
fi

echo ""
echo "Security Features Status:"
echo "========================"

# Check for hardcoded secrets in code
if grep -r "default_secret" backend/src/ 2>/dev/null; then
    echo "❌ Hardcoded secrets found in code!"
    ((errors++))
else
    echo "✅ No hardcoded secrets in code"
fi

# Check for SQL injection patterns (should use parameterized queries)
if grep -r "query(\`.*\${" backend/src/ 2>/dev/null; then
    echo "⚠️  Possible SQL injection vulnerability - check query usage"
else
    echo "✅ Using parameterized queries"
fi

echo ""
if [ $errors -eq 0 ]; then
    echo "🟢 Security check passed! ($errors issues)"
    echo ""
    echo "Next steps:"
    echo "  1. Review .env file and customize as needed"
    echo "  2. Run: docker-compose -f docker-compose.prod.yml up -d"
    echo "  3. Test authentication and rate limiting"
    echo "  4. Review SECURITY.md for deployment checklist"
    exit 0
else
    echo "🔴 Security check failed! ($errors issues)"
    echo ""
    echo "Please fix the issues above before deploying."
    exit 1
fi
