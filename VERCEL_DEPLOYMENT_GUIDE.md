# ভারসেল (Vercel) দিয়ে ফ্রি ডিপ্লয়মেন্ট গাইড

আপনার "দোকান ম্যানেজার" অ্যাপটি ভারসেলে (Vercel) সম্পূর্ণ ফ্রিতে হোস্ট করার জন্য যাবতীয় ফাইল (`vercel.json`, `package.json`, Vite PWA ও Firebase Config) সম্পূর্ণ প্রস্তুত করে সেটআপ করা হয়েছে।

---

## পদ্ধতি ১: GitHub ও Vercel ড্যাশবোর্ড (সবচেয়ে সহজ ও জনপ্রিয় পদ্ধতি)

### ধাপ ১: গিটহাবে কোড আপলোড করুন
১. [GitHub.com](https://github.com) এ লগইন করে একটি নতুন রিপোজিটরি (New Repository) তৈরি করুন (নাম দিতে পারেন: `dokan-manager`)।
২. আপনার টার্মিনাল বা প্রজেক্ট ফোল্ডারে গিয়ে নিচের কমান্ডগুলো চালান:

```bash
git add .
git commit -m "Initial commit for Dokan Manager"
git branch -M main
git remote add origin https://github.com/আপনার-ইউজারনেম/dokan-manager.git
git push -u origin main
```

### ধাপ ২: ভারসেলে ডিপ্লয় করুন
১. [Vercel.com](https://vercel.com) এ যান এবং আপনার GitHub একাউন্ট দিয়ে Sign In করুন।
২. **"Add New..."** বাটনে ক্লিক করে **"Project"** সিলেক্ট করুন।
৩. GitHub থেকে আপনার তৈরি করা `dokan-manager` রিপোজিটরিটি খুঁজে বের করে **"Import"** এ চাপুন।
৪. সেটিংস কনফিগারেশন:
   - **Framework Preset:** Vite (ভারসেল নিজে থেকেই স্বয়ংক্রিয়ভাবে ডিটেক্ট করবে)
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
৫. **"Deploy"** বাটনে ক্লিক করুন। ১ মিনিটের মধ্যে আপনার ওয়েবসাইট লাইভ হয়ে যাবে এবং একটি ফ্রি লিংক পাবেন (যেমন: `dokan-manager.vercel.app`)!

---

## পদ্ধতি ২: Vercel CLI দিয়ে সরাসরি ডিপ্লয় (টার্মিনাল থেকে)

যদি গিটহাব ছাড়া সরাসরি কম্পিউটার থেকে ডিপ্লয় করতে চান:

```bash
# ১. ভারসেল সিএলআই ইন্সটল করুন
npm install -g vercel

# ২. প্রজেক্ট ফোল্ডারে কমান্ড দিন
vercel

# (টার্মিনালে লগইন করতে বলবে এবং কিছু প্রশ্ন করবে, সবগুলোতে Enter চাপুন)

# ৩. ফাইনাল প্রোডাকশন লাইভ করতে:
vercel --prod
```

---

## ⚠️ অতীব গুরুত্বপূর্ণ ধাপ: Firebase-এ Vercel ডোমেন অনুমোদন করা (Authorized Domain)

গুগল একাউন্ট দিয়ে লগইন (Google Sign-In) যেন ভারসেল লিংকে কাজ করে, সেজন্য নিচের ১টি কাজ অবশ্যই করতে হবে:

১. [Firebase Console](https://console.firebase.google.com/) এ যান।
২. আপনার প্রজেক্ট **`telemsg-app`** সিলেক্ট করুন।
৩. বাম পাশের মেনু থেকে **Build** > **Authentication** এ যান।
৪. উপরে **Settings** ট্যাবে ক্লিক করে **Authorized domains** (অনুমোদিত ডোমেন) সেকশনে যান।
৫. **"Add domain"** বাটনে ক্লিক করুন এবং আপনার ভারসেল ডোমেনটি দিন:
   - উদাহরণ: `dokan-manager.vercel.app` (অথবা আপনার কাস্টম ডোমেন)
৬. **Save** করুন।

> **নোট:** এই কাজটি না করলে গুগল দিয়ে লগইন করার সময় `auth/unauthorized-domain` এরর দেখাতে পারে।

---

## 📱 মোবাইল ও কম্পিউটারে PWA অ্যাপ ইনস্টল

ভারসেলে ডিপ্লয় হওয়ার পর ওয়েবসাইটটি অটোমেটিক HTTPS সিকিউরিটিতে চলবে। ফলে:
- **মোবাইলে (Chrome/Safari):** ভিজিট করলেই নিচে **"Add to Home Screen"** বা **"অ্যাপ ইনস্টল করুন"** প্রম্পট আসবে।
- **কম্পিউটারে (Chrome/Edge):** ব্রাউজারের অ্যাড্রেস বারের ডানে ইনস্টল আইকন (Desktop App) আসবে, যা ক্লিক করলেই সম্পূর্ণ সফটওয়্যারের মতো ইনস্টল হয়ে অফলাইনেও চালু হবে।
