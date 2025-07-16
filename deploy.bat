@echo off
echo NHAI Road Monitor - Deployment Script
echo =====================================

echo Step 1: Checking if Git is installed...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed!
    echo Please install Git from: https://git-scm.com/download/windows
    echo Then run this script again.
    pause
    exit /b 1
)

echo Step 2: Initializing Git repository...
if not exist .git (
    git init
    echo Git repository initialized.
) else (
    echo Git repository already exists.
)

echo Step 3: Adding all files to Git...
git add .

echo Step 4: Committing files...
git commit -m "Initial commit - NHAI Road Monitor App ready for deployment"

echo Step 5: Deployment Instructions
echo ================================
echo Your app is now ready for deployment to Render!
echo.
echo Next steps:
echo 1. Create a GitHub repository
echo 2. Push this code to GitHub:
echo    git remote add origin YOUR_GITHUB_REPO_URL
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3. Deploy on Render:
echo    - Go to https://render.com
echo    - Click "New" -^> "Blueprint"
echo    - Connect your GitHub repository
echo    - Render will detect render.yaml and deploy both services
echo.
echo 4. Your app will be available at:
echo    Frontend: https://nhai-road-monitor-frontend.onrender.com
echo    Backend: https://nhai-road-monitor-backend.onrender.com
echo.
pause
