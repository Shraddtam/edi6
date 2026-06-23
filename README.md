
Install JavaScript dependencies:

```powershell
npm install
```

Generate Prisma client:

```powershell
npx prisma generate
```

Apply migrations to Supabase:

```powershell
npm run db:deploy
```

Start Next.js app:

```powershell
npm run dev
```

Create and activate Python virtual environment:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install ML dependencies:

```powershell
npm run ml:install
```

Start ML service:

```powershell
npm run ml:service
```

Build the app:

```powershell
npm run build
```

Type-check:

```powershell
npx tsc --noEmit
```
