#!/bin/bash

echo "🔒 SECURITY VALIDATION STARTING..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change to backend directory
if [ -d "backend" ]; then
  cd backend
elif [ -f "package.json" ]; then
  # Already in backend directory
  echo "Running from backend directory..."
else
  echo -e "${RED}❌ FAILED: Backend directory not found${NC}"
  exit 1
fi

# Check for secrets in code (exclude test files)
echo "Checking for hardcoded secrets..."
if grep -r "password.*=.*['\"]" --include="*.ts" --include="*.js" --exclude-dir="tests" --exclude-dir="__tests__" src/ | grep -v "process.env"; then
  echo -e "${RED}❌ FAILED: Hardcoded secrets found${NC}"
  exit 1
fi

if grep -r "secret.*=.*['\"]" --include="*.ts" --include="*.js" --exclude-dir="tests" --exclude-dir="__tests__" src/ | grep -v "process.env" | grep -v "secretKey" | grep -v "secretBuffer" | grep -v "secret.*new" | grep -v "secret.*Buffer"; then
  echo -e "${RED}❌ FAILED: Hardcoded secrets found${NC}"
  exit 1
fi

if grep -rE "(key|Key).*=.*['\"][A-Za-z0-9+/=]{20,}['\"]" --include="*.ts" --include="*.js" --exclude-dir="tests" --exclude-dir="__tests__" src/ | grep -v "process.env"; then
  echo -e "${RED}❌ FAILED: Hardcoded keys found (long base64-like strings)${NC}"
  exit 1
fi

echo -e "${GREEN}✅ No hardcoded secrets found${NC}"

# Check for console.logs in production code
echo "Checking for console.logs..."
if grep -r "console.log" --include="*.ts" --include="*.js" src/ | grep -v "console.error"; then
  echo -e "${YELLOW}⚠️  WARNING: console.logs found in production code${NC}"
  # Don't fail for this, just warn
fi

# Check for dangerous imports
echo "Checking for dangerous imports..."
if grep -r "import.*child_process" --include="*.ts" --include="*.js" src/; then
  echo -e "${RED}❌ FAILED: Dangerous child_process import found${NC}"
  exit 1
fi

if grep -r "import.*fs" --include="*.ts" --include="*.js" src/ | grep -v "promises"; then
  echo -e "${RED}❌ FAILED: Dangerous fs import found${NC}"
  exit 1
fi

echo -e "${GREEN}✅ No dangerous imports found${NC}"

# Check dependencies
echo "Checking for vulnerable dependencies..."
npm audit --audit-level=high
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ FAILED: Vulnerable dependencies found${NC}"
  exit 1
fi

echo -e "${GREEN}✅ No high-risk vulnerabilities in dependencies${NC}"

# Check for proper error handling
echo "Checking for proper error handling..."
if ! grep -r "process.exit(1)" --include="*.ts" src/services/; then
  echo -e "${YELLOW}⚠️  WARNING: Services should have fail-fast error handling${NC}"
fi

# Check for authentication in all API routes
echo "Checking authentication coverage..."
if grep -r "app\." --include="*.ts" src/ | grep -E "(post|put|delete)" | grep -v "health" | grep -v "AuthMiddleware"; then
  echo -e "${YELLOW}⚠️  WARNING: Some routes might lack authentication${NC}"
fi

# Check TypeScript compilation
echo "Checking TypeScript compilation..."
npx tsc --noEmit --skipLibCheck
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ FAILED: TypeScript compilation errors${NC}"
  exit 1
fi

echo -e "${GREEN}✅ TypeScript compilation successful${NC}"

# Check if critical environment variables are referenced
echo "Checking environment variable usage..."
REQUIRED_VARS=("DATABASE_URL" "JWT_PUBLIC_KEY" "JWT_PRIVATE_KEY" "DB_ENCRYPTION_KEY")

for var in "${REQUIRED_VARS[@]}"; do
  if ! grep -r "process.env.$var" --include="*.ts" src/; then
    echo -e "${RED}❌ FAILED: Required environment variable $var not used${NC}"
    exit 1
  fi
done

echo -e "${GREEN}✅ All required environment variables are referenced${NC}"

# Run security tests if they exist
echo "Running security tests..."
if [ -f "src/tests/basic.security.test.ts" ]; then
  NODE_ENV=test npm run test -- src/tests/basic.security.test.ts --no-coverage --silent 2>/dev/null
  TEST_RESULT=$?
  if [ $TEST_RESULT -ne 0 ]; then
    echo -e "${RED}❌ FAILED: Security tests failed${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Security tests passed${NC}"
else
  echo -e "${YELLOW}⚠️  WARNING: No security tests found${NC}"
fi

# Check for proper database connection
echo "Checking database configuration..."
if ! grep -r "postgresql://" --include="*.ts" --include="*.js" src/; then
  if ! grep -r "process.env.DATABASE_URL" --include="*.ts" src/; then
    echo -e "${RED}❌ FAILED: No PostgreSQL configuration found${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}✅ Database configuration looks correct${NC}"

echo -e "${GREEN}✅ SECURITY VALIDATION PASSED${NC}"
echo "🔒 All security checks completed successfully!"
echo "📊 Ready for production deployment"

exit 0