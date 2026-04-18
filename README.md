# Shikai

> **視界** - Your GitHub profile, refined and always in your pocket.

Shikai is an elegantly designed, mobile-first GitHub companion for developers who value clarity and sophistication. It's a read-only dashboard that gives you a beautiful, distraction-free view of your repositories, contributions, and activity-all with a refined aesthetic that feels at home on your device.

---

## Why Shikai?

GitHub's mobile experience is built for doing work: reviewing PRs, responding to issues, managing projects. But sometimes you just want to _check in_-see how your repos are doing, admire your contribution streak, or share your profile with someone at a meetup.

That's where Shikai comes in. No notifications. No write operations. No anxiety about accidentally merging something on a tiny screen. Just your GitHub data, presented clearly and beautifully.

**The name:** _Shikai_ (視界) means "field of vision" in Japanese. It's about seeing what matters-your work, your progress, your impact-without distractions.

---

## What You Can Do

### **Overview Dashboard**

- See your contribution graph at a glance with the last 52 weeks of activity
- Browse your pinned repositories with quick stats
- Catch up on recent activity: pushes, stars, forks, releases, PRs, and issues
- Tap on activity items to navigate directly to the relevant repo or details

### **Repositories**

- View all your repos with smart filters (by language, type, or sort order)
- Dive into repo details: stats, contributors, languages, topics
- Explore the full file tree and view individual files (with image preview support)
- Browse commit history with clean, readable formatting
- Track issues with filtering by open/closed state, complete with labels and assignees
- Monitor pull requests with merged/open/closed filters and review status

### **Starred Repos**

- Keep tabs on projects you've starred with the same powerful filtering as your repos
- Sort by recently starred or creation date
- Quick access to repos you care about
- Search through your starred collection

### **Profile**

- Your GitHub profile card, always ready to share
- Comprehensive stats: repos, followers, following, stars, contributions
- Social accounts integration (Twitter, LinkedIn, personal website)
- Quick access to settings

---

## Who Is This For?

- **Developers who want a quick GitHub check** without opening a browser or laptop
- **Students and learners** who want to track their coding progress and maintain their streak
- **Open source contributors** who want to monitor their repos, stars, and community engagement
- **Tech leads and maintainers** who need to keep an eye on issues and PRs across projects
- **Anyone who's proud of their GitHub activity** and wants a beautiful way to view it throughout the day
- **Developers in interviews or meetups** who want to quickly share their GitHub profile

---

## Design Philosophy

Shikai is built around three principles:

1. **Read-only by design** - No write operations means no accidental mistakes. This is your safe viewing space.
2. **Mobile-first, native feel** - Smooth animations, thoughtful spacing, and a UI that feels at home on your phone.
3. **Information at the right density** - Not too sparse, not overwhelming. Just enough detail to be useful, with deeper views when you need them.

---

## Getting Started

### Setting Up Your Access Token

Shikai uses a GitHub Personal Access Token (PAT) to securely access your data. Here's how to get started:

1. **Generate a PAT** on GitHub:
   - Go to Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Give it a descriptive name like "Shikai Mobile App"
   - Select the following scopes:
     - `repo` (for private repository access)
     - `read:user` (to read your profile information)
     - `read:org` (if you want to see organization repos)

2. **Enter the token in Shikai**:
   - Open the app for the first time
   - Paste your token when prompted
   - The token is stored securely on your device using `expo-secure-store`

3. **You're all set!** Start exploring your GitHub world.

**Security Note:** Your token never leaves your device. All API requests go directly from your phone to GitHub. No servers, no third-party storage, just you and GitHub's API.

---

Built with care by yours truly [Atharv Dange](https://x.com/atharvdangedev)(Midnightcoder).

Designed for developers who want to stay inspired by their work, wherever they are.
