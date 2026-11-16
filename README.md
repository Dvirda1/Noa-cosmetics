# Noa Cosmetics - פרויקט האתר

## מבנה
- `site/` - האתר עצמו (`index.html` + תיקיית `images/`). זה מה שעולה לאינטרנט.
- `apps-script/` - הקוד שרץ ב-Google (תורים, התראות, תזכורות, תוכן מהגיליון).

## התקנה חד-פעמית
1. התקן VS Code (code.visualstudio.com), Node.js (nodejs.org) ו-Git (git-scm.com).
2. פתח את VS Code ← File ← Open Folder ← בחר את התיקייה הזו.
3. VS Code יציע להתקין תוספים (Live Server, Prettier). אשר.

## עבודה על האתר
- לתצוגה חיה: קליק ימני על `site/index.html` ← Open with Live Server.
- לשינוי תמונות: שים אותן ב-`site/images/` ועדכן את הרשימה `const IMG=[...]` בתחילת ה-script.
- שים לב: שורת `const API='...'` היא הכתובת של Apps Script, אל תמחק אותה.

## העלאה לאינטרנט (פעם אחת)
1. צור מאגר ב-github.com בשם noa-site, ובטרמינל של VS Code (Terminal ← New Terminal):
   git init
   git add .
   git commit -m "first version"
   git branch -M main
   git remote add origin https://github.com/YOUR_USER/noa-site.git
   git push -u origin main
2. חבר את המאגר ל-Cloudflare Pages או ל-Vercel (Import Git Repository), בתיקיית הפרסום (Output directory) כתוב `site`.
3. מכאן כל שינוי: git add . / git commit -m "תיאור" / git push - והאתר מתעדכן לבד.

## עבודה על Apps Script מ-VS Code (clasp)
התקנה חד-פעמית:
   npm install -g @google/clasp
   clasp login
1. הפעל את Apps Script API בכתובת script.google.com/home/usersettings
2. ב-Apps Script: Project Settings (גלגל שיניים) ← IDs ← Script ID. העתק אותו לקובץ `.clasp.json` במקום PASTE_SCRIPT_ID_HERE.

אחרי כל שינוי ב-`apps-script/Code.gs`:
   clasp push
   clasp deploy -i AKfycbw3nViWy8ztmxbpXAedS_mfhWgNlhUCerEdICTXRTUaEpZhkr_o6R7yzZz2RrQQBs2JjA -d "תיאור השינוי"
הפקודה השנייה מעדכנת את הפריסה הקיימת, והכתובת נשארת אותה כתובת.

חשוב: Apps Script ממשיך לרוץ אצל Google. ב-VS Code רק כותבים ומעלים את הקוד.
