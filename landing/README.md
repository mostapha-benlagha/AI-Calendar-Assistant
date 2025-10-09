# AI Calendar Assistant Landing Page

A modern, responsive landing page for the AI Calendar Assistant project, optimized for Netlify deployment.

## 🚀 Quick Deploy to Netlify

### Option 1: Deploy from GitHub (Recommended)

1. **Fork/Clone this repository**
2. **Connect to Netlify:**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub account
   - Select this repository
   - Set build settings:
     - **Build command:** `echo 'Static site - no build required'`
     - **Publish directory:** `landing/`
   - Click "Deploy site"

### Option 2: Drag & Drop Deploy

1. **Prepare files:**
   ```bash
   cd landing
   # Ensure all files are in the landing directory
   ```

2. **Deploy:**
   - Go to [Netlify](https://netlify.com)
   - Drag the `landing` folder to the deploy area
   - Your site will be live instantly!

### Option 3: Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy:**
   ```bash
   cd landing
   netlify deploy --prod
   ```

## 📁 Project Structure

```
landing/
├── index.html          # Main landing page
├── netlify.toml        # Netlify configuration
├── _redirects          # URL redirects
├── _headers            # Security headers
├── package.json        # Project metadata
├── robots.txt          # SEO robots file
├── manifest.json       # PWA manifest
├── sitemap.xml         # SEO sitemap
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## ⚙️ Configuration Files

### `netlify.toml`
Main Netlify configuration file containing:
- Build settings
- Redirect rules
- Security headers
- Cache policies
- Plugin configurations

### `_redirects`
URL redirect rules:
- HTTPS enforcement
- Old URL redirects
- SPA fallback routing

### `_headers`
Security and performance headers:
- Security headers (XSS, CSRF protection)
- Cache policies for different file types
- CORS settings

## 🔧 Customization

### Update Domain URLs
Replace `calendar-ai-assistant.netlify.app` in:
- `sitemap.xml` ✅ Updated
- `manifest.json` ✅ Updated  
- `_redirects` ✅ Updated

### Update Meta Tags
Edit `index.html` to update:
- Site title and description
- Social media previews
- Author information

### Add Custom Headers
Edit `_headers` file to add:
- Custom security policies
- Performance optimizations
- CORS settings

## 📱 Features

- ✅ **Mobile Responsive** - Works on all devices
- ✅ **SEO Optimized** - Meta tags, structured data, sitemap
- ✅ **PWA Ready** - Manifest file included
- ✅ **Security Headers** - XSS, CSRF protection
- ✅ **Performance** - Optimized caching
- ✅ **HTTPS Ready** - SSL certificate support
- ✅ **Analytics Ready** - Google Analytics compatible

## 🎨 Styling

The landing page uses:
- **CSS Grid & Flexbox** for responsive layouts
- **CSS Animations** for interactive elements
- **Gradient Backgrounds** for modern aesthetics
- **Glassmorphism Effects** for depth
- **Mobile-First Design** for optimal performance

## 🔍 SEO Features

- **Structured Data** (JSON-LD)
- **Open Graph** meta tags
- **Twitter Cards** support
- **Sitemap** for search engines
- **Robots.txt** for crawler guidance
- **Canonical URLs** for duplicate content

## 🚀 Performance

- **Optimized Images** with proper formats
- **Lazy Loading** for better performance
- **Minified CSS/JS** (if needed)
- **CDN Ready** through Netlify
- **Cache Headers** for static assets

## 📊 Analytics

To add Google Analytics:

1. **Get your GA4 tracking ID**
2. **Add to `index.html`:**
   ```html
   <!-- Google Analytics -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'GA_MEASUREMENT_ID');
   </script>
   ```

## 🛠️ Development

### Local Development
```bash
cd landing
python -m http.server 8888
# or
npx serve .
```

### Testing
- Test responsive design on different screen sizes
- Validate HTML/CSS
- Check accessibility with screen readers
- Test performance with Lighthouse

## 📝 License

MIT License - see the main project repository for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues or questions:
- **GitHub Issues:** [Create an issue](https://github.com/mostapha-benlagha/AI-Calendar-Assistant/issues)
- **Email:** mos.benlagha@gmail.com
- **Portfolio:** [mostapha-benlagha.github.io](https://mostapha-benlagha.github.io/)

---

**Developed by [Mostapha Benlagha](https://mostapha-benlagha.github.io/)**
