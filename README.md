# Ernakulam Dine Flow 🍽️

A modern restaurant management system with digital menu and table management capabilities.

## 🚀 Live Demo

**GitHub Pages**: [https://agnesh02backup.github.io/ernakulam-dine-flow/](https://agnesh02backup.github.io/ernakulam-dine-flow/)

## 📋 Features

### Customer Interface
- **Digital Menu**: Browse food items with categories, ratings, and descriptions
- **Smart Cart**: Add/remove items with quantity controls
- **Order Management**: View cart, modify quantities, and place orders
- **Order Tracking**: Real-time order status updates
- **Bill & Payment**: Complete payment interface

### Staff Interface
- **Table Management**: Visual floor plan with table status tracking
- **Smart Seating**: Flexible seating options and table combinations
- **Guest Management**: Seat guests with flexible capacity options
- **Status Updates**: Real-time table status changes (Available, Occupied, Cleaning, Reserved)
- **Large Group Support**: Combine tables for groups of 6+ people

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/agnesh02backup/ernakulam-dine-flow.git

# Navigate to project directory
cd ernakulam-dine-flow

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🌐 Deployment

This project is automatically deployed to GitHub Pages using GitHub Actions.

### Manual Deployment

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy to GitHub Pages**:
   - Go to repository Settings
   - Navigate to Pages section
   - Select "GitHub Actions" as source
   - The workflow will automatically deploy on push to main branch

### Custom Domain

To use a custom domain:
1. Add your domain to the repository settings
2. Update the `base` path in `vite.config.ts` if needed
3. Configure DNS settings as per GitHub Pages requirements

## 📱 Responsive Design

The application is fully responsive and works on:
- 📱 Mobile devices (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large screens (1440px+)

## 🎨 Design System

- **Color Scheme**: Professional teal and orange theme
- **Typography**: Inter font family
- **Components**: Consistent shadcn/ui components
- **Animations**: Smooth transitions and hover effects

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Agnesh Kumar**
- GitHub: [@agnesh02backup](https://github.com/agnesh02backup)

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
