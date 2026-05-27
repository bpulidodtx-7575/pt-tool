# Deployment Checklist

## ✅ Local Setup
- [ ] Run `npm install` to install dependencies
- [ ] Run `npm run dev` to test locally
- [ ] Verify all measurements work correctly
- [ ] Test in both light and dark modes
- [ ] Test on mobile (use DevTools device emulation)

## ✅ Pre-Deployment
- [ ] Run `npm run build` and verify `dist/` folder created
- [ ] Test the build: `npm run preview`
- [ ] Check for console errors in DevTools
- [ ] Update `netlify.toml` if needed (optional)
- [ ] Verify `.gitignore` is in place

## ✅ Deploy to Netlify

### Option A: Git-based deployment (easiest for updates)
1. [ ] Initialize git: `git init`
2. [ ] Create GitHub/GitLab/Bitbucket repo
3. [ ] Push code: `git add . && git commit -m "Init" && git push`
4. [ ] Go to [netlify.com](https://netlify.com)
5. [ ] Click "Add new site" → "Import an existing project"
6. [ ] Select repository
7. [ ] Build command: `npm run build`
8. [ ] Publish: `dist`
9. [ ] Deploy!

### Option B: Netlify CLI
1. [ ] Install: `npm install -g netlify-cli`
2. [ ] Run: `netlify deploy --prod`
3. [ ] Done!

### Option C: Drag & Drop
1. [ ] Run `npm run build`
2. [ ] Go to [netlify.com/drop](https://netlify.com/drop)
3. [ ] Drag `dist/` folder
4. [ ] Done!

## ✅ Post-Deployment
- [ ] Visit your live URL
- [ ] Test all calculator functionality
- [ ] Test localStorage (measurements persist)
- [ ] Verify links work (CHOA link, etc.)
- [ ] Test on mobile device
- [ ] Share with stakeholders!

## 📋 Netlify Settings (Optional Fine-Tuning)

In Netlify dashboard → Site settings:
- **Custom domain**: Add your organization's domain
- **HTTPS**: Automatic (always enabled)
- **Build hooks**: Set up for CI/CD (optional)
- **Environment variables**: Add if needed in future
- **Cache control**: Already configured in `netlify.toml`

## 🚀 Next Steps

1. Keep your repo private or public (your choice)
2. Any code changes: push to git → Netlify auto-deploys
3. Share the live URL with your team
4. Monitor Netlify dashboard for any issues

---

**Estimated time**: 5-10 minutes from start to live deployment
