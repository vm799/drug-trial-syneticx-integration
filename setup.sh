#!/bin/bash

echo "🏥 Setting up MedResearch AI Enterprise Chatbot..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if MongoDB is running (for local setup)
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running locally. Make sure to:"
    echo "   1. Install MongoDB or use MongoDB Atlas"
    echo "   2. Update MONGODB_URI in server/.env"
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server && npm install && cd ..

# Create environment file if it doesn't exist
if [ ! -f server/.env ]; then
    echo "🔧 Creating environment configuration..."
    cp server/.env.example server/.env
    echo "⚙️  Please edit server/.env with your API keys and database configuration"
fi

# Create logs directory
mkdir -p server/logs

echo "✅ Setup complete! Next steps:"
echo ""
echo "1. Edit server/.env with your configuration:"
echo "   - Add your OpenAI API key"
echo "   - Configure MongoDB URI"
echo "   - Set JWT secret"
echo ""
echo "2. Start the application:"
echo "   npm run dev:fullstack    # Run both frontend and backend"
echo "   npm run dev             # Frontend only"
echo "   npm run server:dev      # Backend only"
echo ""
echo "3. Open http://localhost:5173 for the frontend"
echo "4. Backend API will be available at http://localhost:3001"
echo ""
echo "🔒 For production deployment:"
echo "   - Use strong secrets"
echo "   - Enable SSL/TLS"
echo "   - Configure proper CORS"
echo "   - Set up monitoring"
echo ""
echo "📚 Check server/README.md for detailed documentation"
